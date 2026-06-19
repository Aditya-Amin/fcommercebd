"use client";

import { useRef, useState } from "react";
import {
  ShoppingCart,
  CheckCircle,
  Phone,
  Star,
  Plus,
  Minus,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import type { TemplateConfig, FAQItem } from "@/lib/types";

/* ── embed helper ──────────────────────────────────────────────────── */
function getEmbedUrl(url: string): string | null {
  if (!url.trim()) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  if (url.includes("facebook.com") && (url.includes("/video") || url.includes("/videos")))
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
  return null;
}

/* botanical SVG watermark background (seeds + leaves, same as reference) */
const BOTANICAL_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Ccircle cx='20' cy='20' r='4' fill='%23c8aa6e' opacity='.13'/%3E%3Ccircle cx='20' cy='20' r='1.5' fill='%23c8aa6e' opacity='.22'/%3E%3Ccircle cx='80' cy='55' r='3' fill='%23b5a050' opacity='.11'/%3E%3Ccircle cx='150' cy='30' r='5' fill='%23c8aa6e' opacity='.09'/%3E%3Ccircle cx='130' cy='130' r='3.5' fill='%23b5a050' opacity='.12'/%3E%3Ccircle cx='60' cy='160' r='4' fill='%23c8aa6e' opacity='.1'/%3E%3Ccircle cx='170' cy='100' r='2.5' fill='%23b5a050' opacity='.13'/%3E%3Ccircle cx='40' cy='110' r='2' fill='%23c8aa6e' opacity='.15'/%3E%3Ccircle cx='100' cy='10' r='3' fill='%23b5a050' opacity='.1'/%3E%3Ccircle cx='190' cy='170' r='4' fill='%23c8aa6e' opacity='.09'/%3E%3Cellipse cx='50' cy='80' rx='14' ry='6' fill='none' stroke='%2395b870' stroke-width='1.2' opacity='.12' transform='rotate(-35 50 80)'/%3E%3Cellipse cx='160' cy='60' rx='12' ry='5' fill='none' stroke='%2395b870' stroke-width='1' opacity='.1' transform='rotate(20 160 60)'/%3E%3Cellipse cx='110' cy='155' rx='16' ry='6' fill='none' stroke='%2395b870' stroke-width='1.2' opacity='.11' transform='rotate(-15 110 155)'/%3E%3Cellipse cx='30' cy='140' rx='10' ry='4' fill='none' stroke='%2395b870' stroke-width='1' opacity='.1' transform='rotate(40 30 140)'/%3E%3Ccircle cx='90' cy='90' r='2' fill='%23c8aa6e' opacity='.18'/%3E%3Ccircle cx='180' cy='140' r='3' fill='%23b5a050' opacity='.1'/%3E%3C/svg%3E")`;

const TESTIMONIALS = [
  { name: "রহিমা বেগম", location: "ঢাকা", text: "একদম খাঁটি পণ্য! পরিবারের সবাই খুব পছন্দ করেছে। আগের তেলের চেয়ে অনেক ভালো।", stars: 5 },
  { name: "আলী হোসেন", location: "চট্টগ্রাম", text: "দ্রুত ডেলিভারি এবং প্যাকেজিং অনেক সুন্দর ছিল। আবার অর্ডার করব ইনশাআল্লাহ।", stars: 5 },
  { name: "সুমাইয়া আক্তার", location: "সিলেট", text: "মান অনেক ভালো, কোনো ভেজাল নেই। স্বাদও অনেক ভালো। দাম যুক্তিসঙ্গত।", stars: 5 },
];

/* ── FAQ ────────────────────────────────────────────────────────────── */
function FAQRow({ item, open, onToggle }: { item: FAQItem; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-gray-800 hover:text-green-700 md:text-base"
      >
        <span>{item.question}</span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-green-700" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-gray-600 md:text-base">{item.answer}</p>}
    </div>
  );
}
function FAQSection({ items }: { items: FAQItem[] }) {
  const [openId, setOpenId] = useState<string>(items[0]?.id ?? "");
  return (
    <section className="bg-white px-4 py-10 sm:px-6 lg:px-10">
      <SectionBadge>সচরাচর জিজ্ঞাসা (FAQ)</SectionBadge>
      <div className="mx-auto mt-6 w-full max-w-3xl divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm sm:px-6">
        {items.map((item) => (
          <FAQRow
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => setOpenId((p) => (p === item.id ? "" : item.id))}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Section heading pill (dark green) ─────────────────────────────── */
function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded-full px-6 py-2.5 text-center text-sm font-bold text-white shadow sm:px-8 sm:text-base"
        style={{ background: "linear-gradient(90deg,#14532d,#166534)" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Green hero CTA (matches reference button) ─────────────────────── */
function HeroCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2.5 rounded-lg px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 sm:text-base"
      style={{
        background: "#1a5c38",
        boxShadow: "0 4px 16px rgba(26,92,56,0.35)",
      }}
    >
      অর্ডার করুন
      <ShoppingCart className="h-5 w-5" />
    </button>
  );
}

/* ── Red CTA (used inside other sections) ──────────────────────────── */
function RedCTA({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 sm:px-10 sm:py-4 sm:text-base"
      style={{
        background: "linear-gradient(135deg,#dc2626,#b91c1c)",
        boxShadow: "0 4px 18px rgba(220,38,38,0.4)",
      }}
    >
      {children}
    </button>
  );
}

/* ── Payment logos ───────────────────────────────────────────────────── */
// eslint-disable-next-line @next/next/no-img-element
const BkashLogo = () => <img src="/logo/BKash.png"  alt="bKash"  className="h-8 w-auto object-contain" />;
// eslint-disable-next-line @next/next/no-img-element
const RocketLogo = () => <img src="/logo/rocket.png" alt="Rocket" className="h-8 w-auto object-contain" />;
// eslint-disable-next-line @next/next/no-img-element
const NagadLogo  = () => <img src="/logo/Nagad.png"  alt="Nagad"  className="h-8 w-auto object-contain" />;

/* ════════════════════════════════════════════════════════════════════════ */
interface Props { config: TemplateConfig }

export function FoodBeverageTemplate({ config }: Props) {
  const orderFormRef = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad" | "rocket">("cod");

  const embedUrl  = getEmbedUrl(config.videoUrl);
  const totalPrice = Number(config.discountPrice || 0) * qty;
  const scrollToOrder = () =>
    orderFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'Hind Siliguri', sans-serif", background: "#f5f5f5" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
      `}</style>

      {/* ══ LOGO BAR ══════════════════════════════════════════════════════ */}
      <div className="border-b border-gray-100 bg-white py-4 text-center">
        <span className="text-2xl font-bold tracking-tight text-gray-900">
          {config.businessName || "Logo"}
          <span style={{ color: "#f97316" }}>.</span>
        </span>
      </div>

      {/* ══ HERO (2-col, botanical background) ════════════════════════════ */}
      <section
        className="relative overflow-hidden px-5 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-20"
        style={{
          backgroundColor: "#fdf8ec",
          backgroundImage: BOTANICAL_BG,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-14">

          {/* ── LEFT: Headline + body + CTA ── */}
          <div className="flex-1 text-center lg:text-left">
            <h1
              className="mb-5 text-2xl font-bold leading-snug sm:text-3xl md:text-4xl lg:text-[2.6rem]"
              style={{ color: "#1a5c38" }}
            >
              {config.landingPageTitle || "তেঁতুল কাঠের ঘানিতে ভাঙা কোল্ড প্রেস সরিষার তেল"}
            </h1>

            <p className="mb-7 text-sm leading-relaxed text-gray-700 sm:text-base">
              ডাক্তার, পুষ্টিবিদ, কৃষিবিদদের পরামর্শ মোতাবেক আমাদের দৈনন্দিন
              রান্নায় কোল্ড প্রেস সরিষার তেল ব্যবহার করতে হবে। আমরা পরিবার
              সম্পূর্ণ তেঁতুল কাঠের ঘানিতে ভাঙা প্রথম চাপের কোল্ড প্রেস সরিষার
              তেল নিয়ে কাজ করছি আলহামদুলিল্লাহ।
            </p>

            <HeroCTA onClick={scrollToOrder} />

            {/* Countdown (if set) */}
            {config.countdownEndDate && (
              <div className="mt-7">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400 sm:text-sm">
                  অফার শেষ হওয়ার আগেই অর্ডার করুন
                </p>
                <CountdownTimer endDate={config.countdownEndDate} />
              </div>
            )}

            {/* Price */}
            {(config.regularPrice || config.discountPrice) && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {config.regularPrice && (
                  <span className="text-sm font-medium text-gray-400">
                    নিয়মিত মূল্য:{" "}
                    <span className="font-bold line-through">৳{config.regularPrice}</span>
                  </span>
                )}
                {config.discountPrice && (
                  <span
                    className="rounded-full px-4 py-1.5 text-sm font-extrabold"
                    style={{
                      background: "#fef2f2",
                      border: "2px solid #dc2626",
                      color: "#dc2626",
                    }}
                  >
                    অফার মূল্য: ৳{config.discountPrice}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product image card ── */}
          <div className="w-full max-w-xs shrink-0 sm:max-w-sm lg:w-[400px] lg:max-w-none">
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                background: "#ffffff",
                boxShadow: "0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
                border: "1px solid rgba(200,180,120,0.2)",
              }}
            >
              {config.productImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.productImageUrl}
                  alt={config.landingPageTitle}
                  className="h-64 w-full object-cover sm:h-80 lg:h-[360px]"
                />
              ) : (
                <div
                  className="flex h-64 w-full flex-col items-center justify-center sm:h-80 lg:h-[360px]"
                  style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}
                >
                  <Package className="h-16 w-16 text-green-300" />
                  <p className="mt-2 text-xs text-green-400">পণ্যের ছবি</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ══ BENEFITS ══════════════════════════════════════════════════════ */}
      {config.productFeatures.length > 0 && (
        <section className="mt-3 bg-white px-4 py-10 sm:px-6 lg:px-10">
          <SectionBadge>
            {config.landingPageTitle
              ? `${config.landingPageTitle} এর উপকারিতা`
              : "এই পণ্যের উপকারিতা"}
          </SectionBadge>

          <div
            className="mx-auto mt-5 max-w-2xl rounded-xl px-4 py-3 text-center text-sm font-semibold sm:text-base"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#14532d" }}
          >
            নিয়মিত ব্যবহারে পাবেন অসাধারণ উপকার — শরীর ও স্বাস্থ্যের জন্য অতীব গুরুত্বপূর্ণ!
          </div>

          <ul className="mx-auto mt-5 max-w-3xl grid gap-3 sm:grid-cols-2">
            {config.productFeatures.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm text-gray-700 md:text-base"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
              >
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span className="leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 text-center">
            <p className="mb-4 text-base font-bold text-gray-700 sm:text-lg">
              মাত্র ৳{config.discountPrice} টাকায় পান!
            </p>
            <RedCTA onClick={scrollToOrder}>
              <ShoppingCart className="h-5 w-5" />
              অর্ডার করুন
            </RedCTA>
          </div>
        </section>
      )}

      {/* ══ PRODUCTION PROCESS ════════════════════════════════════════════ */}
      <section
        className="mt-3 px-4 py-10 sm:px-6 lg:px-10"
        style={{ background: "#fefce8" }}
      >
        <SectionBadge>কিভাবে উৎপাদন করা হয়?</SectionBadge>
        <div className="mx-auto mt-6 max-w-3xl">
          <div
            className="rounded-2xl bg-white p-5 text-sm leading-relaxed text-gray-700 shadow-sm sm:p-7 sm:text-base"
            style={{ border: "1px solid #fde68a" }}
          >
            <p className="mb-4">
              আমাদের পণ্য সম্পূর্ণ ঐতিহ্যবাহী পদ্ধতিতে তৈরি করা হয়। দেশি বীজ থেকে শুরু করে
              চূড়ান্ত প্যাকেজিং পর্যন্ত প্রতিটি ধাপে মান নিশ্চিত করা হয়।
            </p>
            <p className="mb-4">
              আমরা কোনো প্রিজারভেটিভ, কৃত্রিম রং বা সুগন্ধি ব্যবহার করি না। কম গতিতে
              ঘানি ভাঙার ফলে পণ্যের পুষ্টিগুণ সম্পূর্ণ অক্ষুণ্ণ থাকে।
            </p>
            <p>
              আমাদের বিশেষজ্ঞ কৃষিবিদ দলের তত্ত্বাবধানে উৎপাদিত এই পণ্য আপনার পরিবারের
              স্বাস্থ্য সুরক্ষায় সর্বোত্তম ভূমিকা রাখবে।
            </p>
          </div>
        </div>
      </section>

      {/* ══ 6 DIFFERENTIATOR CARDS ════════════════════════════════════════ */}
      <section className="mt-3 bg-white px-4 py-10 sm:px-6 lg:px-10">
        <SectionBadge>আমাদের বিশেষত্ব</SectionBadge>
        <div className="mx-auto mt-6 max-w-3xl grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { emoji: "🌾", title: "দেশি বীজ",          desc: "শতভাগ দেশীয় বীজ থেকে তৈরি" },
            { emoji: "👁️",  title: "নিজস্ব তত্ত্বাবধান", desc: "প্রতিটি ব্যাচ সরাসরি পর্যবেক্ষণ" },
            { emoji: "🚫", title: "প্রিজারভেটিভ নেই", desc: "কোনো কৃত্রিম উপাদান নেই" },
            { emoji: "📅", title: "এক বছর মেয়াদ",     desc: "দীর্ঘস্থায়ী গুণগত মান" },
            { emoji: "🧑‍🌾", title: "কৃষিবিদ পরিচালিত", desc: "বিশেষজ্ঞ দলের তদারকিতে" },
            { emoji: "🚚", title: "ক্যাশ অন ডেলিভারি", desc: "পেলে তারপর পরিশোধ করুন" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
              style={{ border: "1.5px solid #bbf7d0", background: "#f0fdf4" }}
            >
              <span className="text-3xl">{item.emoji}</span>
              <span className="text-xs font-bold text-green-800 sm:text-sm">{item.title}</span>
              <span className="text-[11px] leading-tight text-gray-500 sm:text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ TRUST / WHY BUY ═══════════════════════════════════════════════ */}
      <section
        className="mt-3 px-4 py-10 sm:px-6 lg:px-10"
        style={{ background: "#f0fdf4" }}
      >
        <SectionBadge>আমাদের উপর কেন আস্থা রাখবেন!</SectionBadge>
        <div className="mx-auto mt-6 max-w-3xl">
          <ul className="grid gap-3 sm:grid-cols-2">
            {((config.whyBuyReasons ?? []).length > 0
              ? config.whyBuyReasons!
              : [
                  "ক্যাশ অন ডেলিভারিতে পণ্য পাঠানো হয় — পেলে তারপর টাকা দিন",
                  "১০০% খাঁটি ও মানসম্পন্ন পণ্য, কোনো ভেজাল নেই",
                  "দ্রুত ডেলিভারি — সারাদেশে ৩-৫ কার্যদিবসের মধ্যে",
                  "সন্তুষ্ট না হলে পণ্য ফেরত দেওয়ার সুযোগ আছে",
                ]
            ).map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 text-sm text-gray-700 shadow-sm md:text-base"
                style={{ border: "1px solid #bbf7d0" }}
              >
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span className="leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ PRODUCT IMAGE HIGHLIGHT + CTA ═════════════════════════════════ */}
      {config.productImageUrl && (
        <section className="mt-3 bg-white px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-sm text-center">
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                border: "3px solid #16a34a",
                boxShadow: "0 0 0 3px #bbf7d0, 0 8px 30px rgba(22,163,74,0.15)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.productImageUrl}
                alt={config.landingPageTitle}
                className="h-52 w-full object-cover sm:h-64"
              />
            </div>
            <div className="mt-5">
              <RedCTA onClick={scrollToOrder}>
                <ShoppingCart className="h-5 w-5" />
                অর্ডার করুন — ৳{config.discountPrice}
              </RedCTA>
            </div>
          </div>
        </section>
      )}

      {/* ══ VIDEO ═════════════════════════════════════════════════════════ */}
      {embedUrl && (
        <section className="mt-3 bg-white px-4 py-10 sm:px-6 lg:px-10">
          <SectionBadge>পণ্যের ভিডিও দেখুন</SectionBadge>
          <div className="mx-auto mt-6 max-w-3xl">
            <div className="relative overflow-hidden rounded-2xl pb-[56.25%] shadow-lg">
              <iframe
                src={embedUrl}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Product video"
              />
            </div>
          </div>
        </section>
      )}

      {/* ══ TESTIMONIALS ══════════════════════════════════════════════════ */}
      <section
        className="mt-3 px-4 py-10 sm:px-6 lg:px-10"
        style={{ background: "#f0fdf4" }}
      >
        <SectionBadge>আমাদের সন্তুষ্ট গ্রাহকরা</SectionBadge>
        <div className="mx-auto mt-6 max-w-4xl grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-5 shadow-sm"
              style={{ border: "1px solid #bbf7d0" }}
            >
              <div className="mb-2 flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-3 text-sm leading-relaxed text-gray-600">&ldquo;{t.text}&rdquo;</p>
              <p className="text-xs font-bold text-gray-700">
                — {t.name}, <span className="font-normal text-gray-500">{t.location}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
      {config.faqItems.length > 0 && <FAQSection items={config.faqItems} />}

      {/* ══ CONTACT BANNER ════════════════════════════════════════════════ */}
      <section
        className="mt-3 px-4 py-8 text-center text-white sm:px-6 lg:px-10"
        style={{
          background: "linear-gradient(135deg,#14532d,#16a34a)",
          boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <p className="mb-2 text-sm font-semibold opacity-90 sm:text-base">
          যে কোনো প্রয়োজনে কল করুন বা WhatsApp করুন
        </p>
        <a
          href={`tel:${config.contactPhone}`}
          className="inline-flex items-center gap-2 text-2xl font-extrabold hover:underline sm:text-3xl"
        >
          <Phone className="h-6 w-6" />
          {config.contactPhone || "01XXXXXXXXX"}
        </a>
        <p className="mt-2 text-xs opacity-75 sm:text-sm">
          শনিবার থেকে বৃহস্পতিবার, সকাল ৯টা — রাত ১০টা
        </p>
      </section>

      {/* ══ ORDER FORM ════════════════════════════════════════════════════ */}
      <section
        ref={orderFormRef}
        className="mt-3 bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-10"
        id="order-form"
      >
        <div className="mb-8 text-center">
          <div
            className="inline-block rounded-full px-6 py-2.5 text-sm font-bold text-white sm:text-base"
            style={{ background: "linear-gradient(90deg,#dc2626,#b91c1c)" }}
          >
            🛒 অর্ডার করতে নিচের ফর্মটি পূরণ করুন
          </div>
        </div>

        <div
          className="mx-auto w-full max-w-4xl rounded-2xl p-5 shadow-md sm:p-7 lg:p-9"
          style={{ border: "2px solid #16a34a" }}
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">

            {/* ── LEFT: Billing ── */}
            <div>
              <h3 className="mb-5 border-b border-gray-100 pb-3 text-base font-bold text-gray-800 sm:text-lg">
                Billing details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 sm:text-sm">
                    আপনার নামঃ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="আপনার পুরো নাম লিখুন"
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 sm:text-sm">
                    ফোন নাম্বারঃ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 sm:text-sm">
                    ঠিকানাঃ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="গ্রাম / মহল্লা / বাড়ি নম্বর"
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 sm:text-sm">উপজেলাঃ</label>
                  <input
                    type="text"
                    placeholder="আপনার উপজেলা লিখুন"
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 sm:text-sm">
                    জেলাঃ <span className="text-red-500">*</span>
                  </label>
                  <select className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200">
                    <option value="">জেলা নির্বাচন করুন</option>
                    {["ঢাকা","চট্টগ্রাম","সিলেট","রাজশাহী","খুলনা","বরিশাল","ময়মনসিংহ","রংপুর","কুমিল্লা","গাজীপুর","নারায়ণগঞ্জ","টাঙ্গাইল","ফরিদপুর","মাদারীপুর","শরীয়তপুর"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product table */}
              <div className="mt-6">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">আপনার পণ্য</h4>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400">
                        <th className="px-3 py-2.5 text-left">পণ্য</th>
                        <th className="px-3 py-2.5 text-center">পরিমাণ</th>
                        <th className="px-3 py-2.5 text-right">মূল্য</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-100">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {config.productImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={config.productImageUrl}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
                                <Package className="h-5 w-5 text-green-400" />
                              </div>
                            )}
                            <span className="line-clamp-2 text-xs leading-snug text-gray-700">
                              {config.landingPageTitle || "পণ্য"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setQty((q) => Math.max(1, q - 1))}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 font-bold hover:bg-gray-50 active:scale-95"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{qty}</span>
                            <button
                              onClick={() => setQty((q) => q + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 font-bold hover:bg-gray-50 active:scale-95"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-semibold text-gray-800">
                          ৳{(Number(config.discountPrice) * qty).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Order summary ── */}
            <div>
              <h3 className="mb-5 border-b border-gray-100 pb-3 text-base font-bold text-gray-800 sm:text-lg">
                Your order
              </h3>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                  <span>Product</span><span>Subtotal</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-gray-200 py-3 text-sm text-gray-700">
                  <span className="pr-2 leading-snug">{config.landingPageTitle || "পণ্য"} × {qty}</span>
                  <span className="shrink-0 font-semibold">৳ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 py-3 text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">৳ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold">
                  <span>Total</span>
                  <span style={{ color: "#14532d" }}>৳ {totalPrice.toFixed(2)}</span>
                </div>

                {/* Payment */}
                <div className="mt-5 space-y-2 border-t border-gray-200 pt-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input type="radio" name="fb_pay" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="h-4 w-4 accent-green-700" />
                    <span className="text-sm font-medium text-gray-700">Cash on delivery</span>
                  </label>
                  {paymentMethod === "cod" && (
                    <p className="pl-7 text-xs text-gray-400">পণ্য পাওয়ার পরে নগদ টাকা পরিশোধ করুন।</p>
                  )}
                  {config.bkashNumber && (
                    <label className="flex cursor-pointer items-center gap-3">
                      <input type="radio" name="fb_pay" checked={paymentMethod === "bkash"} onChange={() => setPaymentMethod("bkash")} className="h-4 w-4 accent-pink-600" />
                      <BkashLogo />
                    </label>
                  )}
                  {config.rocketNumber && (
                    <label className="flex cursor-pointer items-center gap-3">
                      <input type="radio" name="fb_pay" checked={paymentMethod === "rocket"} onChange={() => setPaymentMethod("rocket")} className="h-4 w-4 accent-purple-600" />
                      <RocketLogo />
                    </label>
                  )}
                  {config.nagadNumber && (
                    <label className="flex cursor-pointer items-center gap-3">
                      <input type="radio" name="fb_pay" checked={paymentMethod === "nagad"} onChange={() => setPaymentMethod("nagad")} className="h-4 w-4 accent-orange-500" />
                      <NagadLogo />
                    </label>
                  )}
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-gray-400">
                  আপনার ব্যক্তিগত তথ্য শুধুমাত্র অর্ডার প্রক্রিয়াকরণের জন্য ব্যবহার করা হবে।
                </p>

                <button
                  onClick={scrollToOrder}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white shadow-md transition hover:opacity-90 active:scale-95 sm:text-base"
                  style={{
                    background: "linear-gradient(135deg,#dc2626,#b91c1c)",
                    boxShadow: "0 4px 14px rgba(220,38,38,0.4)",
                  }}
                >
                  🔒 Place Order — ৳{totalPrice.toFixed(2)}
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="mt-3 border-t border-gray-100 bg-white py-7 text-center">
        <p className="px-4 text-xs text-gray-400 sm:text-sm">
          Copyright © {new Date().getFullYear()}{" "}
          {config.businessName || "Your Business Name"} &nbsp;|&nbsp; This website made with{" "}
          <span className="text-red-400">❤</span> by{" "}
          <span className="font-semibold text-green-700">Fcommerce BD</span>
        </p>
      </footer>

      {/* ══ STICKY MOBILE CTA ═════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 p-3 backdrop-blur-sm lg:hidden">
        <button
          onClick={scrollToOrder}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-95 sm:text-base"
          style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}
        >
          <ShoppingCart className="h-5 w-5" />
          এখনই অর্ডার করুন — ৳{config.discountPrice || "—"}
        </button>
      </div>
    </div>
  );
}
