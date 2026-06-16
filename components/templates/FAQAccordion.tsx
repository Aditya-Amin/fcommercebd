"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/lib/types";

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-800"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-green-600 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
