"use client";

import { useMemo, useState } from "react";
import { Send, Users, MessageSquare } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { PlanRequiredBanner } from "@/components/dashboard/PlanRequiredBanner";
import { usePlan } from "@/context/PlanContext";
import { useToast } from "@/context/ToastContext";
import { delay } from "@/lib/utils";

const AUDIENCES = [
  { id: "all", label: "All customers", count: 142, desc: "Everyone in your customer list" },
  { id: "recent", label: "Recent buyers", count: 38, desc: "Bought in the last 30 days" },
  { id: "vip", label: "VIP customers", count: 12, desc: "Spent more than ৳5,000 in total" },
  { id: "lapsed", label: "Lapsed customers", count: 27, desc: "Haven't bought in 60+ days" }
];

const TEMPLATES = [
  "🌸 Eid Special: 20% off on all Kurtis at FashionHouse! Use code EID20. Order now: m.me/yourpage",
  "🛍️ New arrivals just dropped! Hand-picked for you. Visit our page to see the collection.",
  "💝 Thank you for shopping with us! Show this SMS for a 10% discount on your next order."
];

export default function CampaignsPage() {
  const { plan, usage, canSendSMS, recordSMSUse } = usePlan();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState(AUDIENCES[0].id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const selected = AUDIENCES.find((a) => a.id === audience)!;
  const charCount = message.length;
  const segments = Math.max(1, Math.ceil(charCount / 160));
  const totalSMS = selected.count * segments;
  const remaining = plan.limits.sms - usage.smsUsed;
  const exceeds = totalSMS > remaining;

  const isValid = useMemo(() => message.trim().length > 0 && !exceeds, [message, exceeds]);

  function startSend() {
    if (!message.trim()) {
      toast("Please write a message before sending.", "error");
      return;
    }
    if (!canSendSMS(totalSMS)) {
      toast(`Not enough SMS quota. You need ${totalSMS}, have ${remaining}.`, "error");
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmSend() {
    setSending(true);
    await delay(1400);
    recordSMSUse(totalSMS);
    setSending(false);
    setConfirmOpen(false);
    setMessage("");
    toast(`Sent ${totalSMS} SMS to ${selected.count} customers!`, "success");
  }

  return (
    <div className="space-y-6">
      <PlanRequiredBanner />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">SMS Campaigns</h1>
        <p className="text-sm text-ink-muted">
          Send promotional SMS to your customers in seconds.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compose */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Audience" description="Choose who should receive this SMS." />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAudience(a.id)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                    audience === a.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-bg/40"
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{a.label}</p>
                      <span className="rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-ink-muted">
                        {a.count}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted">{a.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Message"
              description="Personalize with your offer, link, or business name."
              action={
                <span className={`text-xs font-medium ${charCount > 160 ? "text-warning" : "text-ink-muted"}`}>
                  {charCount}/160 · {segments} {segments > 1 ? "segments" : "segment"}
                </span>
              }
            />
            <div className="space-y-4 p-5">
              <Textarea
                placeholder="Write your SMS message…"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Quick templates
                </p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setMessage(t)}
                      className="rounded-full border border-border bg-white px-3 py-1.5 text-xs text-ink-muted transition hover:border-primary/40 hover:text-ink"
                    >
                      {t.slice(0, 32)}…
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                fullWidth
                leftIcon={<Send className="h-4 w-4" />}
                onClick={startSend}
                disabled={!isValid}
              >
                Send to {selected.count} customers ({totalSMS} SMS)
              </Button>
              {exceeds && (
                <p className="text-center text-xs font-medium text-danger">
                  This campaign needs {totalSMS} SMS but you only have {remaining} left this month.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="SMS quota" description={`${plan.name} plan`} />
            <div className="space-y-4 p-5">
              <ProgressBar
                value={usage.smsUsed}
                max={plan.limits.sms}
                label="Used this month"
                hint={`${usage.smsUsed} / ${plan.limits.sms}`}
              />
              <div className="rounded-xl bg-bg p-3 text-xs text-ink-muted">
                <p>SMS resets on the 1st of every month.</p>
                <p className="mt-1">
                  Long messages (over 160 chars) count as multiple segments.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Preview" />
            <div className="p-5">
              <div className="rounded-2xl bg-bg p-4">
                <div className="mx-auto max-w-[220px] rounded-xl bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
                      <MessageSquare className="h-3 w-3" />
                    </span>
                    FcommerceBD
                  </div>
                  <p className="text-xs text-ink">
                    {message || "Your message will appear here…"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        title="Confirm campaign"
        description={`Send to ${selected.count} customers? This will use ${totalSMS} SMS from your quota.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={confirmSend} loading={sending}>
              {sending ? "Sending…" : "Send now"}
            </Button>
          </>
        }
      >
        <div className="rounded-xl bg-bg p-4 text-sm">
          <p className="mb-2 font-semibold text-ink">Message preview</p>
          <p className="whitespace-pre-line text-ink-muted">{message}</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-bg p-3">
            <p className="text-xs text-ink-muted">Audience</p>
            <p className="text-sm font-semibold text-ink">{selected.count}</p>
          </div>
          <div className="rounded-lg bg-bg p-3">
            <p className="text-xs text-ink-muted">Segments</p>
            <p className="text-sm font-semibold text-ink">{segments}</p>
          </div>
          <div className="rounded-lg bg-bg p-3">
            <p className="text-xs text-ink-muted">Total SMS</p>
            <p className="text-sm font-semibold text-ink">{totalSMS}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
