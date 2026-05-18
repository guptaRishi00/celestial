const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export type PurchaseType = "tokens" | "report";

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  keyId?: string;
}

export interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  alreadyProcessed?: boolean;
  chatTokens?: number;
  unlockedReports?: string[];
  reportUnlockId?: string | null;
}

interface RazorpayFailureResponse {
  error?: {
    description?: string;
    reason?: string;
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: RazorpayFailureResponse) => void,
  ) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_CHECKOUT_SRC}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existingScript.addEventListener("error", () => resolve(false), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

async function readJsonError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return data && typeof data.error === "string" ? data.error : fallback;
}

export async function createPaymentOrder(type: PurchaseType, amount: number) {
  const response = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, amount }),
  });

  if (!response.ok) {
    throw new Error(
      await readJsonError(response, "Could not create payment order"),
    );
  }

  return (await response.json()) as PaymentOrder;
}

export async function openRazorpayCheckout({
  order,
  name,
  description,
  themeColor = "#3399cc",
}: {
  order: PaymentOrder;
  name: string;
  description: string;
  themeColor?: string;
}) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Razorpay SDK failed to load");
  }
  const RazorpayCheckout = window.Razorpay;

  const key = order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error("Razorpay key is not configured");
  }

  return new Promise<RazorpayCheckoutResponse>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };

    const paymentObject = new RazorpayCheckout({
      key,
      amount: order.amount,
      currency: order.currency,
      name,
      description,
      order_id: order.id,
      handler: (response) => finish(() => resolve(response)),
      modal: {
        ondismiss: () => finish(() => reject(new Error("Payment cancelled"))),
      },
      theme: { color: themeColor },
    });

    paymentObject.on("payment.failed", (response) => {
      finish(() =>
        reject(
          new Error(
            response.error?.description ||
              response.error?.reason ||
              "Payment failed",
          ),
        ),
      );
    });

    paymentObject.open();
  });
}

export async function verifyRazorpayPayment(
  response: RazorpayCheckoutResponse,
  type: PurchaseType,
  userId?: string,
) {
  const verification = await fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...response, type, userId }),
  });

  if (!verification.ok) {
    throw new Error(
      await readJsonError(verification, "Payment verification failed"),
    );
  }

  return (await verification.json()) as PaymentVerificationResult;
}
