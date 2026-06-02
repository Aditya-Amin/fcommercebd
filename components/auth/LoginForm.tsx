"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { LoginCopy } from "@/lib/types/auth";

export function LoginForm({ copy }: { copy: LoginCopy }) {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError(copy.errors.required);
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      toast(msg, "error");
      setLoading(false);
      return;
    }
    setLoading(false);
    toast(copy.successToast, "success");
    router.push("/dashboard");
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{copy.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{copy.subtitle}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
          autoComplete="current-password"
          required
          error={error ?? undefined}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-muted">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              defaultChecked
            />
            {copy.rememberMe}
          </label>
          <a href="#" className="font-medium text-primary hover:underline">
            {copy.forgotPassword}
          </a>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {loading ? copy.submitting : copy.submit}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {copy.noAccount}{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {copy.createOne}
        </Link>
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-bg/60 p-3 text-xs text-ink-muted">
        <strong className="text-ink">{copy.demoNotice.label}</strong>{" "}
        {copy.demoNotice.text}
      </div>
    </div>
  );
}
