"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
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
  const saved = loadSettings();

  const [aiModel, setAiModel] = useState<string>(saved?.aiModel ?? "claude-haiku-4-5");

  function handleModelChange(id: string) {
    setAiModel(id);
    saveSettings({ aiModel: id });
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
              onClick={() => handleModelChange(m.id)}
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
    </div>
  );
}
