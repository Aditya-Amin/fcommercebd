"use client";

import { useState, useMemo } from "react";
import {
  User,
  Phone,
  Package,
  BanknoteIcon,
  FileText,
  PlusCircle,
  Truck,
  CheckCircle2,
  AlertCircle,
  Hash,
  ArrowRight,
  Copy
} from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSteadfast } from "@/context/SteadfastContext";
import { useToast } from "@/context/ToastContext";
import { formatBDT } from "@/lib/utils";
import type { Order, Product, SteadfastConsignment } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (
    order: Order,
    consignment: SteadfastConsignment | null,
    productId: string,
    qty: number
  ) => void;
  nextOrderId: string;
  products: Product[];
}

interface FormState {
  customer: string;
  phone: string;
  altPhone: string;
  productId: string;
  qty: string;
  codAmount: string;
  address: string;
  note: string;
  deliveryType: "0" | "1";
}

interface FormErrors {
  customer?: string;
  phone?: string;
  altPhone?: string;
  productId?: string;
  qty?: string;
  codAmount?: string;
  address?: string;
}

type Step = "form" | "booking" | "success" | "error";

const DELIVERY_TYPE_OPTIONS = [
  { label: "Home delivery", value: "0" },
  { label: "Hub pick-up (Steadfast point)", value: "1" }
];

const EMPTY_FORM: FormState = {
  customer: "",
  phone: "",
  altPhone: "",
  productId: "",
  qty: "1",
  codAmount: "",
  address: "",
  note: "",
  deliveryType: "0"
};

function validatePhone(phone: string) {
  return /^01[3-9]\d{8}$/.test(phone.replace(/-/g, ""));
}

