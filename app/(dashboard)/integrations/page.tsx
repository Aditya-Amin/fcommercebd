"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import {
  Truck,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Save,
  Trash2,
  ExternalLink,
  RefreshCcw,
  Wallet,
  Info
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FacebookIntegrationCard } from "@/components/facebook/FacebookIntegrationCard";
import { useSteadfast } from "@/context/SteadfastContext";
import { useToast } from "@/context/ToastContext";
import { getBalance } from "@/lib/api/steadfast";
import { formatBDT } from "@/lib/utils";

type BalanceState = "idle" | "loading" | "loaded" | "error";

export default function IntegrationsPage() {
  const { hasCredentials, saveCredentials, clearCredentials } = useSteadfast();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [balanceState, setBalanceState] = useState<BalanceState>("idle");
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBalance = useCallback(async () => {
    setBalanceState("loading");
    setBalanceError("");
    try {
      const value = await getBalance();
      setBalance(value);
      setBalanceState("loaded");
    } catch (err) {
      setBalance(null);
      setBalanceError(err instanceof Error ? err.message : "Could not reach Steadfast.");
      setBalanceState("error");
    }
  }, []);

  // Auto-fetch the balance whenever credentials become present — proves to
  // the user that authentication works, even before they attempt a booking
  // (which may still need separate merchant approval).
  useEffect(() => {
    if (hasCredentials) {
      fetchBalance();
    } else {
      setBalanceState("idle");
      setBalance(null);
      setBalanceError("");
    }
  }, [hasCredentials, fetchBalance]);

  async function handleSave() {
    if (!apiKey.trim() || !secretKey.trim()) {
      toast("Both API Key and Secret Key are required.", "error");
      return;
    }
    setSaving(true);
    try {
      await saveCredentials({ apiKey: apiKey.trim(), secretKey: secretKey.trim() });
      setApiKey("");
      setSecretKey("");
      setEditing(false);
      toast("Steadfast credentials saved securely.", "success");
      // Effect above will auto-fetch the new balance.
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save credentials.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    await clearCredentials();
    setApiKey("");
    setSecretKey("");
    setEditing(false);
    setBalance(null);
    setBalanceState("idle");
    toast("Steadfast credentials removed.", "info");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Integrations</h1>
        <p className="text-sm text-ink-muted">
          Connect Facebook and delivery couriers to manage everything from your dashboard.
        </p>
      </div>

      {/* ── Facebook Page ── */}
      <Suspense fallback={null}>
        <FacebookIntegrationCard />
      </Suspense>

      {/* ── Steadfast ── */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Steadfast Courier
            </span>
          }
          description="Book and track deliveries via the Steadfast Courier API."
          action={
            hasCredentials ? (
              <Badge tone="success">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </Badge>
            ) : (
              <Badge tone="neutral">Not connected</Badge>
            )
          }
        />
        <div className="space-y-5 p-5">
          {/* Where to get keys */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2.5 text-xs text-ink-muted">
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
            <span>
              Don&apos;t have API keys?{" "}
              <a
                href="https://steadfast.com.bd/user/api"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Get them from your Steadfast dashboard →
              </a>
            </span>
          </div>

          {/* ── Connection panel — only when credentials are saved ── */}
          {hasCredentials && !editing && (
            <div className="space-y-3">
              {/* Balance display: proves authentication works */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-success">
                      Connected · authentication verified
                    </p>
                    {balanceState === "loading" ? (
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching balance…
                      </p>
                    ) : balanceState === "loaded" && balance !== null ? (
                      <p className="text-2xl font-bold text-ink">{formatBDT(balance)}</p>
                    ) : balanceState === "error" ? (
                      <p className="mt-0.5 text-xs text-danger">{balanceError}</p>
                    ) : (
                      <p className="mt-0.5 text-sm text-ink-muted">Balance unknown</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<RefreshCcw className={`h-3.5 w-3.5 ${balanceState === "loading" ? "animate-spin" : ""}`} />}
                  onClick={fetchBalance}
                  disabled={balanceState === "loading"}
                >
                  Refresh
                </Button>
              </div>

              {/* Approval-required notice — connection ≠ booking permission */}
              <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-ink-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="font-semibold text-ink">Booking may need merchant approval</p>
                  <p className="mt-0.5">
                    Saving keys lets us authenticate, but Steadfast also requires merchant activation
                    (KYC, pickup hub set up, sometimes an initial top-up) before they accept{" "}
                    <code className="rounded bg-bg px-1 py-0.5">/create_order</code> calls. If a booking
                    fails with &ldquo;account not activated&rdquo; or similar, finish those steps in your{" "}
                    <a
                      href="https://portal.packzy.com"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Steadfast portal
                    </a>
                    .
                  </p>
                </div>
              </div>

              {/* Update keys CTA */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-bg px-3 py-2.5">
                <p className="text-xs text-ink-muted">
                  Credentials are saved encrypted on the server. The keys never leave the backend.
                </p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {(!hasCredentials || editing) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <Input
                  label="API Key"
                  type={showApiKey ? "text" : "password"}
                  placeholder={editing ? "Enter new API Key" : "Paste your Steadfast API Key"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-8 text-ink-subtle hover:text-ink"
                  aria-label={showApiKey ? "Hide" : "Show"}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Secret Key"
                  type={showSecretKey ? "text" : "password"}
                  placeholder={editing ? "Enter new Secret Key" : "Paste your Steadfast Secret Key"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey((v) => !v)}
                  className="absolute right-3 top-8 text-ink-subtle hover:text-ink"
                  aria-label={showSecretKey ? "Hide" : "Show"}
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {(!hasCredentials || editing) && (
              <>
                <Button
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={handleSave}
                  loading={saving}
                >
                  Save credentials
                </Button>
                {editing && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setApiKey("");
                      setSecretKey("");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
            {hasCredentials && !editing && (
              <Button
                variant="outline"
                className="!border-danger/30 !text-danger hover:!bg-danger/5"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={handleRemove}
              >
                Remove
              </Button>
            )}
          </div>

          {/* Help box */}
          <div className="rounded-xl border border-dashed border-border bg-bg/40 p-4 text-sm">
            <p className="font-medium text-ink">How to get your API keys</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-ink-muted">
              <li>Log in to the Steadfast portal at portal.packzy.com</li>
              <li>
                Go to <strong className="text-ink">Settings → API</strong>
              </li>
              <li>
                Copy your <strong className="text-ink">API Key</strong> and{" "}
                <strong className="text-ink">Secret Key</strong> and paste them above
              </li>
            </ol>
            <a
              href="https://portal.packzy.com"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Open Steadfast portal <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </Card>

      {/* ── Pathao — coming soon ── */}
      <Card className="opacity-60">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-ink-muted" />
              Pathao Courier
            </span>
          }
          description="Book Pathao deliveries directly from your orders dashboard."
          action={<Badge tone="neutral">Coming soon</Badge>}
        />
        <div className="p-5">
          <p className="text-sm text-ink-muted">
            Pathao API integration is under development. You'll be notified once it's available.
          </p>
        </div>
      </Card>
    </div>
  );
}
