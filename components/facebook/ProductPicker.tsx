"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Check, PackagePlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/lib/types/product";
import { formatBDT } from "@/lib/utils";

interface Props {
  selectedId: string | null;
  onSelect: (product: Product) => void;
}

export function ProductPicker({ selectedId, onSelect }: Props) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProducts({ status: "active" })
      .then((res) => {
        if (!cancelled) setProducts(res.data);
      })
      .catch((err) => {
        if (!cancelled) toast(err instanceof Error ? err.message : "Failed to load", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [products, search]);

  if (!loading && products.length === 0) {
    return (
      <Card className="p-8 text-center">
        <PackagePlus className="mx-auto h-10 w-10 text-ink-subtle" />
        <h3 className="mt-3 text-sm font-semibold text-ink">No active products yet</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Add a product first, then come back to generate a post.
        </p>
        <Link href="/products/new" className="mt-4 inline-block">
          <Button>Add product</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search your products…"
        leftIcon={<Search className="h-4 w-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-bg/40" />
          ))}
        </div>
      ) : (
        <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {filtered.map((p) => {
            const isSelected = p.id === selectedId;
            const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p)}
                className={`group flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                  isSelected
                    ? "border-primary bg-primary-50/50 ring-2 ring-primary/20"
                    : "border-border bg-white hover:border-primary/40 hover:bg-bg/40"
                }`}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-bg">
                  {primary ? (
                    <Image
                      src={primary.url}
                      alt={p.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-ink-subtle">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                  <p className="text-xs text-ink-muted">
                    {formatBDT(p.price)}
                    <span className="text-ink-subtle"> · stock {p.stock}</span>
                  </p>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-ink-muted">
              No products match &quot;{search}&quot;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
