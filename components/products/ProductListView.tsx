"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductFilters } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";
import { useToast } from "@/context/ToastContext";
import { deleteProduct, getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import type {
  Category,
  Product,
  ProductStatus
} from "@/lib/types/product";
import type { ProductListCopy } from "@/lib/types/product-copy";

interface Props {
  copy: ProductListCopy;
  initialProducts: Product[];
}

export function ProductListView({ copy, initialProducts }: Props) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | "all">("all");
  const [status, setStatus] = useState<ProductStatus | "all">("all");

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch(() => {
        /* non-blocking */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProducts({
      search: search || undefined,
      category,
      status
    })
      .then((res) => {
        if (!cancelled) setProducts(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load";
          toast(msg, "error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, category, status, toast]);

  const categoryLabels = useMemo(
    () => categories.reduce<Record<string, string>>((acc, c) => {
      acc[c.slug] = c.name;
      return acc;
    }, {}),
    [categories]
  );

  async function handleDelete(id: string) {
    if (!window.confirm(copy.deleteConfirm)) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast(copy.deleteSuccess, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : copy.deleteError;
      toast(msg, "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{copy.title}</h1>
          <p className="text-sm text-ink-muted">
            {products.length} {copy.subtitle}
          </p>
        </div>
        <Link href="/products/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>{copy.addButton}</Button>
        </Link>
      </div>

      <Card>
        <ProductFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          status={status}
          onStatusChange={setStatus}
          categories={categories}
          searchPlaceholder={copy.searchPlaceholder}
          categoryAll={copy.categoryAll}
          statusAll={copy.statusAll}
        />

        <ProductGrid
          products={products}
          loading={loading}
          empty={copy.empty}
          addLabel={copy.addButton}
          stockLabel={copy.stockLabel}
          editLabel={copy.editButton}
          categoryLabels={categoryLabels}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}
