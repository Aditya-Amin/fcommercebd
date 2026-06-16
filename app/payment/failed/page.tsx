import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SearchParams {
  reason?: string;
}

const REASON_MESSAGES: Record<string, string> = {
  cancel: "আপনি পেমেন্ট বাতিল করেছেন।",
  failure: "bKash পেমেন্ট সম্পন্ন করা যায়নি।",
  execute_failed: "পেমেন্ট ভেরিফাই করা যায়নি। কোনো টাকা কাটা হয়নি।",
  unknown_payment: "এই পেমেন্ট আইডি খুঁজে পাওয়া যায়নি।",
  missing_payment_id: "পেমেন্টের তথ্য পাওয়া যায়নি।",
  server_error: "সার্ভারে সমস্যা হয়েছে। সাপোর্টে যোগাযোগ করুন।"
};

export default async function PaymentFailedPage({
  searchParams
}: {
  // Next.js 15+ makes searchParams a Promise — await before reading.
  searchParams: Promise<SearchParams>;
}) {
  const reason = (await searchParams).reason ?? "failure";
  const message = REASON_MESSAGES[reason] ?? REASON_MESSAGES.failure;

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-card">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-danger/10 text-danger">
        <XCircle className="h-9 w-9" />
      </span>
      <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-ink">
        পেমেন্ট ব্যর্থ হয়েছে
      </h1>
      <p className="mt-2 text-center text-sm text-ink-muted">{message}</p>

      <div className="mt-2 text-center text-xs text-ink-subtle">
        কোড: <span className="font-mono">{reason}</span>
      </div>

      <div className="mt-6 flex gap-2">
        <Link href="/" className="flex-1">
          <Button variant="outline" fullWidth>
            হোমে ফিরুন
          </Button>
        </Link>
        <Link href="/pricing" className="flex-1">
          <Button fullWidth>আবার চেষ্টা করুন</Button>
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-ink-muted">
        সাহায্য দরকার? কল করুন <span className="font-medium text-ink">১৬২৪৭</span> বা
        ইমেইল{" "}
        <a href="mailto:support@fcommerce.bd" className="text-primary hover:underline">
          support@fcommerce.bd
        </a>
      </p>
    </div>
  );
}
