"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { ImagePlus, Star, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadProductImage } from "@/lib/api/products";
import type { ProductImage } from "@/lib/types/product";
import type { ProductFormCopy } from "@/lib/types/product-copy";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_EXT = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Some browsers (older Windows builds especially) report odd MIME types for
 * WebP — `image/x-webp`, `application/octet-stream`, or empty string. Fall
 * back to file extension when MIME isn't a clean match. Backend re-validates.
 */
function isAcceptedImage(file: File): boolean {
  if (ACCEPT.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ACCEPT_EXT.some((ext) => lower.endsWith(ext));
}

interface Props {
  value: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  copy: ProductFormCopy["fields"]["images"];
  errors: ProductFormCopy["errors"];
  onError?: (msg: string) => void;
  error?: string;
}

export function ProductImageUpload({
  value,
  onChange,
  copy,
  errors,
  onError,
  error
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  function reportError(message: string) {
    onError?.(message);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const valid: File[] = [];
    for (const f of list) {
      if (!isAcceptedImage(f)) {
        reportError(errors.imageInvalidType);
        continue;
      }
      if (f.size > MAX_BYTES) {
        reportError(errors.imageTooLarge);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        valid.map(async (file) => {
          const { id, url } = await uploadProductImage(file);
          return { id, url, alt: file.name } satisfies ProductImage;
        })
      );
      const merged = [...value, ...uploaded];
      if (!merged.some((m) => m.isPrimary) && merged.length > 0) {
        merged[0].isPrimary = true;
      }
      onChange(merged);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not upload image";
      reportError(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    void handleFiles(e.dataTransfer.files);
  }

  function setPrimary(id: string) {
    onChange(value.map((img) => ({ ...img, isPrimary: img.id === id })));
  }

  function remove(id: string) {
    const next = value.filter((img) => img.id !== id);
    if (next.length > 0 && !next.some((m) => m.isPrimary)) {
      next[0].isPrimary = true;
    }
    onChange(next);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    void handleFiles(e.target.files);
  }

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg/40 p-6 text-center transition hover:border-primary/40 hover:bg-primary-50/40",
          dragActive && "border-primary bg-primary-50/60",
          error && "border-danger/40"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT.join(",")}
          onChange={handleInputChange}
          className="hidden"
        />
        {uploading ? (
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        ) : (
          <ImagePlus className="h-7 w-7 text-ink-muted" />
        )}
        <p className="mt-2 text-sm font-medium text-ink">{copy.uploadCta}</p>
        <p className="text-xs text-ink-muted">{copy.dragHint}</p>
        <p className="mt-1 text-xs text-ink-subtle">{copy.formats}</p>
      </label>

      {error && <p className="text-xs text-danger">{error}</p>}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-white"
            >
              <div className="relative aspect-square w-full">
                <Image
                  src={img.url}
                  alt={img.alt ?? ""}
                  fill
                  sizes="200px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              {img.isPrimary && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="h-3 w-3 fill-current" /> {copy.primary}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(img.id)}
                    className="flex-1 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-ink hover:bg-white"
                    title={copy.setPrimary}
                  >
                    <Star className="mx-auto h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  className="rounded-md bg-danger/90 px-2 py-1 text-[11px] font-medium text-white hover:bg-danger"
                  title={copy.remove}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
