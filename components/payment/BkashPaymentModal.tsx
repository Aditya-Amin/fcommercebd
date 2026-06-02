"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, ShieldCheck, Phone, KeyRound, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BkashLogo } from "./BkashLogo";
import { PLANS } from "@/lib/plans";
import { usePlan } from "@/context/PlanContext";
import { useToast } from "@/context/ToastContext";
import {
  createBkashPayment,
  sendBkashOtp,
  verifyBkashOtp,
  executeBkashPayment
} from "@/lib/api/payment";
import type { BkashSession, BkashExecuteResult } from "@/lib/types/payment";
import type { BkashCopy } from "@/lib/types/payment-copy";
import type { PlanId } from "@/lib/types";
import { toBanglaNumber } from "@/lib/utils";

type Step = "intro" | "otp" | "pin" | "success" | "failure";

interface Props {
  open: boolean;
  onClose: () => void;
  planId: PlanId;
  copy: BkashCopy;
  onSuccess?: (result: BkashExecuteResult) => void;
}

export function BkashPaymentModal({
  open,
  onClose,
  planId,
  copy,
  onSuccess
}: Props) {
  const plan = PLANS[planId];
  const { activatePlan } = usePlan();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("intro");
  const [session, setSession] = useState<BkashSession | null>(null);
  const [result, setResult] = useState<BkashExecuteResult | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset everything when the modal closes
  useEffect(() => {
    if (!open) {
      setStep("intro");
      setSession(null);
      setResult(null);
      setPhone("");
      setOtp("");
      setPin("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  async function handleIntroSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const created = session ?? (await createBkashPayment(planId));
      const updated = await sendBkashOtp(created, phone.trim());
      setSession(updated);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error && err.message === "INVALID_PHONE"
        ? copy.steps.intro.phoneError
        : copy.steps.intro.phoneError);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      const updated = await verifyBkashOtp(session, otp.trim());
      setSession(updated);
      setStep("pin");
    } catch {
      setError(copy.steps.otp.otpError);
    } finally {
      setLoading(false);
    }
  }

  async function handlePinSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      const exec = await executeBkashPayment(session, planId, pin.trim());
      activatePlan({
        planId: exec.planId,
        trxId: exec.trxId,
        paidAt: exec.paidAt,
        amount: exec.amount,
        method: "bkash"
      });
      setResult(exec);
      setStep("success");
      toast(`${plan.name} প্ল্যান চালু হয়েছে! 🎉`, "success");
      onSuccess?.(exec);
    } catch {
      setError(copy.steps.pin.pinError);
      setStep("failure");
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setStep("intro");
    setError(null);
    setOtp("");
    setPin("");
  }

  const planLineLabel =
    step === "success" && result
      ? `${plan.name} (${plan.currency}${toBanglaNumber(plan.price)})`
      : `${plan.name} · ${plan.currency}${toBanglaNumber(plan.price)}/মাস`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-2">
          {copy.modal.title}
          <BkashLogo />
        </span>
      }
      description={copy.modal.subtitle}
    >
      <div className="space-y-5">
        <Summary
          planLabel={copy.modal.planLabel}
          amountLabel={copy.modal.amountLabel}
          merchantLabel={copy.modal.merchantLabel}
          merchantValue={copy.modal.merchantValue}
          planValue={planLineLabel}
          amountValue={`${plan.currency}${toBanglaNumber(plan.price)}`}
        />

        {step === "intro" && (
          <IntroStep
            copy={copy.steps.intro}
            phone={phone}
            setPhone={setPhone}
            error={error}
            loading={loading}
            onSubmit={handleIntroSubmit}
          />
        )}

        {step === "otp" && session && (
          <OtpStep
            copy={copy.steps.otp}
            phone={session.phone}
            otp={otp}
            setOtp={setOtp}
            error={error}
            loading={loading}
            onSubmit={handleOtpSubmit}
            onResend={async () => {
              if (!session) return;
              setOtp("");
              setError(null);
              try {
                const updated = await sendBkashOtp(session, session.phone);
                setSession(updated);
                toast("OTP আবার পাঠানো হয়েছে", "info");
              } catch {
                /* ignore */
              }
            }}
          />
        )}

        {step === "pin" && session && (
          <PinStep
            copy={copy.steps.pin}
            pin={pin}
            setPin={setPin}
            error={error}
            loading={loading}
            onSubmit={handlePinSubmit}
          />
        )}

        {step === "success" && result && (
          <SuccessStep
            copy={copy.steps.success}
            planName={plan.name}
            amount={`${plan.currency}${toBanglaNumber(result.amount)}`}
            trxId={result.trxId}
            onContinue={onClose}
          />
        )}

        {step === "failure" && (
          <FailureStep
            copy={copy.steps.failure}
            onRetry={retry}
            onCancel={onClose}
          />
        )}

        <div className="flex flex-col items-center gap-1 border-t border-border pt-4 text-[11px] text-ink-subtle">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" /> {copy.footer.secured}
          </span>
          <span>{copy.footer.support}</span>
        </div>
      </div>
    </Modal>
  );
}

