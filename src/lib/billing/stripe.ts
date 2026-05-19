import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();

  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY. Configure it server-side only.");
  }

  return key;
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      appInfo: {
        name: "Trading Research Portal",
        version: "phase-9",
      },
    });
  }

  return stripeClient;
}
