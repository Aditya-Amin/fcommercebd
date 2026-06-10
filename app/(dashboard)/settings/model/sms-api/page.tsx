"use client";

import { useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const SMS_PROVIDERS = [
  {
    id: "greenweb",
    name: "GreenWeb / BDBulkSMS",
    description: "Bangladesh's leading bulk SMS gateway. BTRC compliant. Cost-effective.",
    costPerSeg: 0.30,
    charsPerSeg: 160,
  },
  {
    id: "ssl",
    name: "SSL Wireless",
    description: "Trusted BD SMS provider. Reliable delivery, BTRC compliant. 0.50 BDT/seg.",
    costPerSeg: 0.50,
    charsPerSeg: 160,
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "Global SMS provider. International fallback. USD pricing.",
    costPerSeg: 1.20,
    charsPerSeg: 160,
  },
];

const AI_MODELS = [
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    badge: "Fastest",
    badgeColor: "bg-success/10 text-success",
    description: "Optimized for short, impactful SMS content generation. Most cost-effective for bulk campaigns.",
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    badge: "Quality",
    badgeColor: "bg-primary/10 text-primary",
    description: "Higher quality SMS content with better Bangla language support and tone accuracy.",
  },
];

const STORAGE_KEY = "fcommerce.settings.sms-api";

function loadSettings() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSettings(data: object) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function SmsApiSettingsPage() {
  const { toast } = useToast();
  const saved = loadSettings();

  const [provider, setProvider] = useState<string>(saved?.provider ?? "greenweb");
  const [aiModel, setAiModel] = useState<string>(saved?.aiModel ?? "claude-haiku-4-5");
  const [apiKey, setApiKey] = useState<string>(saved?.apiKey ?? "");
  const [senderId, setSenderId] = useState<string>(saved?.senderId ?? "");
  const [costPerSeg, setCostPerSeg] = useState<string>(
    saved?.costPerSeg ?? String(SMS_PROVIDERS[0].costPerSeg)
  );
  const [charsPerSeg, setCharsPerSeg] = useState<string>(
    saved?.charsPerSeg ?? String(SMS_PROVIDERS[0].charsPerSeg)
  );
  const [saving, setSaving] = useState(false);

  function handleProviderChange(id: string) {
    setProvider(id);
    const p = SMS_PROVIDERS.find((x) => x.id === id);
    if (p) {
      setCostPerSeg(String(p.costPerSeg));
      setCharsPerSeg(String(p.charsPerSeg));
    }
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    saveSettings({ provider, aiModel, apiKey, senderId, costPerSeg, charsPerSeg });
    setSaving(false);
    toast("SMS API settings saved.", "success");
  }

  return (
    <div className="space-y-5">
      {/* SMS Provider */}
      <Card>
        <CardHeader title="Choose SMS API Provider" description="Select the provider used to send SMS campaigns." />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {SMS_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProviderChange(p.id)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition",
                provider === p.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{p.name}</p>
                {provider === p.id && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                )}
              </div>
              <p className="mt-1 text-xs text-ink-muted">{p.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* AI Model */}
      <Card>
        <CardHeader
          title="SMS AI Content Model"
          description="AI model used to generate SMS campaign content."
        />
        <div className="space-y-3 p-5">
          {AI_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setAiModel(m.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition",
                aiModel === m.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  aiModel === m.id
                    ? "border-primary bg-primary"
                    : "border-border bg-white"
                )}
              >
                {aiModel === m.id && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{m.name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", m.badgeColor)}>
                    {m.badge}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">{m.description}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* API Credentials */}
      <Card>
        <CardHeader title="API Credentials" description="Enter your SMS provider API credentials." />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Input
            label="API Key / Token"
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Input
            label="Sender ID"
            placeholder="e.g. FcommerceBD"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
          />
          <Input
            label="Cost Per Segment (BDT)"
            type="number"
            placeholder="0.30"
            value={costPerSeg}
            onChange={(e) => setCostPerSeg(e.target.value)}
          />
          <Input
            label="Chars Per Segment"
            type="number"
            placeholder="160"
            value={charsPerSeg}
            onChange={(e) => setCharsPerSeg(e.target.value)}
          />
        </div>
        <div className="flex justify-start border-t border-border bg-bg/50 px-5 py-3">
          <Button
            onClick={handleSave}
            loading={saving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {saving ? "Saving…" : "Save SMS API Settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
