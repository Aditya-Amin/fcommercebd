"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  LayoutTemplate,
  Eye,
  EyeOff,
  Package,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LandingTemplate } from "@/components/templates/LandingTemplate";
import { useTemplate } from "@/context/TemplateContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { getProducts } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/lib/types";
import type { Product } from "@/lib/types/product";

const BUSINESS_CATEGORIES = [
  { label: "Food & Beverage", value: "food-beverage" },
  { label: "Fashion & Apparel", value: "fashion-apparel" },
  { label: "Health & Beauty", value: "health-beauty" },
  { label: "Electronics & Gadgets", value: "electronics-gadgets" },
  { label: "Home & Kitchen", value: "home-kitchen" },
];

const TEMPLATE_TYPES = [
  { label: "One Product", value: "one-product" },
  { label: "Multiple Product", value: "multiple-product" },
];

const BD_PHONE_RE = /^01[3-9]\d{8}$/;

function generateSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
}

export default function TemplatesPage() {
  const { config, updateConfig, saveConfig } = useTemplate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Derive slug & URL from user's business name (from settings)
  const businessName = user?.business ?? "";
  const slug = generateSlug(businessName);
  const pageUrl = slug
    ? `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/${slug}`
    : "";

  // Load products list for the picker
  useEffect(() => {
    getProducts({ perPage: 100 })
      .then((res) => setProducts(res.data))
      .catch(() => {/* ignore */});
  }, []);

  // ── Validate ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!businessName.trim()) {
      e.businessName = "Set your business name in Settings first — it is used as your page URL.";
    }
    if (!config.landingPageTitle.trim()) {
      e.landingPageTitle = "Landing page title is required.";
    }
    if (config.bkashNumber && !BD_PHONE_RE.test(config.bkashNumber)) {
      e.bkashNumber = "Enter a valid Bangladesh number (01XXXXXXXXX).";
    }
    if (config.nagadNumber && !BD_PHONE_RE.test(config.nagadNumber)) {
      e.nagadNumber = "Enter a valid Bangladesh number (01XXXXXXXXX).";
    }
    if (config.rocketNumber && !BD_PHONE_RE.test(config.rocketNumber)) {
      e.rocketNumber = "Enter a valid Bangladesh number (01XXXXXXXXX).";
    }
    if (config.contactPhone && !BD_PHONE_RE.test(config.contactPhone)) {
      e.contactPhone = "Enter a valid Bangladesh number (01XXXXXXXXX).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── FAQ helpers ────────────────────────────────────────────────────────────
  function addFAQ() {
    const item: FAQItem = { id: `${Date.now()}`, question: "", answer: "" };
    updateConfig({ faqItems: [...config.faqItems, item] });
  }

  function updateFAQ(id: string, field: "question" | "answer", value: string) {
    updateConfig({
      faqItems: config.faqItems.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    });
  }

  function removeFAQ(id: string) {
    updateConfig({ faqItems: config.faqItems.filter((f) => f.id !== id) });
  }

  // ── Feature helpers ────────────────────────────────────────────────────────
  function addFeature() {
    updateConfig({ productFeatures: [...config.productFeatures, ""] });
  }

  function updateFeature(i: number, value: string) {
    const features = [...config.productFeatures];
    features[i] = value;
    updateConfig({ productFeatures: features });
  }

  function removeFeature(i: number) {
    updateConfig({
      productFeatures: config.productFeatures.filter((_, idx) => idx !== i),
    });
  }

  // ── Why Buy helpers ─────────────────────────────────────────────────────────
  function addWhyBuy() {
    updateConfig({ whyBuyReasons: [...(config.whyBuyReasons ?? []), ""] });
  }

  function updateWhyBuy(i: number, value: string) {
    const reasons = [...(config.whyBuyReasons ?? [])];
    reasons[i] = value;
    updateConfig({ whyBuyReasons: reasons });
  }

  function removeWhyBuy(i: number) {
    updateConfig({
      whyBuyReasons: (config.whyBuyReasons ?? []).filter((_, idx) => idx !== i),
    });
  }

  // ── Product picker ────────────────────────────────────────────────────────
  function selectProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      updateConfig({ selectedProductId: "", productImageUrl: "", landingPageTitle: "", regularPrice: "", discountPrice: "" });
      return;
    }
    const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
    updateConfig({
      selectedProductId: product.id,
      productImageUrl: primaryImage?.url ?? "",
      landingPageTitle: product.title,
      regularPrice: String(product.comparePrice ?? (product.price * 1.3) | 0),
      discountPrice: String(product.price),
    });
  }

  // ── Save & open in new tab ─────────────────────────────────────────────────
  function handleSave() {
    if (!validate()) {
      toast("Please fix the errors before saving.", "error");
      return;
    }
    const savedSlug = saveConfig(businessName);
    if (savedSlug) {
      const url = `${window.location.origin}/${savedSlug}`;
      window.open(url, "_blank", "noopener,noreferrer");
      toast("Landing page saved! Opening in a new tab.", "success");
    }
  }

  // ── Copy URL ──────────────────────────────────────────────────────────────
  function copyUrl() {
    if (!pageUrl) return;
    navigator.clipboard.writeText(pageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-ink">Templates</h1>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            Build and customize your landing page. All changes are previewed live.
          </p>
        </div>
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink-muted shadow-sm hover:text-ink lg:hidden"
        >
          {showPreview ? (
            <><EyeOff className="h-4 w-4" /> Hide Preview</>
          ) : (
            <><Eye className="h-4 w-4" /> Show Preview</>
          )}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* ── Config form (left) ─────────────────────────────────────── */}
        <div className={cn("flex-1 min-w-0 space-y-5", showPreview && "hidden lg:block")}>

          {/* Page URL (read-only — derived from business name in Settings) */}
          <Card>
            <CardHeader title="Your Landing Page URL" />
            <div className="p-5">
              {businessName ? (
                <div className="space-y-3">
                  <p className="text-sm text-ink-muted">
                    Your URL is automatically set from your business name in{" "}
                    <a href="/settings" className="font-medium text-primary hover:underline">Settings</a>.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-primary">
                      {pageUrl}
                    </code>
                    <button
                      onClick={copyUrl}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                        copied
                          ? "bg-success/10 text-success"
                          : "border border-border bg-white text-ink-muted hover:text-ink"
                      )}
                    >
                      {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  No business name set. Go to{" "}
                  <a href="/settings" className="font-semibold underline">Settings</a>{" "}
                  and add your business name to generate your page URL.
                </div>
              )}
              {errors.businessName && (
                <p className="mt-2 text-xs text-danger">{errors.businessName}</p>
              )}
            </div>
          </Card>

          {/* Product Picker */}
          <Card>
            <CardHeader title="Select Product" />
            <div className="p-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Pick a product from your store
              </label>
              {products.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No products found.{" "}
                  <a href="/products/new" className="font-medium text-primary hover:underline">Add a product</a>{" "}
                  first.
                </p>
              ) : (
                <select
                  value={config.selectedProductId}
                  onChange={(e) => selectProduct(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Choose a product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              )}

              {config.productImageUrl && (
                <div className="mt-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={config.productImageUrl}
                    alt="Product"
                    className="h-14 w-14 rounded-xl border border-border object-cover shadow-sm"
                  />
                  <div>
                    <p className="text-xs font-medium text-ink">Product image selected</p>
                    <button
                      onClick={() => updateConfig({ selectedProductId: "", productImageUrl: "" })}
                      className="mt-0.5 text-xs text-danger hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {!config.productImageUrl && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-dashed border-border p-3 text-sm text-ink-subtle">
                  <Package className="h-5 w-5 shrink-0 text-ink-subtle" />
                  <span>Select a product above to use its image on your landing page.</span>
                </div>
              )}
            </div>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader title="Basic Information" />
            <div className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Business Category</label>
                <select
                  value={config.businessCategory}
                  onChange={(e) => updateConfig({ businessCategory: e.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Template Type</label>
                <select
                  value={config.templateType}
                  onChange={(e) => updateConfig({ templateType: e.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {TEMPLATE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Contact Phone Number"
                placeholder="01XXXXXXXXX"
                value={config.contactPhone}
                onChange={(e) => {
                  updateConfig({ contactPhone: e.target.value });
                  if (errors.contactPhone) setErrors((prev) => ({ ...prev, contactPhone: "" }));
                }}
                error={errors.contactPhone}
              />
            </div>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader title="Product Information" />
            <div className="p-5 space-y-4">
              <Input
                label="Landing Page Title"
                placeholder="e.g. বিচি মুক্ত সিডলেস খেজুর"
                value={config.landingPageTitle}
                onChange={(e) => {
                  updateConfig({ landingPageTitle: e.target.value });
                  if (errors.landingPageTitle) setErrors((prev) => ({ ...prev, landingPageTitle: "" }));
                }}
                error={errors.landingPageTitle}
              />
              {config.regularPrice && config.discountPrice && (
                <div className="flex gap-3 rounded-xl border border-border bg-bg px-4 py-3 text-sm text-ink-muted">
                  <span>Regular: <strong className="text-ink">৳{config.regularPrice}</strong></span>
                  <span>·</span>
                  <span>Discount: <strong className="text-green-700">৳{config.discountPrice}</strong></span>
                  <span className="ml-auto text-xs text-ink-subtle">Auto-filled from product</span>
                </div>
              )}

              {/* Product Features */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-ink">Product Features / Benefits</label>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {config.productFeatures.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={f}
                        onChange={(e) => updateFeature(i, e.target.value)}
                        placeholder={`Feature ${i + 1}`}
                        className="h-9 flex-1 rounded-xl border border-border bg-white px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="rounded-lg p-1.5 text-ink-subtle hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {config.productFeatures.length === 0 && (
                    <p className="text-xs text-ink-subtle">No features added yet. Click &quot;Add&quot; to start.</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Why Buy From Us */}
          <Card>
            <CardHeader title="Why Buy From Us" />
            <div className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-ink-muted">Edit the reasons why customers should buy from you.</p>
                <button
                  type="button"
                  onClick={addWhyBuy}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {(config.whyBuyReasons ?? []).map((reason, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => updateWhyBuy(i, e.target.value)}
                      placeholder={`Reason ${i + 1}`}
                      className="h-9 flex-1 rounded-xl border border-border bg-white px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeWhyBuy(i)}
                      className="rounded-lg p-1.5 text-ink-subtle hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader title="Media" />
            <div className="p-5 space-y-4">
              <Input
                label="Video URL (YouTube or Facebook)"
                placeholder="https://youtube.com/watch?v=..."
                value={config.videoUrl}
                onChange={(e) => updateConfig({ videoUrl: e.target.value })}
                hint="Leave empty to hide the video section."
              />
            </div>
          </Card>

          {/* Urgency */}
          <Card>
            <CardHeader title="Urgency & Countdown" />
            <div className="p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Countdown End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={config.countdownEndDate}
                  onChange={(e) => updateConfig({ countdownEndDate: e.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1.5 text-xs text-ink-muted">
                  Leave empty to hide the countdown timer.
                </p>
              </div>
            </div>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader title="FAQ Items" />
            <div className="p-5">
              <div className="space-y-4">
                {config.faqItems.map((item, idx) => (
                  <div key={item.id} className="rounded-xl border border-border bg-bg p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink-muted">FAQ #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFAQ(item.id)}
                        className="rounded-lg p-1 text-ink-subtle hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => updateFAQ(item.id, "question", e.target.value)}
                        placeholder="Question"
                        className="h-9 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <textarea
                        value={item.answer}
                        onChange={(e) => updateFAQ(item.id, "answer", e.target.value)}
                        placeholder="Answer"
                        rows={2}
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFAQ}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-ink-muted transition hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Add FAQ Item
                </button>
              </div>
            </div>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader title="Payment Numbers" />
            <div className="p-5 space-y-4">
              <Input
                label="bKash Number"
                placeholder="01XXXXXXXXX"
                value={config.bkashNumber}
                onChange={(e) => {
                  updateConfig({ bkashNumber: e.target.value });
                  if (errors.bkashNumber) setErrors((prev) => ({ ...prev, bkashNumber: "" }));
                }}
                error={errors.bkashNumber}
                hint="Leave empty to hide bKash option."
              />
              <Input
                label="Nagad Number"
                placeholder="01XXXXXXXXX"
                value={config.nagadNumber}
                onChange={(e) => {
                  updateConfig({ nagadNumber: e.target.value });
                  if (errors.nagadNumber) setErrors((prev) => ({ ...prev, nagadNumber: "" }));
                }}
                error={errors.nagadNumber}
                hint="Leave empty to hide Nagad option."
              />
              <Input
                label="Rocket Number"
                placeholder="01XXXXXXXXX"
                value={config.rocketNumber}
                onChange={(e) => {
                  updateConfig({ rocketNumber: e.target.value });
                  if (errors.rocketNumber) setErrors((prev) => ({ ...prev, rocketNumber: "" }));
                }}
                error={errors.rocketNumber}
                hint="Leave empty to hide Rocket option."
              />
            </div>
          </Card>

          {/* Save */}
          <div className="flex gap-3 pb-4">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSave}
            >
              <ExternalLink className="h-4 w-4" />
              Save &amp; View My Page
            </Button>
          </div>
        </div>

        {/* ── Live Preview (right) ────────────────────────────────────── */}
        <div className={cn("shrink-0 w-full lg:w-[440px]", !showPreview && "hidden lg:block")}>
          <div className="sticky top-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-border bg-bg px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <div className="ml-2 flex-1 truncate rounded border border-border bg-white px-2 py-0.5 font-mono text-[11px] text-ink-subtle">
                  {pageUrl || "your-page-url-here"}
                </div>
              </div>
              {/* Scrollable preview */}
              <div className="h-[calc(100vh-180px)] overflow-y-auto">
                <div style={{ transform: "scale(0.72)", width: "138.9%", transformOrigin: "top left" }}>
                  <LandingTemplate config={config} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
