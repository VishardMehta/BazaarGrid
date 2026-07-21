/**
 * Razorpay Checkout integration.
 *
 * Flow: backend creates a Razorpay Order (amount is decided server-side,
 * never trust a client-sent amount) → Checkout widget opens → on success
 * the signature is verified server-side → caller then writes the
 * BazaarGrid order to Supabase with payment_status: "PAID".
 *
 * Requires (not included — see backend/.env.example):
 *   VITE_RAZORPAY_KEY_ID   in .env.local (public key, safe client-side)
 *   RAZORPAY_KEY_ID/SECRET in backend/.env (server-side only)
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

let scriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay checkout script."));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Payment request failed (${res.status})`);
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

/**
 * Opens Razorpay Checkout for the given rupee amount. Resolves with the
 * verified payment response, or rejects if the user cancels or verification
 * fails. `receipt` should be a BazaarGrid order reference (e.g. seller id +
 * timestamp) since the real order isn't created until after payment succeeds.
 */
export async function payWithRazorpay(opts: {
  amountRupees: number;
  receipt: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}): Promise<RazorpaySuccessResponse> {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
  if (!keyId) {
    throw new Error("Payments aren't configured yet — VITE_RAZORPAY_KEY_ID is missing from .env.local.");
  }

  await loadCheckoutScript();

  const order = await post<{ orderId: string; amount: number; currency: string }>(
    "/payments/create-order",
    { amount: opts.amountRupees, receipt: opts.receipt },
  );

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: "BazaarGrid",
      description: "Order payment",
      order_id: order.orderId,
      prefill: { name: opts.buyerName, email: opts.buyerEmail, contact: opts.buyerPhone },
      theme: { color: "#2F5E3A" },
      handler: async (response) => {
        try {
          await post("/payments/verify", response);
          resolve(response);
        } catch (e) {
          reject(e instanceof Error ? e : new Error("Payment verification failed."));
        }
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });
    rzp.open();
  });
}
