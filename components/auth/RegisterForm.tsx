"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Mail, Lock, User, Store, Phone } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { toBanglaNumber } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import { startBkashCheckout, getPlanIdBySlug } from "@/lib/api/bkash";
import type { PlanId } from "@/lib/types";
import type { RegisterCopy } from "@/lib/types/auth";
import type { BkashCopy } from "@/lib/types/payment-copy";

const BD_PHONE_RE = /^01[3-9]\d{8}$/;

interface Props {
  copy: RegisterCopy;
  // bkashCopy retained for offline-modal compatibility; live flow doesn't render it.
  bkashCopy?: BkashCopy;
}

export function RegisterForm({ copy }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const { register } = useAuth();
  const { toast } = useToast();

  const planParam = search.get("plan");
  const selectedPlanId: PlanId | null =
    planParam === "starter" || planParam === "growth" ? planParam : null;
  const selectedPlan = selectedPlanId ? PLANS[selectedPlanId] : null;
  const requiresPayment = !!selectedPlan && selectedPlan.price > 0;

  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password) {
      setError(copy.errors.required);
      return;
    }
    if (password.length < 6) {
      setError(copy.errors.passwordTooShort);
      return;
    }
    if (requiresPayment && !BD_PHONE_RE.test(phone)) {
      setError(copy.errors.invalidPhone);
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        business: business || undefined,
        phone: phone || undefined
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      toast(msg, "error");
      setLoading(false);
      return;
    }

    toast(copy.successToast, "success");

    if (selectedPlanId && requiresPayment) {
      try {
        const planId = await getPlanIdBySlug(selectedPlanId);
        await startBkashCheckout(planId);
        // Browser redirects to bKash; nothing else runs.
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "পেমেন্ট শুরু করা যায়নি";
        toast(msg, "error");
        setLoading(false);
        // Fall through to dashboard so the user isn't stranded
        router.push("/dashboard");
        return;
      }
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{copy.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{copy.subtitle}</p>

      {selectedPlan && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary-50/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-700">
            {copy.selectedPlanLabel}
          </p>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <span className="text-base font-semibold text-ink">{selectedPlan.name}</span>
            <span className="text-base font-bold text-primary">
              {selectedPlan.currency}
              {toBanglaNumber(selectedPlan.price)}
              <span className="text-xs font-medium text-ink-muted">/মাস</span>
            </span>
          </div>
          {requiresPayment && (
            <p className="mt-2 text-xs text-ink-muted">{copy.willPay}</p>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          name="name"
          label={copy.fields.name.label}
          placeholder={copy.fields.name.placeholder}
          leftIcon={<User className="h-4 w-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          name="business"
          label={copy.fields.business.label}
          placeholder={copy.fields.business.placeholder}
          leftIcon={<Store className="h-4 w-4" />}
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
        />
        {requiresPayment && (
          <Input
            name="phone"
            label={copy.fields.phone.label}
            placeholder={copy.fields.phone.placeholder}
            hint={copy.fields.phone.hint}
            leftIcon={<Phone className="h-4 w-4" />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            maxLength={11}
            required
          />
        )}
        <Input
          name="email"
          type="email"
          label={copy.fields.email.label}
          placeholder={copy.fields.email.placeholder}
          leftIcon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          name="password"
          type="password"
          label={copy.fields.password.label}
          placeholder={copy.fields.password.placeholder}
          leftIcon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          error={error ?? undefined}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {loading ? copy.submitting : copy.submit}
        </Button>

        <p className="text-center text-xs text-ink-muted">
          {copy.terms}{" "}
          <a href="#" className="text-primary hover:underline">
            {copy.termsLink}
          </a>{" "}
          {copy.and}{" "}
          <a href="#" className="text-primary hover:underline">
            {copy.privacyLink}
          </a>{" "}
          {copy.termsAccept}
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {copy.haveAccount}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {copy.signIn}
        </Link>
      </p>
    </div>
  );
}
