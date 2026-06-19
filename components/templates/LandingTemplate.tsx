"use client";

import { useRef, useState } from "react";
import { ShoppingCart, CheckCircle, Phone, Star, Plus, Minus, Package } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { FoodBeverageTemplate } from "./FoodBeverageTemplate";
import type { TemplateConfig, FAQItem } from "@/lib/types";

function getEmbedUrl(url: string): string | null {
  if (!url.trim()) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  if (url.includes("facebook.com") && (url.includes("/video") || url.includes("/videos"))) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
  }
  return null;
}

const TESTIMONIALS = [
  { name: "রহিমা বেগম",    location: "ঢাকা",       text: "অসাধারণ পণ্য! সত্যিই উপকার পেয়েছি। দাম একদম সাশ্রয়ী।",          stars: 5 },
  { name: "করিম সাহেব",    location: "চট্টগ্রাম",  text: "দ্রুত ডেলিভারি এবং প্যাকেজিং ছিল অনেক সুন্দর।",                 stars: 5 },
  { name: "সুমাইয়া আক্তার", location: "সিলেট",     text: "দাম অনুযায়ী মান অনেক ভালো। আবার কিনব ইনশাআল্লাহ।",             stars: 5 },
];

/* ── FAQ accordion item ─────────────────────────────────────────────────── */
function FAQRow({ item, open, onToggle }: { item: FAQItem; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-green-100 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-gray-800 hover:text-green-700 md:text-base"
      >
        <span>{item.question}</span>
        {open
          ? <Minus className="h-4 w-4 shrink-0 text-green-600" />
          : <Plus className="h-4 w-4 shrink-0 text-gray-400" />}
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-gray-600 md:text-base">{item.answer}</p>}
    </div>
  );
}

/* ── FAQ accordion section ──────────────────────────────────────────────── */
function FAQSection({ items }: { items: FAQItem[] }) {
  const [openId, setOpenId] = useState<string>(items[0]?.id ?? "");
  return (
    <section className="mt-3 bg-white px-4 py-8 sm:px-6 lg:px-10">
      <SectionHeader>সচরাচর জিজ্ঞাসা (FAQ)</SectionHeader>
      <div className="mx-auto w-full max-w-[1200px] rounded-2xl border border-green-100 bg-green-50/30 px-4 sm:px-6">
        {items.map((item) => (
          <FAQRow
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => setOpenId((prev) => (prev === item.id ? "" : item.id))}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Decorative section heading ─────────────────────────────────────────── */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mb-6 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-green-200" />
      </div>
      <div className="relative rounded-full bg-green-600 px-5 py-2 shadow-md sm:px-7 sm:py-2.5">
        <span className="text-sm font-bold text-white sm:text-base">{children}</span>
      </div>
    </div>
  );
}

/* ── Reusable CTA button ────────────────────────────────────────────────── */
function OrderCTAButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2.5 rounded-md bg-red-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 hover:shadow-xl active:scale-95 sm:px-10 sm:py-4 sm:text-base"
      style={{ boxShadow: "0 4px 15px rgba(220,38,38,0.4)" }}
    >
      <ShoppingCart className="h-5 w-5" />
      অর্ডার করতে চাই
    </button>
  );
}

/* ── Payment brand logos (inline SVG — styled like real logos) ───────────── */

function BkashLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo/BKash.png" alt="bKash" className="h-8 w-auto object-contain" />
  );
}

function RocketLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo/rocket.png" alt="Rocket" className="h-8 w-auto object-contain" />
  );
}

function NagadLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo/Nagad.png" alt="Nagad" className="h-8 w-auto object-contain" />
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
interface Props { config: TemplateConfig }

