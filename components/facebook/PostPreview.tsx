"use client";

import Image from "next/image";
import { Facebook, ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import type { FacebookPage } from "@/lib/types/facebook";

interface Props {
  page: FacebookPage | null;
  caption: string;
  hashtags: string[];
  primaryImage?: string | null;
  extraImages?: string[];
}

export function PostPreview({
  page,
  caption,
  hashtags,
  primaryImage,
  extraImages = []
}: Props) {
  const allImages = [primaryImage, ...extraImages].filter(Boolean) as string[];
  const hasMulti = allImages.length > 1;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-bg">
          {page?.pictureUrl ? (
            <Image
              src={page.pictureUrl}
              alt={page.pageName}
              fill
              sizes="40px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <Facebook className="h-5 w-5" style={{ color: "#1877F2" }} />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {page?.pageName ?? "Your Facebook Page"}
          </p>
          <p className="text-[11px] text-ink-muted">Just now · 🌐</p>
        </div>
      </div>

      {/* Caption */}
      {(caption || hashtags.length > 0) && (
        <div className="px-3 pb-2 text-sm text-ink whitespace-pre-line">
          {caption}
          {hashtags.length > 0 && (
            <div className="mt-2 text-primary">
              {hashtags.join(" ")}
            </div>
          )}
        </div>
      )}

      {/* Image(s) */}
      {allImages.length > 0 && (
        <div
          className={
            hasMulti
              ? "grid grid-cols-2 gap-0.5 bg-border"
              : "relative aspect-[4/3] w-full bg-bg"
          }
        >
          {hasMulti ? (
            allImages.slice(0, 4).map((url, i) => (
              <div key={i} className="relative aspect-square bg-bg">
                <Image
                  src={url}
                  alt={`Image ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 300px"
                  className="object-cover"
                  unoptimized
                />
                {i === 3 && allImages.length > 4 && (
                  <div className="absolute inset-0 grid place-items-center bg-ink/50 text-lg font-semibold text-white">
                    +{allImages.length - 4}
                  </div>
                )}
              </div>
            ))
          ) : (
            <Image
              src={allImages[0]}
              alt="Product"
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover"
              unoptimized
            />
          )}
        </div>
      )}

      {/* Reactions row */}
      <div className="flex items-center justify-around border-t border-border px-3 py-2 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <ThumbsUp className="h-3.5 w-3.5" /> Like
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" /> Comment
        </span>
        <span className="flex items-center gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Share
        </span>
      </div>
    </div>
  );
}