function Summary({
  planLabel,
  amountLabel,
  merchantLabel,
  merchantValue,
  planValue,
  amountValue
}: {
  planLabel: string;
  amountLabel: string;
  merchantLabel: string;
  merchantValue: string;
  planValue: string;
  amountValue: string;
}) {
  return (
    <div className="rounded-xl border border-[#E2136E]/20 bg-gradient-to-br from-[#FDE7F1] to-white p-4">
      <div className="grid gap-2 text-sm">
        <Row label={merchantLabel} value={merchantValue} />
        <Row label={planLabel} value={planValue} />
        <Row label={amountLabel} value={amountValue} bold />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={bold ? "text-base font-bold text-ink" : "font-medium text-ink"}>
        {value}
      </span>
    </div>
  );
}

function IntroStep({
  copy,
  phone,
  setPhone,
  error,
  loading,
  onSubmit
}: {
  copy: BkashCopy["steps"]["intro"];
  phone: string;
  setPhone: (v: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <StepHeading title={copy.title} description={copy.description} />
      <Input
        name="bkashPhone"
        label={copy.phoneLabel}
        placeholder={copy.phonePlaceholder}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        leftIcon={<Phone className="h-4 w-4" />}
        inputMode="numeric"
        maxLength={11}
        autoFocus
        error={error ?? undefined}
        required
      />
      <p className="text-xs text-ink-subtle">{copy.agreement}</p>
      <Button type="submit" fullWidth size="lg" loading={loading}>
        {loading ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}

function OtpStep({
  copy,
  phone,
  otp,
  setOtp,
  error,
  loading,
  onSubmit,
  onResend
}: {
  copy: BkashCopy["steps"]["otp"];
  phone: string;
  otp: string;
  setOtp: (v: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  onResend: () => Promise<void>;
}) {
  const cooldown = useResendCooldown();
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <StepHeading
        title={copy.title}
        description={`${copy.description} (${maskPhone(phone)})`}
      />
      <Input
        name="bkashOtp"
        label={copy.otpLabel}
        placeholder={copy.otpPlaceholder}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        leftIcon={<KeyRound className="h-4 w-4" />}
        inputMode="numeric"
        maxLength={6}
        autoFocus
        error={error ?? undefined}
        hint={copy.demoHint}
        required
      />
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            if (cooldown.seconds > 0) return;
            cooldown.start();
            void onResend();
          }}
          disabled={cooldown.seconds > 0}
          className="font-medium text-primary transition hover:underline disabled:cursor-not-allowed disabled:text-ink-subtle"
        >
          {cooldown.seconds > 0
            ? `${copy.resendIn} ${toBanglaNumber(cooldown.seconds)}s`
            : copy.resend}
        </button>
        <span className="text-ink-subtle">
          {loading && <Loader2 className="inline h-3 w-3 animate-spin" />}
        </span>
      </div>
      <Button type="submit" fullWidth size="lg" loading={loading}>
        {loading ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}

function PinStep({
  copy,
  pin,
  setPin,
  error,
  loading,
  onSubmit
}: {
  copy: BkashCopy["steps"]["pin"];
  pin: string;
  setPin: (v: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <StepHeading title={copy.title} description={copy.description} />
      <Input
        name="bkashPin"
        type="password"
        label={copy.pinLabel}
        placeholder={copy.pinPlaceholder}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 5))}
        leftIcon={<KeyRound className="h-4 w-4" />}
        inputMode="numeric"
        maxLength={5}
        autoFocus
        error={error ?? undefined}
        hint={copy.demoHint}
        required
      />
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={loading}
        className="!bg-[#E2136E] hover:!bg-[#C2105F]"
      >
        {loading ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}

function SuccessStep({
  copy,
  planName,
  amount,
  trxId,
  onContinue
}: {
  copy: BkashCopy["steps"]["success"];
  planName: string;
  amount: string;
  trxId: string;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <div>
        <h3 className="text-lg font-semibold text-ink">{copy.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">
          {copy.description.replace("{plan}", planName)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-bg/40 p-4 text-left text-sm">
        <Row label={copy.transactionLabel} value={trxId} />
        <div className="mt-2">
          <Row label={copy.amountLabel} value={amount} bold />
        </div>
      </div>
      <Button fullWidth size="lg" onClick={onContinue}>
        {copy.continueLabel}
      </Button>
    </div>
  );
}

function FailureStep({
  copy,
  onRetry,
  onCancel
}: {
  copy: BkashCopy["steps"]["failure"];
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <h3 className="text-lg font-semibold text-ink">{copy.title}</h3>
      <p className="text-sm text-ink-muted">{copy.description}</p>
      <div className="flex gap-2">
        <Button variant="outline" fullWidth onClick={onCancel}>
          {copy.cancelLabel}
        </Button>
        <Button fullWidth onClick={onRetry}>
          {copy.retryLabel}
        </Button>
      </div>
    </div>
  );
}

function StepHeading({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
    </div>
  );
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 3)}*****${phone.slice(-3)}`;
}

function useResendCooldown() {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, []);

  function start() {
    setSeconds(30);
    if (ref.current) clearInterval(ref.current);
    ref.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (ref.current) clearInterval(ref.current);
          ref.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  return { seconds, start };
}