export function LandingTemplate({ config }: Props) {
  if (config.businessCategory === "food-beverage") {
    return <FoodBeverageTemplate config={config} />;
  }

  const orderFormRef = useRef<HTMLDivElement>(null);
  const [qty, setQty]                       = useState(1);
  const [paymentMethod, setPaymentMethod]   = useState<"cod"|"bkash"|"nagad"|"rocket">("cod");

  const embedUrl   = getEmbedUrl(config.videoUrl);
  const hasPayment = config.bkashNumber || config.nagadNumber || config.rocketNumber;
  const totalPrice = Number(config.discountPrice || 0) * qty;

  const scrollToOrder = () =>
    orderFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div
      className="min-h-screen bg-[#f5f5f5]"
      style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');`}</style>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="bg-white px-4 pb-10 pt-8 text-center sm:px-6 lg:px-10">
        {/* Title */}
        <h1 className="mx-auto mb-5 max-w-[1200px] text-xl font-bold leading-snug text-green-700 sm:text-2xl md:text-3xl lg:text-4xl">
          {config.landingPageTitle || "আমাদের বিশেষ পণ্য"}
        </h1>

        {/* Product image */}
        <div className="mx-auto mb-6 w-full max-w-[240px] sm:max-w-[300px] md:max-w-[360px]">
          <div
            className="overflow-hidden rounded-2xl"
            style={{ border: "4px solid #16a34a", boxShadow: "0 0 0 3px #bbf7d0, 0 8px 32px rgba(22,163,74,0.18)" }}
          >
            {config.productImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.productImageUrl}
                alt={config.landingPageTitle}
                className="h-52 w-full object-cover sm:h-64 md:h-72"
              />
            ) : (
              <div className="flex h-52 w-full flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 sm:h-64 md:h-72">
                <Package className="h-16 w-16 text-green-300" />
                <p className="mt-2 text-xs text-green-400">পণ্যের ছবি</p>
              </div>
            )}
          </div>
        </div>

        {/* Countdown */}
        {config.countdownEndDate && (
          <div className="mb-6">
            <p className="mb-3 text-[20px] font-semibold uppercase tracking-widest text-gray-400">
              অফার শেষ হওয়ার আগেই অর্ডার করুন
            </p>
            <CountdownTimer endDate={config.countdownEndDate} />
          </div>
        )}

        {/* Price */}
        <div className="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-400">রেগুলার মূল্য</span>
            <span className="text-lg font-bold text-gray-400 line-through">৳{config.regularPrice}</span>
          </div>
          <div
            className="rounded-full border-2 border-red-500 bg-red-50 px-4 py-1.5 sm:px-5"
            style={{ boxShadow: "0 2px 8px rgba(239,68,68,0.2)" }}
          >
            <span className="text-sm font-medium text-red-600">বর্তমান ডিসকাউন্ট মূল্য </span>
            <span className="text-lg font-extrabold text-red-600 sm:text-xl">৳{config.discountPrice}</span>
            <span className="text-sm font-medium text-red-600"> টাকা</span>
          </div>
        </div>

        <OrderCTAButton onClick={scrollToOrder} />
      </section>

      {/* ══ WHY USE THIS PRODUCT ══════════════════════════════════════════ */}
      {config.productFeatures.length > 0 && (
        <section className="mt-3 bg-white px-4 py-8 sm:px-6 lg:px-10">
          <SectionHeader>
            {config.landingPageTitle ? `${config.landingPageTitle} কেন খাবেন?` : "এই পণ্য কেন ব্যবহার করবেন?"}
          </SectionHeader>
          <div className="mx-auto w-full max-w-[1200px]">
            <p className="mb-5 rounded-full bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600 sm:text-base">
              এই পণ্যের নিয়মিত ব্যবহারে আপনি পাবেন অসাধারণ উপকার — শরীর ও স্বাস্থ্যের জন্য অতীব গুরুত্বপূর্ণ!
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {config.productFeatures.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-gray-700 md:text-base"
                >
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 text-center">
            <p className="mb-4 text-base font-bold text-gray-800 md:text-lg">
              মাত্র ৳{config.discountPrice} টাকায় পান!
            </p>
            <OrderCTAButton onClick={scrollToOrder} />
          </div>
        </section>
      )}

      {/* ══ VIDEO ═════════════════════════════════════════════════════════ */}
      {embedUrl && (
        <section className="mt-3 bg-white px-4 py-8 sm:px-6 lg:px-10">
          <SectionHeader>পণ্যের ভিডিও দেখুন</SectionHeader>
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="relative overflow-hidden rounded-2xl pb-[56.25%] shadow-md">
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

      {/* ══ WHY BUY FROM US ═══════════════════════════════════════════════ */}
      <section className="mt-3 bg-white px-4 py-8 sm:px-6 lg:px-10">
        <SectionHeader>আমাদের কাছে কেনো কিনবেন?</SectionHeader>
        <div className="mx-auto w-full max-w-[1200px]">
          <ul className="grid gap-2 sm:grid-cols-2">
            {(config.whyBuyReasons ?? []).map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-gray-700 md:text-base"
              >
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span className="leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ PRODUCT IMAGE REPEAT ══════════════════════════════════════════ */}
      {config.productImageUrl && (
        <section className="mt-3 bg-white px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-[320px] sm:max-w-[420px] md:max-w-[540px]">
            <div
              className="overflow-hidden rounded-2xl"
              style={{ border: "3px solid #16a34a", boxShadow: "0 0 0 2px #bbf7d0, 0 8px 24px rgba(22,163,74,0.12)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.productImageUrl}
                alt={config.landingPageTitle}
                className="h-48 w-full object-cover sm:h-56 md:h-64"
              />
            </div>
          </div>
        </section>
      )}

      {/* ══ TESTIMONIALS ══════════════════════════════════════════════════ */}
      <section className="mt-3 bg-white px-4 py-8 sm:px-6 lg:px-10">
        <SectionHeader>আমাদের সন্তুষ্ট গ্রাহকরা</SectionHeader>
        <div className="mx-auto w-full max-w-[1200px] grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm"
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
      {config.faqItems.length > 0 && (
        <FAQSection items={config.faqItems} />
      )}



      {/* ══ CONTACT BANNER ════════════════════════════════════════════════ */}
      <section
        className="mt-3 bg-green-600 px-4 py-7 text-center text-white sm:px-6 lg:px-10"
        style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <p className="mb-1 text-sm font-semibold opacity-90 sm:text-base">যে কোন প্রয়োজনে যোগাযোগ করুন</p>
        <a
          href={`tel:${config.contactPhone}`}
          className="inline-flex items-center gap-2 text-xl font-extrabold hover:underline sm:text-2xl md:text-3xl"
        >
          <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
          {config.contactPhone || "01XXXXXXXXX"}
        </a>
      </section>

      {/* ══ ORDER FORM ════════════════════════════════════════════════════ */}
      <section ref={orderFormRef} className="mt-3 bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-10" id="order-form">
        <h2 className="mb-6 text-center text-lg font-bold text-gray-800 sm:mb-8 sm:text-xl md:text-2xl">
          অর্ডার করতে নিচের ফর্মটি পূরণ করুন
        </h2>

        <div className="mx-auto w-full max-w-[1600px] rounded-2xl border-2 border-green-600 p-4 shadow-md sm:p-6 lg:p-8">
          {/* Two columns on lg+, single column on mobile/tablet */}
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">

            {/* ── LEFT: Billing details ── */}
            <div>
              <h3 className="mb-4 text-base font-bold text-gray-700 sm:text-lg">Billing details</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600 sm:text-sm">
                    আপনার নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="আপনার পুরো নাম লিখুন"
                    className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 sm:h-11"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600 sm:text-sm">
                    Country / Region <span className="text-red-500">*</span>
                  </label>
                  <select className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 sm:h-11">
                    <option>Bangladesh</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600 sm:text-sm">
                    আপনার সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="House number and street name"
                    className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 sm:h-11"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600 sm:text-sm">
                    আপনার ফোন নম্বর <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 sm:h-11"
                  />
                </div>
              </div>

              {/* Your Products table */}
              <div className="mt-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Your Products</h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full min-w-[280px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500">
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-center">Quantity</th>
                        <th className="px-3 py-2 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
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
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                                <Package className="h-5 w-5 text-green-500" />
                              </div>
                            )}
                            <span className="line-clamp-2 text-xs leading-tight text-gray-700 sm:text-sm">
                              {config.landingPageTitle || "পণ্য"} × {qty}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setQty((q) => Math.max(1, q - 1))}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-95"
                            >−</button>
                            <span className="w-7 text-center text-sm font-semibold">{qty}</span>
                            <button
                              onClick={() => setQty((q) => q + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-95"
                            >+</button>
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
              <h3 className="mb-4 text-base font-bold text-gray-700 sm:text-lg">Your order</h3>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">

                {/* Summary rows */}
                <div className="grid grid-cols-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <span>Product</span>
                  <span className="text-right">Subtotal</span>
                </div>
                <div className="mt-2 grid grid-cols-2 border-t border-gray-200 py-3 text-sm text-gray-700">
                  <span className="pr-2 leading-snug">{config.landingPageTitle || "পণ্য"} × {qty}</span>
                  <span className="text-right font-semibold">৳ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 border-t border-gray-200 py-3 text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-right font-semibold">৳ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 border-t border-gray-200 pt-3 text-sm font-bold text-gray-800 sm:text-base">
                  <span>Total</span>
                  <span className="text-right text-green-700">৳ {totalPrice.toFixed(2)}</span>
                </div>

                {/* Payment methods */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <label className="flex cursor-pointer items-center gap-3 py-1.5">
                    <input type="radio" name="lp_pay" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="h-4 w-4 accent-green-600" />
                    <span className="text-sm font-medium text-gray-700 sm:text-base">Cash on delivery</span>
                  </label>
                  <p className="mb-2 pl-7 text-xs text-gray-400">Pay with cash upon delivery.</p>

                  {config.bkashNumber && (
                    <label className="flex cursor-pointer items-center gap-3 py-1.5">
                      <input type="radio" name="lp_pay" checked={paymentMethod === "bkash"} onChange={() => setPaymentMethod("bkash")} className="h-4 w-4 accent-pink-600" />
                      <BkashLogo />
                    </label>
                  )}
                  {config.rocketNumber && (
                    <label className="flex cursor-pointer items-center gap-3 py-1.5">
                      <input type="radio" name="lp_pay" checked={paymentMethod === "rocket"} onChange={() => setPaymentMethod("rocket")} className="h-4 w-4 accent-purple-600" />
                      <RocketLogo />
                    </label>
                  )}
                  {config.nagadNumber && (
                    <label className="flex cursor-pointer items-center gap-3 py-1.5">
                      <input type="radio" name="lp_pay" checked={paymentMethod === "nagad"} onChange={() => setPaymentMethod("nagad")} className="h-4 w-4 accent-orange-500" />
                      <NagadLogo />
                    </label>
                  )}
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-gray-400">
                  আপনার ব্যক্তিগত তথ্য আপনার অর্ডার প্রক্রিয়াকরণের জন্য ব্যবহার করা হবে।
                </p>

                <button
                  onClick={scrollToOrder}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 active:scale-95 sm:py-4 sm:text-base"
                  style={{ background: "linear-gradient(135deg,#ea580c,#dc2626)", boxShadow: "0 4px 12px rgba(220,38,38,0.35)" }}
                >
                  🔒 Place Order ৳{totalPrice.toFixed(2)}
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="mt-6 border-t border-gray-100 bg-white py-6 text-center">
        <p className="px-4 text-xs text-gray-400 sm:text-sm">
          Copyright © {new Date().getFullYear()} {config.businessName || "Your Business Name"} &nbsp;|&nbsp;
          This website made with <span className="text-red-400">❤</span> by{" "}
          <span className="font-semibold text-green-600">Fcommerce BD</span>
        </p>
      </footer>

      {/* ══ STICKY MOBILE / TABLET CTA ════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 p-3 backdrop-blur-sm lg:hidden">
        <button
          onClick={scrollToOrder}
          className="flex w-full items-center justify-center gap-2 rounded-md py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-95 sm:text-base"
          style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}
        >
          <ShoppingCart className="h-5 w-5" />
          এখনই অর্ডার করুন — ৳{config.discountPrice}
        </button>
      </div>
    </div>
  );
}
