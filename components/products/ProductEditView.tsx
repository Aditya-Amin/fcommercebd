"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "./ProductForm";
import { getProduct } from "@/lib/api/products";
import type { Product } from "@/lib/types/product";
import type { ProductFormCopy } from "@/lib/types/product-copy";

interface Props {
  id: string;
  copy: ProductFormCopy;
}

export function ProductEditView({ id, copy }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProduct(id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Not found");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center">
        <p className="text-sm text-danger">{error}</p>
        <Link href="/products" className="mt-4 inline-block">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            {copy.cancel}
          </Button>
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="grid place-items-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <ProductForm copy={copy} mode="edit" initial={product} />;
}
