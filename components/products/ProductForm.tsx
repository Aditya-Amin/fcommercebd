"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { ProductImageUpload } from "./ProductImageUpload";
import { CategorySelect } from "./CategorySelect";
import { useToast } from "@/context/ToastContext";
import { createProduct, updateProduct } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import {
  PRODUCT_STATUSES,
  type Category,
  type Product,
  type ProductFormPayload,
  type ProductImage,
  type ProductStatus
} from "@/lib/types/product";
import type { ProductFormCopy } from "@/lib/types/product-copy";

interface Props {
  copy: ProductFormCopy;
  mode: "create" | "edit";
  initial?: Product;
}

interface FormState {
  title: string;
  shortDescription: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: string;
  category: string;
  status: ProductStatus;
  tags: string;
  images: ProductImage[];
}

function makeInitialState(initial?: Product): FormState {
  return {
    title: initial?.title ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    price: initial ? String(initial.price) : "",
    comparePrice: initial?.comparePrice ? String(initial.comparePrice) : "",
    stock: initial ? String(initial.stock) : "",
    category: initial?.category ?? "",
    status: initial?.status ?? "active",
    tags: initial?.tags.join(", ") ?? "",
    images: initial?.images ?? []
  };
}

export function ProductForm({ copy, mode, initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(() => makeInitialState(initial));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((cats) => {
        if (cancelled) return;
        setCategories(cats);
        setForm((s) => (s.category ? s : { ...s, category: cats[0]?.slug ?? "" }));
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load categories";
        toast(msg, "error");
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = copy.errors.titleRequired;
    else if (form.title.trim().length < 3) next.title = copy.errors.titleTooShort;

    const price = Number(form.price);
    if (!form.price) next.price = copy.errors.priceRequired;
    else if (Number.isNaN(price) || price < 0) next.price = copy.errors.priceInvalid;

    const stock = Number(form.stock || "0");
    if (Number.isNaN(stock) || stock < 0) next.stock = copy.errors.stockInvalid;

    if (form.images.length === 0) next.images = copy.errors.imageRequired;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: ProductFormPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      stock: Number(form.stock || "0"),
      category: form.category,
      status: form.status,
      images: form.images,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    };

    setSubmitting(true);
    try {
      if (mode === "edit" && initial) {
        await updateProduct(initial.id, payload);
        toast(copy.successUpdate, "success");
      } else {
        await createProduct(payload);
        toast(copy.successCreate, "success");
      }
      router.push("/products");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : copy.errorGeneric;
      toast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = mode === "edit";
  const submitLabel = submitting
    ? isEdit
      ? copy.submit.updating
      : copy.submit.creating
    : isEdit
      ? copy.submit.update
      : copy.submit.create;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.cancel}
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {isEdit ? copy.editTitle : copy.createTitle}
          </h1>
          <p className="text-sm text-ink-muted">
            {isEdit ? copy.editSubtitle : copy.createSubtitle}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">{copy.sections.basic}</h2>
            <div className="mt-4 space-y-4">
              <Input
                name="title"
                label={copy.fields.title.label}
                placeholder={copy.fields.title.placeholder}
                hint={copy.fields.title.hint}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                error={errors.title}
                maxLength={100}
                required
              />
              <Input
                name="shortDescription"
                label={copy.fields.shortDescription.label}
                placeholder={copy.fields.shortDescription.placeholder}
                hint={copy.fields.shortDescription.hint}
                value={form.shortDescription}
                onChange={(e) => update("shortDescription", e.target.value)}
                maxLength={140}
              />
              <Textarea
                name="description"
                label={copy.fields.description.label}
                placeholder={copy.fields.description.placeholder}
                hint={copy.fields.description.hint}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={6}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">{copy.sections.media}</h2>
            <div className="mt-4">
              <ProductImageUpload
                value={form.images}
                onChange={(imgs) => update("images", imgs)}
                copy={copy.fields.images}
                errors={copy.errors}
                error={errors.images}
                onError={(msg) => toast(msg, "error")}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">{copy.sections.pricing}</h2>
            <div className="mt-4 space-y-4">
              <Input
                name="price"
                type="number"
                inputMode="numeric"
                min={0}
                label={copy.fields.price.label}
                placeholder={copy.fields.price.placeholder}
                hint={copy.fields.price.hint}
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                error={errors.price}
                required
              />
              <Input
                name="comparePrice"
                type="number"
                inputMode="numeric"
                min={0}
                label={copy.fields.comparePrice.label}
                placeholder={copy.fields.comparePrice.placeholder}
                hint={copy.fields.comparePrice.hint}
                value={form.comparePrice}
                onChange={(e) => update("comparePrice", e.target.value)}
              />
              <Input
                name="stock"
                type="number"
                inputMode="numeric"
                min={0}
                label={copy.fields.stock.label}
                placeholder={copy.fields.stock.placeholder}
                hint={copy.fields.stock.hint}
                value={form.stock}
                onChange={(e) => update("stock", e.target.value)}
                error={errors.stock}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">{copy.sections.organize}</h2>
            <div className="mt-4 space-y-4">
              <CategorySelect
                label={copy.fields.category.label}
                value={form.category}
                categories={categories}
                onChange={(slug) => update("category", slug)}
                onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat])}
                copy={copy.categoryNew}
                onError={(msg) => toast(msg, "error")}
                onSuccess={(msg) => toast(msg, "success")}
              />
              <Select
                name="status"
                label={copy.fields.status.label}
                hint={copy.fields.status.hint}
                value={form.status}
                onChange={(e) =>
                  update("status", (e.target as HTMLSelectElement).value as ProductStatus)
                }
                options={PRODUCT_STATUSES.map((s) => ({ label: s.label, value: s.value }))}
              />
              <Input
                name="tags"
                label={copy.fields.tags.label}
                placeholder={copy.fields.tags.placeholder}
                hint={copy.fields.tags.hint}
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
              />
            </div>
          </Card>

          <div className="flex flex-col gap-2">
            <Button type="submit" loading={submitting} fullWidth size="lg">
              {submitLabel}
            </Button>
            <Link href="/products">
              <Button type="button" variant="outline" fullWidth disabled={submitting}>
                {copy.cancel}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
