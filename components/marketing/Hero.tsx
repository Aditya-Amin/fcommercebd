import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { HeroContent, HeroPreviewContent } from "@/lib/types/marketing";

export function Hero({ content }: { content: HeroContent }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/60 via-white to-white">
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -left-32 top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
              <Sparkles className="h-3.5 w-3.5" /> {content.badge}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {content.titleStart}{" "}
              <span className="bg-gradient-to-r from-primary to-primary-700 bg-clip-text text-transparent">
                {content.titleHighlight}
              </span>
              {content.titleEnd && <> {content.titleEnd}</>}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">
              {content.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={content.primaryCta.href}>
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  {content.primaryCta.label}
                </Button>
              </Link>
              <Link href={content.secondaryCta.href}>
                <Button size="lg" variant="outline">
                  {content.secondaryCta.label}
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-ink-muted">
              {content.trustBadges.map((badge) => (
                <span key={badge} className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <HeroPreview preview={content.preview} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroPreview({ preview }: { preview: HeroPreviewContent }) {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent blur-2xl" />
      <div className="relative rounded-2xl border border-border bg-white p-5 shadow-pop">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {preview.todayLabel}
            </p>
            <p className="text-lg font-semibold text-ink">
              {preview.overviewTitle}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            {preview.liveLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {preview.stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-bg p-3">
              <p className="text-xs text-ink-muted">{s.label}</p>
              <p className="mt-0.5 text-base font-semibold text-ink">{s.value}</p>
              <p className="text-xs font-medium text-success">{s.delta}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">{preview.aiCardTitle}</p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {preview.aiCardBadge}
            </span>
          </div>
          <div className="mt-2 flex gap-3">
            <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-primary-200 via-primary-100 to-white" />
            <div className="flex-1">
              <div className="h-2 w-3/4 rounded bg-bg" />
              <div className="mt-1.5 h-2 w-2/3 rounded bg-bg" />
              <div className="mt-1.5 h-2 w-1/2 rounded bg-bg" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <div className="h-9 flex-1 rounded-lg bg-primary" />
          <div className="h-9 w-9 rounded-lg border border-border" />
          <div className="h-9 w-9 rounded-lg border border-border" />
        </div>
      </div>
    </div>
  );
}
