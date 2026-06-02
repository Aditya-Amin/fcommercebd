import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CtaContent } from "@/lib/types/marketing";

export function CTA({ content }: { content: CtaContent }) {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-600 to-primary-700 px-8 py-14 text-center sm:px-12 lg:px-20">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {content.title}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/85">
              {content.description}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={content.primaryCta.href}>
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {content.primaryCta.label}
                </Button>
              </Link>
              <Link href={content.secondaryCta.href}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50"
                >
                  {content.secondaryCta.label}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
