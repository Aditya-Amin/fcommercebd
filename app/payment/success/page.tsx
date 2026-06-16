import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RefreshUserOnMount } from "@/components/auth/RefreshUserOnMount";

interface SearchParams {
  paymentID?: string;
  trxID?: string;
  plan?: string;
}

export default async function PaymentSuccessPage({
  searchParams
}: {
  // Next.js 15+ makes searchParams a Promise — await before reading.
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-card">
      <RefreshUserOnMount />
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="h-9 w-9" />
      </span>
      <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-ink">
        পেমেন্ট সফল হয়েছে! 🎉
      </h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        আপনার সাবস্ক্রিপশন চালু হয়ে গেছে। এখন থেকে সব ফিচার ব্যবহার করতে পারবেন।
      </p>

      {(sp.trxID || sp.paymentID) && (
        <dl className="mt-6 divide-y divide-border rounded-xl border border-border bg-bg/40 text-sm">
          {sp.trxID && (
            <div className="flex items-center justify-between p-3">
              <dt className="text-ink-muted">ট্রানজেকশন আইডি</dt>
              <dd className="font-mono text-ink">{sp.trxID}</dd>
            </div>
          )}
          {sp.paymentID && (
            <div className="flex items-center justify-between p-3">
              <dt className="text-ink-muted">পেমেন্ট আইডি</dt>
              <dd className="font-mono text-xs text-ink">{sp.paymentID}</dd>
            </div>
          )}
        </dl>
      )}

      <Link href="/dashboard" className="mt-6 block">
        <Button fullWidth size="lg">
          ড্যাশবোর্ডে যান
        </Button>
      </Link>
    </div>
  );
}
