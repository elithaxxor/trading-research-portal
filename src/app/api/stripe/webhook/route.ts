import type Stripe from "stripe";

import { getStripeWebhookSecret } from "@/lib/billing/config";
import { upsertStripeCustomerMapping } from "@/lib/billing/customers";
import {
  recordSubscriptionEvent,
  syncSubscriptionFromStripe,
} from "@/lib/billing/subscriptions";
import { getStripeClient } from "@/lib/billing/stripe";
import { captureSafeException } from "@/lib/monitoring/sentry";
import type { BillingSupabaseClient } from "@/lib/billing/types";
import { recordOpsEventSafely } from "@/lib/ops/events";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StoredWebhookEvent = {
  processing_status: string;
  stripe_event_id: string;
};

function asBillingClient(client: unknown): BillingSupabaseClient {
  return client as BillingSupabaseClient;
}

function jsonResponse(payload: unknown, status = 200) {
  return Response.json(payload, { status });
}

function getStripeObjectId(value: string | { id: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getEventErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown webhook error.";
}

function getCheckoutSessionSubscriptionId(session: Stripe.Checkout.Session) {
  return getStripeObjectId(session.subscription);
}

function getCheckoutSessionCustomerId(session: Stripe.Checkout.Session) {
  return getStripeObjectId(session.customer);
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const invoiceWithLegacySubscription = invoice as Stripe.Invoice & {
    parent?: {
      subscription_details?: {
        subscription?: string | null;
      } | null;
    } | null;
    subscription?: string | Stripe.Subscription | null;
  };

  return (
    getStripeObjectId(invoiceWithLegacySubscription.subscription) ??
    invoiceWithLegacySubscription.parent?.subscription_details?.subscription ??
    null
  );
}

function getInvoiceCustomerId(invoice: Stripe.Invoice) {
  return getStripeObjectId(invoice.customer);
}

async function getStoredWebhookEvent(
  billingDb: BillingSupabaseClient,
  eventId: string
) {
  const { data, error } = await billingDb
    .from<StoredWebhookEvent>("stripe_webhook_events")
    .select("stripe_event_id,processing_status")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to check Stripe webhook idempotency.");
  }

  return data;
}

async function storeReceivedWebhookEvent(
  billingDb: BillingSupabaseClient,
  event: Stripe.Event
) {
  const stored = await getStoredWebhookEvent(billingDb, event.id);

  if (stored?.processing_status === "processed") {
    return "processed";
  }

  const payload = {
    api_version: event.api_version ?? null,
    error: null,
    event_type: event.type,
    payload: event,
    processing_status: "received",
    stripe_event_id: event.id,
  };

  const { error } = stored
    ? await billingDb
        .from("stripe_webhook_events")
        .update(payload)
        .eq("stripe_event_id", event.id)
    : await billingDb.from("stripe_webhook_events").insert(payload);

  if (error) {
    throw new Error("Unable to store Stripe webhook event.");
  }

  return "received";
}

async function markWebhookEventProcessed(
  billingDb: BillingSupabaseClient,
  eventId: string
) {
  const { error } = await billingDb
    .from("stripe_webhook_events")
    .update({
      error: null,
      processed_at: new Date().toISOString(),
      processing_status: "processed",
    })
    .eq("stripe_event_id", eventId);

  if (error) {
    throw new Error("Unable to mark Stripe webhook event processed.");
  }
}

async function markWebhookEventFailed(
  billingDb: BillingSupabaseClient,
  eventId: string,
  errorMessage: string
) {
  const { error } = await billingDb
    .from("stripe_webhook_events")
    .update({
      error: errorMessage,
      processed_at: new Date().toISOString(),
      processing_status: "failed",
    })
    .eq("stripe_event_id", eventId);

  if (error) {
    console.error("Unable to mark Stripe webhook event failed.");
  }
}

