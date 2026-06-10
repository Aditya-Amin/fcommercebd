"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { executeBkashPayment } from "@/lib/api/bkash";
import { useToast } from "@/context/ToastContext";

/**
 * Shown after bKash redirects back to us with ?paymentID=...&status=success.
 * In real mode, the Laravel callback (/api/bkash/callback) handles execution
 * server-side and redirects here only as an intermediate step.
 * In mock/frontend-only mode, we call executePayment from here.
 */
export default function PaymentProcessingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const paymentID = params.get("paymentID");
    const status = params.get("status");

    // If bKash (or simulate) already sent us to /payment/success or /payment/failed,
    // this page would not be rendered — it's a fallback for manual flow resumption.
    if (!paymentID) {
      router.replace("/payment/failed?reason=missing_payment_id");
      return;
    }

    if (status && status !== "success") {
      router.replace(`/payment/failed?reason=${status}`);
      return;
    }

    // Call execute on the frontend in case the Laravel callback was missed
    // (e.g. browser back-navigation or network hiccup). Idempotent server-side.
    executeBkashPayment(paymentID)
      .then((result) => {
        if (result.ok) {
          const trxID =
            (result.execute as { trxID?: string }).trxID ?? "";
          router.replace(
            `/payment/success?paymentID=${encodeURIComponent(paymentID)}&trxID=${encodeURIComponent(trxID)}`
          );
        } else {
          router.replace("/payment/failed?reason=execute_failed");
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Payment verification failed";
        toast(msg, "error");
        router.replace("/payment/failed?reason=execute_failed");
      });
  }, [params, router, toast]);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-white p-10 shadow-card">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
        <Loader2 className="h-9 w-9 animate-spin" />
      </span>
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-ink">পেমেন্ট যাচাই হচ্ছে…</h1>
        <p className="mt-2 text-sm text-ink-muted">
          একটু অপেক্ষা করুন, আপনার পেমেন্ট নিশ্চিত করা হচ্ছে।
        </p>
      </div>
      <p className="text-center text-xs text-ink-subtle">
        এই পেজ থেকে সরে যাবেন না।
      </p>
    </div>
  );
}
