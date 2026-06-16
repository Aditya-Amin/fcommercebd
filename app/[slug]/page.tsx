"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { LandingTemplate } from "@/components/templates/LandingTemplate";
import { DEFAULT_CONFIG } from "@/context/TemplateContext";
import type { TemplateConfig } from "@/lib/types";

const STORAGE_KEY = "fcommerce.templates";

export default function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [config, setConfig] = useState<TemplateConfig | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: TemplateConfig = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        if (parsed.slug === slug) {
          setConfig(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setNotFound(true);
  }, [slug]);

  // Loading
  if (!config && !notFound) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  // Not found
  if (notFound) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-5xl font-bold text-gray-300">404</p>
          <h1 className="mt-3 text-xl font-bold text-gray-700">Page not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            The landing page &quot;{slug}&quot; doesn&apos;t exist or hasn&apos;t been published yet.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-block rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <LandingTemplate config={config!} />;
}