async function retrieveSubscription(subscriptionId: string) {
  return getStripeClient().subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice.payment_intent"],
  });
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const customerId = getCheckoutSessionCustomerId(session);
  const subscriptionId = getCheckoutSessionSubscriptionId(session);
  const userId = session.metadata?.supabase_user_id;

  if (!customerId) {
    throw new Error("Checkout session is missing a Stripe customer ID.");
  }

  if (!userId) {
    throw new Error("Checkout session is missing Supabase user metadata.");
  }

  await upsertStripeCustomerMapping(
    userId,
    customerId,
    session.customer_details?.email ?? session.customer_email ?? null
  );

  if (!subscriptionId) {
    throw new Error("Checkout session is missing a Stripe subscription ID.");
  }

  const subscription = await retrieveSubscription(subscriptionId);
  await syncSubscriptionFromStripe(subscription, event.id);

  await recordOpsEventSafely({
    entityType: "stripe_checkout_session",
    eventName: "checkout_completed",
    metadata: {
      billing_interval: session.metadata?.billing_interval ?? null,
      event_type: event.type,
      requested_tier: session.metadata?.requested_tier ?? null,
      subscription_synced: true,
    },
    route: "/api/stripe/webhook",
    source: "webhook",
    userId,
  });
}

async function handleSubscriptionEvent(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  await syncSubscriptionFromStripe(subscription, event.id);
}

async function handleInvoiceEvent(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  const customerId = getInvoiceCustomerId(invoice);

  if (subscriptionId) {
    const subscription = await retrieveSubscription(subscriptionId);
    await syncSubscriptionFromStripe(subscription, event.id);
    return;
  }

  await recordSubscriptionEvent({
    eventType: event.type,
    note: "Invoice event did not include a linked subscription.",
    sourceEventId: event.id,
    stripeCustomerId: customerId,
  });
}

async function handleInformationalEvent(event: Stripe.Event) {
  const object = event.data.object as {
    customer?: string | { id: string } | null;
    id?: string;
    subscription?: string | { id: string } | null;
  };

  await recordSubscriptionEvent({
    eventType: event.type,
    note: "Informational Stripe billing event recorded; no access change was applied.",
    sourceEventId: event.id,
    stripeCustomerId: getStripeObjectId(object.customer),
    stripeSubscriptionId: getStripeObjectId(object.subscription) ?? object.id,
  });
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event);
      return;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionEvent(event);
      return;
    case "invoice.paid":
    case "invoice.payment_failed":
      await handleInvoiceEvent(event);
      return;
    case "invoice.payment_action_required":
    case "customer.subscription.trial_will_end":
      await handleInformationalEvent(event);
      return;
    default:
      await recordSubscriptionEvent({
        eventType: event.type,
        note: "Unhandled Stripe webhook event type received and acknowledged.",
        sourceEventId: event.id,
      });
  }
}

// Stripe webhooks are the billing source of truth. The frontend Checkout action
// can only create a Stripe-hosted session; it never grants access. Event storage
// and processed-state checks make webhook handling idempotent.
export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return jsonResponse({ error: "Missing Stripe webhook signature." }, 400);
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch {
    return jsonResponse({ error: "Invalid Stripe webhook signature." }, 400);
  }

  const billingDb = asBillingClient(createSupabaseAdminClient());

  try {
    const storeStatus = await storeReceivedWebhookEvent(billingDb, event);

    if (storeStatus === "processed") {
      return jsonResponse({ duplicate: true, received: true });
    }

    await processStripeEvent(event);
    await markWebhookEventProcessed(billingDb, event.id);

    return jsonResponse({ received: true });
  } catch (error) {
    const errorMessage = getEventErrorMessage(error);
    await markWebhookEventFailed(billingDb, event.id, errorMessage);
    captureSafeException(error, {
      area: "billing",
      extra: {
        event_type: event.type,
        stripe_event_id_present: Boolean(event.id),
      },
      route: "/api/stripe/webhook",
      stage: "stripe_webhook_processing",
    });
    console.error(`Stripe webhook ${event.id} failed: ${errorMessage}`);

    return jsonResponse({ error: "Stripe webhook processing failed." }, 500);
  }
}
