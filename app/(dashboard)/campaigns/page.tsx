"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, MessageSquare, Phone, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { PlanRequiredBanner } from "@/components/dashboard/PlanRequiredBanner";
import { useToast } from "@/context/ToastContext";
import { sendSms, getSmsStats, getSmsLog } from "@/lib/api/sms";
import type { SmsStats, SmsLogEntry } from "@/lib/types/sms";

const TEMPLATES = [
  "🌸 Eid Special: 20% off on all items! Order now from our page.",
  "🛍️ New arrivals just dropped! Visit our page to see the collection.",
  "💝 Thank you for shopping with us! Show this SMS for 10% off your next order.",
];

export default function CampaignsPage() {
  const { toast } = useToast();

  const [message, setMessage]       = useState("");
  const [recipient, setRecipient]   = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending]       = useState(false);
  const [smsStats, setSmsStats]     = useState<SmsStats | null>(null);
  const [logs, setLogs]             = useState<SmsLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const charCount = message.length;
  const segments  = Math.max(1, Math.ceil(charCount / 160));
  const recipientValid = /^01[3-9]\d{8}$/.test(recipient.trim());
  const isValid = useMemo(
    () => message.trim().length > 0 && recipientValid,
    [message, recipientValid]
  );

  useEffect(() => {
    getSmsStats()
      .then(setSmsStats)
      .catch(() => setSmsStats(null));
    getSmsLog(10)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, []);

  function refreshData() {
    getSmsStats().then(setSmsStats).catch(() => {});
    getSmsLog(10).then(setLogs).catch(() => {});
    window.dispatchEvent(new Event("usage:changed"));
  }

  async function confirmSend() {
    setSending(true);
    try {
      const result = await sendSms(recipient.trim(), message.trim());
      if (result.ok) {
        toast(`SMS পাঠানো হয়েছে! বাকি: ${result.remaining}`, "success");
        setMessage("");
        setRecipient("");
        refreshData();
      } else {
        toast(result.message, "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "SMS পাঠাতে সমস্যা হয়েছে।", "error");
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <PlanRequiredBanner />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">SMS Campaigns</h1>
        <p className="text-sm text-ink-muted">
          Send SMS to your customers via BDBulkSMS gateway.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compose */}
        <div className="space-y-4 lg:col-span-2">
          {/* Recipient */}
          <Card>
            <CardHeader title="Recipient" description="Enter the mobile number to send SMS to." />
            <div className="p-5">
              <Input
                label="Mobile Number"
                placeholder="01XXXXXXXXX"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                leftIcon={<Phone className="h-4 w-4" />}
                error={recipient && !recipientValid ? "Valid BD number: 01X-XXXXXXXX (e.g. 01711234567)" : undefined}
              />
            </div>
          </Card>

          {/* Message */}
          <Card>
            <CardHeader
              title="Message"
              description="Write your SMS message."
              action={
                <span className={`text-xs font-medium ${charCount > 160 ? "text-warning" : "text-ink-muted"}`}>
                  {charCount}/160 · {segments} {segments > 1 ? "segments" : "segment"}
                </span>
              }
            />
            <div className="space-y-4 p-5">
              <Textarea
                placeholder="লিখুন আপনার SMS বার্তা…"
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
                onClick={() => setConfirmOpen(true)}
                disabled={!isValid}
              >
                Send SMS
              </Button>
            </div>
          </Card>

          {/* Send Log */}
          <Card>
            <CardHeader title="Recent Sends" description="Last 10 SMS dispatched." />
            <div className="divide-y divide-border">
              {logsLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-bg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 animate-pulse rounded bg-bg" />
                      <div className="h-3 w-48 animate-pulse rounded bg-bg" />
                    </div>
                  </div>
                ))
              ) : logs.length === 0 ? (
                <div className="p-6 text-center text-sm text-ink-muted">
                  No SMS sent yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-4">
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] ${
                      log.status === "sent" || log.status === "mock"
                        ? "bg-success/10 text-success"
                        : "bg-danger/10 text-danger"
                    }`}>
                      {log.status === "sent" || log.status === "mock"
                        ? <CheckCircle2 className="h-3.5 w-3.5" />
                        : <XCircle className="h-3.5 w-3.5" />
                      }
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-ink">{log.recipient_number}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          log.status === "sent"   ? "bg-success/10 text-success"
                          : log.status === "mock" ? "bg-primary/10 text-primary"
                          : "bg-danger/10 text-danger"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="truncate text-xs text-ink-muted">{log.message_preview}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-muted/60">
                        <Clock className="h-3 w-3" />
                        {new Date(log.sent_at).toLocaleString("en-BD")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* SMS Quota */}
          <Card>
            <CardHeader
              title="SMS Quota"
              description={smsStats?.package_name ?? "Loading…"}
            />
            <div className="space-y-4 p-5">
              {smsStats ? (
                <>
                  <ProgressBar
                    value={smsStats.used_sms}
                    max={Math.max(smsStats.total_sms, 1)}
                    label="Used this month"
                    hint={`${smsStats.used_sms} / ${smsStats.total_sms}`}
                  />
                  <div className="rounded-xl bg-bg p-3 text-xs text-ink-muted space-y-1">
                    <p>
                      Remaining:{" "}
                      <strong className="text-ink">{smsStats.remaining_sms} SMS</strong>
                    </p>
                    {smsStats.reset_at && (
                      <p>
                        Resets on{" "}
                        {new Date(smsStats.reset_at).toLocaleDateString("en-BD", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    )}
                    <p>Long messages (160+ chars) count as multiple segments.</p>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-bg" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-bg" />
                </div>
              )}
            </div>
          </Card>

          {/* Preview */}
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

          {/* Provider info */}
          <Card>
            <CardHeader title="Provider" description="Active SMS gateway" />
            <div className="p-5">
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-success/10 text-success font-bold text-xs">
                  BD
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">BDBulkSMS</p>
                  <p className="text-xs text-ink-muted">bdbulksms.com · BTRC compliant</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirm modal */}
      <Modal
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        title="Confirm Send"
        description={`Send SMS to ${recipient}?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={confirmSend} loading={sending}>
              {sending ? "Sending…" : "Send SMS"}
            </Button>
          </>
        }
      >
        <div className="rounded-xl bg-bg p-4 text-sm">
          <p className="mb-1 text-xs font-medium text-ink-muted">To</p>
          <p className="font-semibold text-ink">{recipient}</p>
          <p className="mb-1 mt-3 text-xs font-medium text-ink-muted">Message</p>
          <p className="whitespace-pre-line text-ink-muted">{message}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-bg p-3">
            <p className="text-xs text-ink-muted">Characters</p>
            <p className="text-sm font-semibold text-ink">{charCount}</p>
          </div>
          <div className="rounded-lg bg-bg p-3">
            <p className="text-xs text-ink-muted">Segments</p>
            <p className="text-sm font-semibold text-ink">{segments}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
