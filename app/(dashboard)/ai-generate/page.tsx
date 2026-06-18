"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Wand2,
  Sparkles,
  Lock,
  Send,
  Calendar,
  RefreshCw,
  Copy,
  AlertCircle,
  Facebook,
  CheckCircle2
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Textarea, Select, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import { PlanRequiredBanner } from "@/components/dashboard/PlanRequiredBanner";
import { ProductPicker } from "@/components/facebook/ProductPicker";
import { PostPreview } from "@/components/facebook/PostPreview";
import { usePlan } from "@/context/PlanContext";
import { useToast } from "@/context/ToastContext";
import {
  generateAiPost,
  getFacebookPages,
  createFacebookPost,
  getFbPostsQuota,
  getAiUsage
} from "@/lib/api/facebook";
import type { Product } from "@/lib/types/product";
import type { AiGenerateResult, FacebookPage, FbPostsQuota } from "@/lib/types/facebook";

const TONES = [
  { label: "Friendly & casual", value: "friendly" as const },
  { label: "Professional", value: "professional" as const },
  { label: "Promotional / sale", value: "promo" as const },
  { label: "Festive (Eid, Pohela Boishakh)", value: "festive" as const }
];

const LANGUAGES = [
  { label: "English", value: "en" as const },
  { label: "বাংলা (Bengali)", value: "bn" as const },
  { label: "Banglish (mixed)", value: "mixed" as const }
];

type Tone = (typeof TONES)[number]["value"];
type Language = (typeof LANGUAGES)[number]["value"];