export function CreateOrderModal({ open, onClose, onCreated, nextOrderId, products }: Props) {
  const { hasCredentials, bookConsignment } = useSteadfast();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<SteadfastConsignment | null>(null);

  const availableProducts = useMemo(
    () => products.filter((p) => p.stock > 0 && p.status !== "out_of_stock"),
    [products]
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.productId) ?? null,
    [products, form.productId]
  );

  const productOptions = useMemo(
    () => [
      { label: "— Select a product —", value: "" },
      ...availableProducts.map((p) => ({
        label: `${p.name}  (${p.stock} in stock)`,
        value: p.id
      }))
    ],
    [availableProducts]
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-recalculate COD when product or qty changes
      if (key === "productId" || key === "qty") {
        const prod = products.find(
          (p) => p.id === (key === "productId" ? value : prev.productId)
        );
        const qty = parseInt(key === "qty" ? (value as string) : prev.qty, 10);
        if (prod && !isNaN(qty) && qty > 0) {
          next.codAmount = String(prod.price * qty);
        }
      }
      return next;
    });
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};

    if (!form.customer.trim()) next.customer = "Customer name is required.";
    else if (form.customer.trim().length > 100) next.customer = "Max 100 characters.";

    if (!form.phone.trim()) {
      next.phone = "Phone number is required.";
    } else if (!validatePhone(form.phone)) {
      next.phone = "Enter a valid 11-digit Bangladeshi number (e.g. 01711234567).";
    }

    if (form.altPhone && !validatePhone(form.altPhone)) {
      next.altPhone = "Enter a valid 11-digit number or leave blank.";
    }

    if (!form.productId) next.productId = "Select a product.";

    const qty = parseInt(form.qty, 10);
    if (!form.qty || isNaN(qty) || qty < 1) {
      next.qty = "Quantity must be at least 1.";
    } else if (selectedProduct && qty > selectedProduct.stock) {
      next.qty = `Only ${selectedProduct.stock} in stock.`;
    }

    const amt = parseFloat(form.codAmount);
    if (!form.codAmount.trim()) next.codAmount = "COD amount is required.";
    else if (isNaN(amt) || amt < 0) next.codAmount = "Enter a valid amount (≥ 0).";

    if (!form.address.trim()) next.address = "Delivery address is required.";
    else if (form.address.trim().length > 250) next.address = "Max 250 characters.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const qty = parseInt(form.qty, 10);
    const productLabel = selectedProduct
      ? `${selectedProduct.name} ×${qty}`
      : form.productId;

    const baseOrder: Order = {
      id: nextOrderId,
      customer: form.customer.trim(),
      phone: form.phone.replace(/-/g, ""),
      product: productLabel,
      amount: parseFloat(form.codAmount),
      status: "shipped",
      courier: "Steadfast",
      createdAt: new Date().toISOString(),
      deliveryAddress: form.address.trim(),
      ...(form.note.trim() && { note: form.note.trim() })
    };

    // No credentials — save as confirmed for manual booking
    if (!hasCredentials) {
      const confirmedOrder: Order = { ...baseOrder, status: "confirmed", courier: "—" };
      onCreated(confirmedOrder, null, form.productId, qty);
      toast(
        `Order ${nextOrderId} created. Add Steadfast credentials to book courier.`,
        "info"
      );
      handleClose();
      return;
    }

    // Auto-book Steadfast
    setStep("booking");
    setErrorMsg("");

    try {
      const consignment = await bookConsignment(nextOrderId, {
        invoice: nextOrderId,
        recipient_name: form.customer.trim(),
        recipient_phone: form.phone.replace(/-/g, ""),
        recipient_address: form.address.trim(),
        cod_amount: parseFloat(form.codAmount),
        ...(form.altPhone && { alternative_phone: form.altPhone.replace(/-/g, "") }),
        ...(form.note.trim() && { note: form.note.trim() }),
        item_description: productLabel,
        delivery_type: Number(form.deliveryType) as 0 | 1
      });

      const shippedOrder: Order = {
        ...baseOrder,
        consignmentId: consignment.consignmentId,
        trackingCode: consignment.trackingCode,
        steadfastStatus: consignment.status
      };

      onCreated(shippedOrder, consignment, form.productId, qty);
      setResult(consignment);
      setStep("success");
    } catch (err) {
      // Booking failed — save the order as confirmed so user can retry manually
      const fallback: Order = { ...baseOrder, status: "confirmed", courier: "—" };
      onCreated(fallback, null, form.productId, qty);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Could not reach Steadfast. Check your connection or credentials."
      );
      setStep("error");
    }
  }

  function copyTracking() {
    if (!result) return;
    navigator.clipboard.writeText(result.trackingCode);
    toast("Tracking code copied!", "success");
  }

  function handleClose() {
    if (step === "booking") return;
    onClose();
    setTimeout(() => {
      setStep("form");
      setForm(EMPTY_FORM);
      setErrors({});
      setErrorMsg("");
      setResult(null);
    }, 200);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      title={
        step === "success"
          ? "Order created & booked!"
          : step === "error"
          ? "Steadfast booking failed"
          : step === "booking"
          ? "Booking with Steadfast…"
          : (
            <span className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-primary" />
              Create Order
            </span>
          )
      }
      description={
        step === "form"
          ? hasCredentials
            ? `Order ID: ${nextOrderId} · Will auto-book Steadfast on submit`
            : `Order ID: ${nextOrderId} · No Steadfast credentials set`
          : step === "booking"
          ? `Order ${nextOrderId} · booking courier…`
          : undefined
      }
      footer={
        step === "form" ? (
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              leftIcon={<Truck className="h-4 w-4" />}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {hasCredentials ? "Create & Book Steadfast" : "Create Order"}
            </Button>
          </>
        ) : (step === "success" || step === "error") ? (
          <Button onClick={handleClose}>Close</Button>
        ) : undefined
      }
    >
      {/* ── Form step ── */}
      {step === "form" && (
        <div className="space-y-4">
          {/* No-credentials notice */}
          {!hasCredentials && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/5 px-3 py-2.5 text-xs text-ink-muted">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              <span>
                No Steadfast credentials set. Order will be saved as{" "}
                <strong>Confirmed</strong> — book courier manually from the table.{" "}
                <Link href="/integrations" className="font-semibold text-primary hover:underline">
                  Add credentials →
                </Link>
              </span>
            </div>
          )}

          {/* Customer + Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Customer Name"
              name="customer"
              placeholder="e.g. Tasnim Ahmed"
              leftIcon={<User className="h-4 w-4" />}
              value={form.customer}
              onChange={(e) => set("customer", e.target.value)}
              error={errors.customer}
              required
            />
            <Input
              label="Phone Number"
              name="phone"
              placeholder="01711234567"
              leftIcon={<Phone className="h-4 w-4" />}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              error={errors.phone}
              required
            />
          </div>

          {/* Alt phone */}
          <Input
            label="Alternative Phone"
            name="altPhone"
            placeholder="Optional"
            leftIcon={<Phone className="h-4 w-4" />}
            value={form.altPhone}
            onChange={(e) => set("altPhone", e.target.value)}
            error={errors.altPhone}
            hint="Leave blank if not applicable."
          />

          {/* Product picker + Qty */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Select
                label="Product"
                name="productId"
                options={productOptions}
                value={form.productId}
                onChange={(e) => set("productId", (e.target as HTMLSelectElement).value)}
                error={errors.productId}
              />
            </div>
            <Input
              label="Quantity"
              name="qty"
              type="number"
              min={1}
              max={selectedProduct?.stock ?? 999}
              placeholder="1"
              leftIcon={<Hash className="h-4 w-4" />}
              value={form.qty}
              onChange={(e) => set("qty", e.target.value)}
              error={errors.qty}
              hint={selectedProduct ? `${selectedProduct.stock} available` : undefined}
              required
            />
          </div>

          {/* Product info strip */}
          {selectedProduct && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-bg px-3 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 text-ink-muted">
                <Package className="h-3.5 w-3.5" />
                {selectedProduct.name}
              </span>
              <span className="text-ink-subtle">·</span>
              <span className="font-semibold text-ink">
                {formatBDT(selectedProduct.price)} / unit
              </span>
              <span className="text-ink-subtle">·</span>
              <span
                className={
                  selectedProduct.stock <= 5
                    ? "font-semibold text-danger"
                    : "text-ink-muted"
                }
              >
                {selectedProduct.stock} left in stock
              </span>
            </div>
          )}

          {/* COD amount */}
          <Input
            label="COD Amount (৳)"
            name="codAmount"
            type="number"
            min={0}
            placeholder="Auto-calculated from price × qty"
            leftIcon={<BanknoteIcon className="h-4 w-4" />}
            value={form.codAmount}
            onChange={(e) => set("codAmount", e.target.value)}
            error={errors.codAmount}
            hint="Editable — adjust for discounts or custom pricing."
            required
          />

          {/* Delivery address */}
          <Textarea
            label="Delivery Address"
            name="address"
            rows={2}
            placeholder="Flat# A1, House# 17/1, Road# 3/A, Dhanmondi, Dhaka-1209"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            error={errors.address}
            required
          />

          {/* Delivery type + Note */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Delivery Type"
              name="deliveryType"
              options={DELIVERY_TYPE_OPTIONS}
              value={form.deliveryType}
              onChange={(e) =>
                set("deliveryType", (e.target as HTMLSelectElement).value as "0" | "1")
              }
            />
            <Input
              label="Note"
              name="note"
              placeholder="e.g. Call before delivery"
              leftIcon={<FileText className="h-4 w-4" />}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              hint="Optional delivery instruction."
            />
          </div>
        </div>
      )}

      {/* ── Booking in progress ── */}
      {step === "booking" && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Truck className="h-7 w-7 animate-pulse text-primary" />
          </div>
          <p className="font-semibold text-ink">Booking courier with Steadfast…</p>
          <p className="text-sm text-ink-muted">Please wait, do not close this window.</p>
        </div>
      )}

      {/* ── Success ── */}
      {step === "success" && result && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div>
            <p className="font-semibold text-ink">Delivery booked successfully!</p>
            <p className="mt-1 text-sm text-ink-muted">
              Order <strong>{nextOrderId}</strong> is now{" "}
              <strong>Shipped</strong> via Steadfast. Stock has been updated.
            </p>
          </div>
          <div className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-left">
            <p className="text-xs text-ink-muted">Tracking Code</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-lg font-bold tracking-widest text-primary">
                {result.trackingCode}
              </span>
              <button
                onClick={copyTracking}
                className="rounded-lg p-1.5 text-ink-subtle transition hover:bg-border hover:text-ink"
                aria-label="Copy tracking code"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Consignment ID: #{result.consignmentId}
            </p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {step === "error" && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
            <AlertCircle className="h-7 w-7 text-danger" />
          </div>
          <div>
            <p className="font-semibold text-ink">Steadfast booking failed</p>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">{errorMsg}</p>
          </div>
          <div className="w-full rounded-xl border border-warning/40 bg-warning/5 px-4 py-3 text-left text-xs text-ink-muted">
            <strong className="text-ink">Order was still created</strong> as{" "}
            <strong>Confirmed</strong> and stock has been deducted. You can book the
            courier manually from the orders table.
          </div>
        </div>
      )}
    </Modal>
  );
}
