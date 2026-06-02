"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatBDT } from "@/lib/utils";
import {
  PRODUCT_STATUS_LABELS,
  type Product,
  type ProductStatus
} from "@/lib/types/product";

const STATUS_TONES: Record<ProductStatus, "success" | "neutral" | "danger"> = {
  active: "success",
  draft: "neutral",
  out_of_stock: "danger"
};

interface Props {
  product: Product;
  categoryLabel?: string;
  stockLabel: string;
  editLabel: string;
  onDelete?: (id: string) => void;
}

export function ProductCard({
  product,
  categoryLabel,
  stockLabel,
  editLabel,
  onDelete
}: Props) {
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const displayCategory = categoryLabel ?? product.category;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="relative h-44 w-full bg-bg/40">
        {primary ? (
          <Image
            src={primary.url}
            alt={primary.alt ?? product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-ink-subtle">
            No image
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink shadow-sm backdrop-blur">
          {displayCategory}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-ink">{product.title}</h3>
          <Badge tone={STATUS_TONES[product.status]} className="shrink-0">
            {PRODUCT_STATUS_LABELS[product.status]}
          </Badge>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-ink">{formatBDT(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs text-ink-subtle line-through">
                {formatBDT(product.comparePrice)}
              </span>
            )}
          </div>
          <span className="text-xs text-ink-muted">
            {stockLabel} {product.stock}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <Link href={`/products/${product.id}/edit`} className="flex-1">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Edit3 className="h-3.5 w-3.5" />}
              fullWidth
            >
              {editLabel}
            </Button>
          </Link>
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(product.id)}
              className="!border-danger/30 !text-danger hover:!bg-danger/5"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
