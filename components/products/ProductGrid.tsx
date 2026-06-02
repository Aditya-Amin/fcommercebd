"use client";

import Link from "next/link";
import { PackageOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types/product";

interface Props {
  products: Product[];
  loading?: boolean;
  empty: { title: string; description: string };
  addLabel: string;
  stockLabel: string;
  editLabel: string;
  categoryLabels?: Record<string, string>;
  onDelete?: (id: string) => void;
}

export function ProductGrid({
  products,
  loading,
  empty,
  addLabel,
  stockLabel,
  editLabel,
  categoryLabels,
  onDelete
}: Props) {
  if (loading) {
    return (
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-xl border border-border bg-bg/40"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-bg text-ink-muted">
          <PackageOpen className="h-7 w-7" />
        </span>
        <h3 className="mt-3 text-base font-semibold text-ink">{empty.title}</h3>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">{empty.description}</p>
        <Link href="/products/new" className="mt-4 inline-block">
          <Button leftIcon={<Plus className="h-4 w-4" />}>{addLabel}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          categoryLabel={categoryLabels?.[p.category]}
          stockLabel={stockLabel}
          editLabel={editLabel}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
