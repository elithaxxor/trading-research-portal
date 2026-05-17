"use server";

import { redirect } from "next/navigation";

import { ensureUserRecords } from "@/lib/auth/ensure-user-records";
import { getSiteUrl } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { AuthActionState } from "./auth-state";

const MIN_PASSWORD_LENGTH = 8;

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function resolveFormData(
  stateOrFormData: AuthActionState | FormData,
  formData?: FormData
) {
  return (
    formData ??
    (stateOrFormData instanceof FormData ? stateOrFormData : new FormData())
  );
}

function errorState(message: string): AuthActionState {
  return {
    status: "error",
    message,
  };
}

function successState(message: string): AuthActionState {
  return {
    status: "success",
    message,
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateEmail(email: string) {
  if (!email) {
    return "Email is required.";
  }

  if (!isValidEmail(email)) {
    return "Enter a valid email address.";
  }

  return null;
}

function validatePassword(password: string) {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return null;
}

function validateFullName(fullName: string) {
  if (!fullName) {
    return "Name is required.";
  }

  return null;
}

function getSafeRedirectPath(formData: FormData) {
  const redirectedFrom = getFormValue(formData, "redirectedFrom");

  if (
    redirectedFrom &&
    redirectedFrom.startsWith("/") &&
    !redirectedFrom.startsWith("//")
  ) {
    return redirectedFrom;
  }

  return "/dashboard";
}

async function getAuthClient() {
  try {
    return await createSupabaseServerClient();
  } catch {
    return null;
  }
}

function getConfiguredSiteUrl() {
  try {
    return getSiteUrl();
  } catch {
    return null;
  }
}

export async function signInAction(
  stateOrFormData: AuthActionState | FormData,
  formData?: FormData
): Promise<AuthActionState> {
  const actionFormData = resolveFormData(stateOrFormData, formData);
  const email = getFormValue(actionFormData, "email").toLowerCase();
  const password = getFormValue(actionFormData, "password");
  const redirectPath = getSafeRedirectPath(actionFormData);

  const emailError = validateEmail(email);
  if (emailError) {
    return errorState(emailError);
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return errorState(passwordError);
  }

  const supabase = await getAuthClient();
  if (!supabase) {
    return errorState("Authentication is not configured yet.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return errorState("We could not sign you in with those credentials.");
  }

  if (data.user) {
    await ensureUserRecords(data.user).catch(() => null);
  }

  redirect(redirectPath);
}

export async function signUpAction(
  stateOrFormData: AuthActionState | FormData,
  formData?: FormData
): Promise<AuthActionState> {
  const actionFormData = resolveFormData(stateOrFormData, formData);
  const fullName = getFormValue(actionFormData, "full_name");
  const email = getFormValue(actionFormData, "email").toLowerCase();
  const password = getFormValue(actionFormData, "password");
  const confirmPassword =
    getFormValue(actionFormData, "confirmPassword") ||
    getFormValue(actionFormData, "confirm_password");

  const fullNameError = validateFullName(fullName);
  if (fullNameError) {
    return errorState(fullNameError);
  }

  const emailError = validateEmail(email);
  if (emailError) {
    return errorState(emailError);
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return errorState(passwordError);
  }

  if (!confirmPassword) {
    return errorState("Confirm your password.");
  }

  if (password !== confirmPassword) {
    return errorState("Passwords must match.");
  }

  const siteUrl = getConfiguredSiteUrl();
  if (!siteUrl) {
    return errorState("Authentication redirects are not configured yet.");
  }

  const supabase = await getAuthClient();
  if (!supabase) {
    return errorState("Authentication is not configured yet.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return errorState("We could not create the account. Please try again.");
  }

  if (data.session && data.user) {
    await ensureUserRecords(data.user).catch(() => null);
    redirect("/dashboard");
  }

  return successState("Check your email to confirm your account.");
}

export async function signOutAction() {
  const supabase = await getAuthClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/?status=signed_out");
}

export async function requestPasswordResetAction(
  stateOrFormData: AuthActionState | FormData,
  formData?: FormData
): Promise<AuthActionState> {
  const actionFormData = resolveFormData(stateOrFormData, formData);
  const email = getFormValue(actionFormData, "email").toLowerCase();

  const emailError = validateEmail(email);
  if (emailError) {
    return errorState(emailError);
  }

  const siteUrl = getConfiguredSiteUrl();
  const supabase = await getAuthClient();

  if (siteUrl && supabase) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });
  }

  return successState(
    "If an account exists for that email, password reset instructions have been sent."
  );
}

export async function updatePasswordAction(
  stateOrFormData: AuthActionState | FormData,
  formData?: FormData
): Promise<AuthActionState> {
  const actionFormData = resolveFormData(stateOrFormData, formData);
  const password = getFormValue(actionFormData, "password");
  const confirmPassword = getFormValue(actionFormData, "confirmPassword");

  const passwordError = validatePassword(password);
  if (passwordError) {
    return errorState(passwordError);
  }

  if (password !== confirmPassword) {
    return errorState("Passwords must match.");
  }

  const supabase = await getAuthClient();
  if (!supabase) {
    return errorState("Authentication is not configured yet.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorState("Please sign in before updating your password.");
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return errorState("We could not update your password. Please try again.");
  }

  redirect("/account?status=password_updated");
}
