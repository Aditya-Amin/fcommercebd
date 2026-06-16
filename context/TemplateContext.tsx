"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { TemplateConfig } from "@/lib/types";

const STORAGE_KEY = "fcommerce.templates";

const DEFAULT_WHY_BUY = [
  "আমাদের পণ্য ১০০% অরিজিনাল ও মানসম্পন্ন।",
  "আমাদের পণ্যে কোনো কিছু মেশান নেই ইনশাআল্লাহ।",
  "অর্ডার করলে আপনাকে আগে ১ টাকাও পেমেন্ট করতে হবে না।",
  "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি পাবেন।",
  "পণ্য হাতে পেয়ে পছন্দ না হলে রিটার্ন করতে পারবেন।",
  "আমাদের কাছ থেকে প্রতিটি পণ্য যত্ন সহকারে প্যাক করে পাঠানো হয়।",
];

export const DEFAULT_CONFIG: TemplateConfig = {
  businessCategory: "food-beverage",
  templateType: "one-product",
  videoUrl: "",
  countdownEndDate: "",
  landingPageTitle: "আমাদের বিশেষ পণ্য",
  faqItems: [],
  bkashNumber: "",
  nagadNumber: "",
  rocketNumber: "",
  productName: "বিশেষ পণ্য",
  regularPrice: "1500",
  discountPrice: "999",
  businessName: "",
  slug: "",
  productFeatures: [
    "১০০% অর্গানিক ও প্রাকৃতিক উপাদান",
    "সারা বাংলাদেশে হোম ডেলিভারি",
    "মানি ব্যাক গ্যারান্টি",
  ],
  contactPhone: "01XXXXXXXXX",
  selectedProductId: "",
  productImageUrl: "",
  whyBuyReasons: DEFAULT_WHY_BUY,
};

interface TemplateContextValue {
  config: TemplateConfig;
  updateConfig: (partial: Partial<TemplateConfig>) => void;
  saveConfig: (businessName?: string) => string | null;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TemplateConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig({
          ...DEFAULT_CONFIG,
          ...parsed,
          whyBuyReasons: parsed.whyBuyReasons?.length ? parsed.whyBuyReasons : DEFAULT_WHY_BUY,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const updateConfig = (partial: Partial<TemplateConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const saveConfig = (businessName?: string): string | null => {
    const name = (businessName ?? config.businessName).trim();
    if (!name) return null;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
    if (!slug) return null;
    const updated = { ...config, businessName: name, slug };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
    setConfig(updated);
    return slug;
  };

  return (
    <TemplateContext.Provider value={{ config, updateConfig, saveConfig }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error("useTemplate must be used inside TemplateProvider");
  return ctx;
}