export default function AIGeneratePage() {
  const { recordAIUse, recordFBPostUse } = usePlan();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [tone, setTone] = useState<Tone>("friendly");
  const [language, setLanguage] = useState<Language>("mixed");
  const [withHashtags, setWithHashtags] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [asset, setAsset] = useState<AiGenerateResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [pageId, setPageId] = useState<string>("");
  const [scheduleAt, setScheduleAt] = useState("");

  // FB-post + AI-generation quotas come from the server (PlanQuotaService) so
  // admin overrides/resets reflect immediately — not the local PlanContext cache.
  const [fbQuota, setFbQuota] = useState<FbPostsQuota | null>(null);
  const [aiUsage, setAiUsage] = useState<FbPostsQuota | null>(null);
  const refreshFbQuota = useCallback(() => {
    getFbPostsQuota().then(setFbQuota).catch(() => {});
  }, []);
  const refreshAiUsage = useCallback(() => {
    getAiUsage().then(setAiUsage).catch(() => {});
  }, []);

  // editable preview
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");

  // AI-generation quota — server values only. While the API is in flight
  // (aiUsage === null) we show nothing rather than stale localStorage numbers.
  const aiLimit = aiUsage?.limit ?? 0;
  const aiUsedCount = aiUsage?.used ?? 0;
  const isLocked = aiUsage?.locked ?? false;
  const limitReached = aiUsage ? (!aiUsage.locked && aiUsage.remaining <= 0) : false;

  // Facebook-posting quota — server values only.
  const fbLimit = fbQuota?.limit ?? 0;
  const fbUsed = fbQuota?.used ?? 0;
  const fbLocked = fbQuota?.locked ?? false;
  const fbRemaining = fbQuota?.remaining ?? 0;
  const fbLimitReached = fbQuota ? (!fbQuota.locked && fbQuota.remaining <= 0) : false;

  useEffect(() => {
    getFacebookPages()
      .then((p) => {
        setPages(p);
        const first = p.find((x) => x.isActive);
        if (first) setPageId(first.id);
      })
      .catch(() => {
        /* non-blocking */
      });
    refreshFbQuota();
    refreshAiUsage();
  }, [refreshFbQuota, refreshAiUsage]);

  // When AI generates, mirror into editable fields.
  useEffect(() => {
    if (asset) {
      setCaption(asset.caption);
      setHashtags(asset.hashtags.join(" "));
    }
  }, [asset]);

  async function handleGenerate() {
    if (isLocked) {
      toast("AI generation is a Growth plan feature.", "error");
      return;
    }
    if (limitReached) {
      toast("You've hit your monthly AI limit.", "error");
      return;
    }
    if (!product) {
      toast("Pick a product first.", "error");
      return;
    }

    setGenerating(true);
    setAsset(null);
    setGenError(null);
    try {
      const result = await generateAiPost({
        product_id: product.id,
        tone,
        language,
        include_hashtags: withHashtags
      });
      setAsset(result);
      recordAIUse();
      refreshAiUsage();
      window.dispatchEvent(new Event("usage:changed")); // update the sidebar meter live
      toast("AI post generated!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setGenError(msg);
      toast(msg, "error");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!asset) return;
    const text = hashtags ? `${caption}\n\n${hashtags}` : caption;
    navigator.clipboard.writeText(text);
    toast("Caption copied to clipboard.", "success");
  }

  async function handlePostToFacebook() {
    if (!asset || !product) return;
    if (!pageId) {
      toast("Connect a Facebook page in Integrations first.", "error");
      return;
    }
    if (!caption.trim()) {
      toast("Caption is empty.", "error");
      return;
    }
    if (fbLocked) {
      toast("Facebook posting is not available on your current plan.", "error");
      return;
    }
    if (fbLimitReached) {
      toast(
        `Monthly Facebook post limit reached (${fbUsed}/${fbLimit}).`,
        "error"
      );
      return;
    }

    const tagList = hashtags
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    // TEMP: ship text-only while we sort out image hosting (localhost vs ngrok).
    // Re-enable image attachment by restoring the type/image_url logic below.
    setPosting(true);
    try {
      await createFacebookPost({
        facebook_page_id: pageId,
        product_id: product.id,
        type: "text",
        message: caption,
        hashtags: tagList,
        scheduled_at: scheduleAt || undefined
      });
      recordFBPostUse();
      refreshFbQuota();
      toast(
        scheduleAt
          ? "Post scheduled — it will publish at the chosen time."
          : "Posting to Facebook…",
        "success"
      );
      // reset
      setAsset(null);
      setCaption("");
      setHashtags("");
      setScheduleAt("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not post";
      toast(msg, "error");
    } finally {
      setPosting(false);
    }
  }

  const selectedPage = pages.find((p) => p.id === pageId) ?? null;
  const noPagesConnected = pages.length === 0;

  return (
    <div className="space-y-6">
      <PlanRequiredBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
            AI Generate <Sparkles className="h-5 w-5 text-warning" />
          </h1>
          <p className="text-sm text-ink-muted">
            Pick a product → AI writes the caption → publish to your Facebook Page in one click.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {aiLimit > 0 && (
            <div className="rounded-xl border border-border bg-white px-4 py-2.5">
              <p className="text-xs font-medium text-ink-muted">AI this month</p>
              <p className="text-sm font-semibold text-ink">
                {aiUsedCount}
                <span className="text-ink-muted"> / {aiLimit}</span>
              </p>
            </div>
          )}
          {fbLimit > 0 && (
            <div
              className={
                "rounded-xl border px-4 py-2.5 " +
                (fbLimitReached
                  ? "border-danger/40 bg-danger/5"
                  : fbRemaining <= 5
                    ? "border-warning/40 bg-warning/5"
                    : "border-border bg-white")
              }
            >
              <p className="text-xs font-medium text-ink-muted">FB posts this month</p>
              <p className="text-sm font-semibold text-ink">
                {fbUsed}
                <span className="text-ink-muted"> / {fbLimit}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {isLocked && (
        <UpgradePrompt
          title="AI generation is a Growth feature"
          description="Upgrade to Growth (৳599/month) to unlock 60 AI-generated posts per month."
        />
      )}

      {!isLocked && noPagesConnected && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-ink">No Facebook page connected</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              You can still generate captions, but to publish you need to{" "}
              <Link href="/integrations" className="font-semibold text-primary hover:underline">
                connect a Facebook Page
              </Link>{" "}
              first.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── LEFT: Inputs ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="1. Pick a product"
              description="The post will use this product's images and details."
            />
            <div className="p-5">
              <ProductPicker
                selectedId={product?.id ?? null}
                onSelect={(p) => {
                  setProduct(p);
                  setAsset(null);
                }}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="2. Style" description="Tone and language for the caption." />
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  label="Tone"
                  value={tone}
                  onChange={(e) => setTone((e.target as HTMLSelectElement).value as Tone)}
                  options={TONES}
                  disabled={isLocked}
                />
                <Select
                  label="Language"
                  value={language}
                  onChange={(e) => setLanguage((e.target as HTMLSelectElement).value as Language)}
                  options={LANGUAGES}
                  disabled={isLocked}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={withHashtags}
                  onChange={(e) => setWithHashtags(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                Include hashtags
              </label>

              {aiLimit > 0 && (
                <ProgressBar
                  value={aiUsedCount}
                  max={aiLimit}
                  label="AI generations this month"
                  hint={`${aiUsedCount} / ${aiLimit}`}
                />
              )}

              <Button
                fullWidth
                size="lg"
                leftIcon={isLocked ? <Lock className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
                onClick={handleGenerate}
                loading={generating}
                disabled={isLocked || limitReached || !product}
              >
                {isLocked
                  ? "Upgrade to use AI"
                  : limitReached
                    ? "Monthly limit reached"
                    : !product
                      ? "Pick a product first"
                      : generating
                        ? "Generating…"
                        : "Generate AI post"}
              </Button>

              {genError && (
                <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-ink">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <div>
                    <p className="font-semibold">AI generation unavailable</p>
                    <p className="mt-0.5 text-ink-muted">{genError}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── RIGHT: Preview + Post ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="3. Preview & edit"
              description="Tweak the caption — changes show in the preview."
              action={
                asset ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    Regenerate
                  </Button>
                ) : null
              }
            />
            <div className="p-5">
              {generating ? (
                <div className="space-y-3">
                  <div className="h-44 w-full animate-pulse rounded-xl bg-bg" />
                  <div className="h-3 w-full animate-pulse rounded bg-bg" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-bg" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-bg" />
                </div>
              ) : !asset ? (
                <div className="rounded-xl border-2 border-dashed border-border bg-bg/40 p-10 text-center">
                  <Sparkles className="mx-auto h-10 w-10 text-ink-subtle" />
                  <p className="mt-3 text-sm font-medium text-ink-muted">Nothing generated yet</p>
                  <p className="mt-1 text-xs text-ink-subtle">
                    Pick a product on the left and hit <strong>Generate AI post</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <PostPreview
                    page={selectedPage}
                    caption={caption}
                    hashtags={hashtags
                      .split(/\s+/)
                      .map((t) => (t.startsWith("#") || !t ? t : "#" + t))
                      .filter(Boolean)}
                    primaryImage={asset.primary}
                    extraImages={asset.images.filter((u) => u !== asset.primary)}
                  />

                  <Textarea
                    label="Caption"
                    rows={5}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                  <Input
                    label="Hashtags (space-separated)"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                  />

                  <Button
                    variant="outline"
                    leftIcon={<Copy className="h-4 w-4" />}
                    onClick={handleCopy}
                  >
                    Copy caption
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {asset && (
            <Card>
              <CardHeader
                title="4. Publish to Facebook"
                description="Post now or schedule for later."
              />
              <div className="space-y-4 p-5">
                <Select
                  label="Facebook page"
                  value={pageId}
                  onChange={(e) => setPageId((e.target as HTMLSelectElement).value)}
                  options={
                    pages.length === 0
                      ? [{ label: "No pages connected", value: "" }]
                      : pages.map((p) => ({
                          label: p.pageName + (p.isActive ? "" : " (re-auth needed)"),
                          value: p.id
                        }))
                  }
                  disabled={pages.length === 0}
                />

                <Input
                  label="Schedule (optional)"
                  hint="Leave empty to post immediately. Min 5-min gap between posts on the same page."
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  leftIcon={<Calendar className="h-4 w-4" />}
                  min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                />

                {selectedPage && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-bg/40 p-2.5 text-xs text-ink-muted">
                    {selectedPage.isActive ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-warning" />
                    )}
                    Posting to{" "}
                    <Badge tone="primary" className="!font-semibold">
                      {selectedPage.pageName}
                    </Badge>
                  </div>
                )}

                {fbLimit > 0 && (
                  <ProgressBar
                    value={fbUsed}
                    max={fbLimit}
                    label="Facebook posts this month"
                    hint={
                      fbLimitReached
                        ? `Limit reached — upgrade for more`
                        : `${fbRemaining} remaining`
                    }
                  />
                )}

                {fbLimitReached && (
                  <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-ink">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <div>
                      <p className="font-semibold">Monthly Facebook post limit reached</p>
                      <p className="mt-0.5 text-ink-muted">
                        You've used {fbUsed}/{fbLimit} posts.{" "}
                        <Link href="/settings" className="font-semibold text-primary hover:underline">
                          Upgrade
                        </Link>{" "}
                        to keep posting.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    leftIcon={
                      fbLimitReached ? (
                        <Lock className="h-4 w-4" />
                      ) : scheduleAt ? (
                        <Calendar className="h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )
                    }
                    onClick={handlePostToFacebook}
                    loading={posting}
                    disabled={
                      pages.length === 0 ||
                      !caption.trim() ||
                      fbLocked ||
                      fbLimitReached
                    }
                    style={fbLimitReached ? undefined : { backgroundColor: "#1877F2" }}
                    className={fbLimitReached ? "" : "!text-white hover:!opacity-90"}
                  >
                    {posting
                      ? "Posting…"
                      : fbLocked
                        ? "Upgrade to post"
                        : fbLimitReached
                          ? "Monthly limit reached"
                          : scheduleAt
                            ? "Schedule post"
                            : "Post to Facebook now"}
                  </Button>
                  {pages.length === 0 && (
                    <Link href="/integrations">
                      <Button variant="outline" leftIcon={<Facebook className="h-4 w-4" />}>
                        Connect Facebook
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
