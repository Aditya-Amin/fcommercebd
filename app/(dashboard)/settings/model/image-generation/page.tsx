"use client";

import { useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const IMAGE_PROVIDERS = [
  {
    id: "stub",
    name: "Stub (No Key Required)",
    description: "Local mock generator for development. Returns placeholder images instantly.",
    needsKey: false,
  },
  {
    id: "openai",
    name: "OpenAI gpt-image-1",
    description: "High-quality AI image generation. Best for product visuals and banners.",
    needsKey: true,
  },
  {
    id: "replicate",
    name: "Replicate (Stable Diffusion)",
    description: "Open-source models via Replicate API. Cost-effective for bulk generation.",
    needsKey: true,
  },
];

const IMAGE_SIZES = [
  { id: "512x512", label: "512 × 512" },
  { id: "768x768", label: "768 × 768" },
  { id: "1024x1024", label: "1024 × 1024" },
];

const STORAGE_KEY = "fcommerce.settings.image-generation";

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

export default function ImageGenerationSettingsPage() {
  const { toast } = useToast();
  const saved = loadSettings();

  const [provider, setProvider] = useState<string>(saved?.provider ?? "stub");
  const [apiKey, setApiKey] = useState<string>(saved?.apiKey ?? "");
  const [imageSize, setImageSize] = useState<string>(saved?.imageSize ?? "1024x1024");
  const [saving, setSaving] = useState(false);

  const selectedProvider = IMAGE_PROVIDERS.find((p) => p.id === provider);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    saveSettings({ provider, apiKey, imageSize });
    setSaving(false);
    toast("Image generation settings saved.", "success");
  }

  return (
    <div className="space-y-5">
      {/* Provider */}
      <Card>
        <CardHeader
          title="Choose Image Generation Provider"
          description="Select the AI provider used to generate product images."
        />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {IMAGE_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
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

      {/* Output Settings */}
      <Card>
        <CardHeader title="Output Settings" description="Configure image size and quality." />
        <div className="p-5 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Image Size</p>
            <div className="flex flex-wrap gap-2">
              {IMAGE_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setImageSize(s.id)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition",
                    imageSize === s.id
                      ? "border-primary bg-primary text-white"
                      : "border-border text-ink-muted hover:border-primary/40 hover:text-ink"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* API Credentials */}
      <Card>
        <CardHeader
          title="API Credentials"
          description={
            selectedProvider?.needsKey
              ? "Enter your API key for the selected provider."
              : "No API key required for the Stub provider."
          }
        />
        <div className="p-5">
          {selectedProvider?.needsKey ? (
            <Input
              label="API Key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              hint={
                provider === "openai"
                  ? "Your OpenAI secret key (sk-...)"
                  : "Your Replicate API token (r8_...)"
              }
            />
          ) : (
            <div className="rounded-xl border border-border bg-bg p-4 text-sm text-ink-muted">
              Stub mode is active — no API key needed. Images will be placeholders.
              Switch to OpenAI or Replicate to generate real product images.
            </div>
          )}
        </div>
        <div className="flex justify-start border-t border-border bg-bg/50 px-5 py-3">
          <Button
            onClick={handleSave}
            loading={saving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {saving ? "Saving…" : "Save Image Generation Settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
