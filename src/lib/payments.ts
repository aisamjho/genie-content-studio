/**
 * Geenie AI Studio — Payment Service
 *
 * This module provides a unified payment interface.
 * Credentials are read from environment variables — never hardcoded.
 *
 * To activate a payment provider:
 * 1. Add the credentials to your .env file (see .env.example)
 * 2. Set VITE_PAYMENT_PROVIDER to "stripe" | "paypal" | "razorpay"
 *
 * Stripe:    https://dashboard.stripe.com/apikeys
 * PayPal:    https://developer.paypal.com/dashboard/applications/live
 * Razorpay:  https://dashboard.razorpay.com/app/keys
 */

export type PaymentProvider = "stripe" | "paypal" | "razorpay" | "unconfigured";

export interface PlanConfig {
  id: string;
  name: string;
  priceUSD: number;
  stripePriceId?: string;
  paypalPlanId?: string;
  razorpayPlanId?: string;
}

export const PLANS: PlanConfig[] = [
  {
    id: "starter",
    name: "Starter",
    priceUSD: 0,
  },
  {
    id: "creator",
    name: "Creator",
    priceUSD: 19,
    stripePriceId: import.meta.env.VITE_STRIPE_CREATOR_PRICE_ID,
    paypalPlanId: import.meta.env.VITE_PAYPAL_CREATOR_PLAN_ID,
    razorpayPlanId: import.meta.env.VITE_RAZORPAY_CREATOR_PLAN_ID,
  },
  {
    id: "studio",
    name: "Studio",
    priceUSD: 49,
    stripePriceId: import.meta.env.VITE_STRIPE_STUDIO_PRICE_ID,
    paypalPlanId: import.meta.env.VITE_PAYPAL_STUDIO_PLAN_ID,
    razorpayPlanId: import.meta.env.VITE_RAZORPAY_STUDIO_PLAN_ID,
  },
];

export function getActiveProvider(): PaymentProvider {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const paypalId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const razorpayId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  const configured = import.meta.env.VITE_PAYMENT_PROVIDER as PaymentProvider | undefined;
  if (configured && configured !== "unconfigured") return configured;

  if (stripeKey) return "stripe";
  if (paypalId) return "paypal";
  if (razorpayId) return "razorpay";
  return "unconfigured";
}

export function isPaymentConfigured(): boolean {
  return getActiveProvider() !== "unconfigured";
}

/**
 * Initiate a subscription checkout for a given plan.
 * Handles provider routing internally — the UI never needs to know which provider is active.
 */
export async function initiateCheckout(
  planId: string,
  userEmail: string
): Promise<{ success: boolean; message: string }> {
  const provider = getActiveProvider();
  const plan = PLANS.find((p) => p.id === planId);

  if (!plan) return { success: false, message: "Plan not found." };
  if (plan.priceUSD === 0) return { success: true, message: "You are on the free Starter plan." };

  if (provider === "unconfigured") {
    return {
      success: false,
      message:
        "Payments are not yet configured. Please contact abhishek2k1985@gmail.com to set up your subscription.",
    };
  }

  if (provider === "stripe") {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) return { success: false, message: "Stripe is not configured." };
    // Stripe Checkout will be wired here once backend endpoint exists
    console.log("[Payments] Stripe checkout for plan:", planId, "user:", userEmail);
    return { success: false, message: "Stripe checkout coming soon. Contact us to subscribe manually." };
  }

  if (provider === "paypal") {
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) return { success: false, message: "PayPal is not configured." };
    console.log("[Payments] PayPal checkout for plan:", planId, "user:", userEmail);
    return { success: false, message: "PayPal checkout coming soon. Contact us to subscribe manually." };
  }

  if (provider === "razorpay") {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) return { success: false, message: "Razorpay is not configured." };
    console.log("[Payments] Razorpay checkout for plan:", planId, "user:", userEmail);
    return { success: false, message: "Razorpay checkout coming soon. Contact us to subscribe manually." };
  }

  return { success: false, message: "Unknown payment provider." };
}
