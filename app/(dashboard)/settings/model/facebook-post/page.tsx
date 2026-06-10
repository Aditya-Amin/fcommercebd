"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const AI_MODELS = [
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    badge: "Fastest",
    badgeColor: "bg-success/10 text-success",
    description: "Best for quick, engaging Facebook captions. Cost-effective for high-volume posting.",
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    badge: "Quality",
    badgeColor: "bg-primary/10 text-primary",
    description: "Higher quality posts with better Bangla language support, storytelling, and tone control.",
  },
];

const POST_TONES = [
  { id: "friendly", label: "Friendly" },
  { id: "professional", label: "Professional" },
  { id: "promo", label: "Promotional" },
  { id: "festive", label: "Festive" },
];

const STORAGE_KEY = "fcommerce.settings.facebook-post";

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

export default function FacebookPostSettingsPage() {
  const { toast } = useToast();
  const saved = loadSettings();

  const [aiModel, setAiModel] = useState<string>(saved?.aiModel ?? "claude-haiku-4-5");
  const [defaultTone, setDefaultTone] = useState<string>(saved?.defaultTone ?? "friendly");
  const [maxPostsPerDay, setMaxPostsPerDay] = useState<string>(saved?.maxPostsPerDay ?? "25");
  const [minGapMinutes, setMinGapMinutes] = useState<string>(saved?.minGapMinutes ?? "5");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    saveSettings({ aiModel, defaultTone, maxPostsPerDay, minGapMinutes });
    setSaving(false);
    toast("Facebook post settings saved.", "success");
  }

  return (
    <div className="space-y-5">
      {/* AI Model */}
      <Card>
        <CardHeader
          title="Facebook Post AI Model"
          description="AI model used to generate product captions and hashtags."
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

      {/* Post Defaults */}
      <Card>
        <CardHeader title="Post Defaults" description="Default tone and posting behaviour for AI-generated posts." />
        <div className="p-5 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Default Tone</p>
            <div className="flex flex-wrap gap-2">
              {POST_TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDefaultTone(t.id)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition",
                    defaultTone === t.id
                      ? "border-primary bg-primary text-white"
                      : "border-border text-ink-muted hover:border-primary/40 hover:text-ink"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Max Posts Per Day"
              type="number"
              placeholder="25"
              value={maxPostsPerDay}
              onChange={(e) => setMaxPostsPerDay(e.target.value)}
              hint="Maximum Facebook posts allowed per day per page."
            />
            <Input
              label="Minimum Gap Between Posts (minutes)"
              type="number"
              placeholder="5"
              value={minGapMinutes}
              onChange={(e) => setMinGapMinutes(e.target.value)}
              hint="Cooldown period between consecutive posts."
            />
          </div>
        </div>
        <div className="flex justify-start border-t border-border bg-bg/50 px-5 py-3">
          <Button
            onClick={handleSave}
            loading={saving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {saving ? "Saving…" : "Save Facebook Post Settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
