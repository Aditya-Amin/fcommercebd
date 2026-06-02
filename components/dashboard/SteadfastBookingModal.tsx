"use client";

import { useState } from "react";
import {
  Truck,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  MapPin,
  Phone,
  Hash,
  FileText
} from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSteadfast } from "@/context/SteadfastContext";
import { useToast } from "@/context/ToastContext";
import { formatBDT } from "@/lib/utils";
import { STEADFAST_STATUS_LABELS } from "@/lib/types";
import type { Order, SteadfastConsignment } from "@/lib/types";

interface Props {
  order: Order;
  open: boolean;
  onClose: () => void;
  onBooked: (orderId: string, consignment: SteadfastConsignment) => void;
}

type Step = "form" | "loading" | "success" | "error";

const DELIVERY_TYPES = [
  { value: "0", label: "Home delivery" },
  { value: "1", label: "Hub pick-up (Steadfast point)" }
];

export function SteadfastBookingModal({ order, open, onClose, onBooked }: Props) {
  const { hasCredentials, bookConsignment } = useSteadfast();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("form");
  const [address, setAddress] = useState(order.deliveryAddress ?? "");
  const [altPhone, setAltPhone] = useState("");
  const [note, setNote] = useState("");
  const [deliveryType, setDeliveryType] = useState<"0" | "1">("0");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<SteadfastConsignment | null>(null);

  function handleClose() {
    if (step === "loading") return;
    onClose();
    // Reset form state after close animation
    setTimeout(() => {
      setStep("form");
      setErrorMsg("");
      setResult(null);
    }, 200);
  }

  async function handleBook() {
    if (!address.trim()) {
      toast("Delivery address is required.", "error");
      return;
    }
    setStep("loading");
    setErrorMsg("");

    try {
      const consignment = await bookConsignment(order.id, {
        invoice: order.id,
        recipient_name: order.customer,
        recipient_phone: order.phone.replace(/-/g, ""),
        recipient_address: address.trim(),
        cod_amount: order.amount,
        ...(altPhone && { alternative_phone: altPhone.replace(/-/g, "") }),
        ...(note && { note: note.trim() }),
        item_description: order.product,
        delivery_type: Number(deliveryType) as 0 | 1
      });

      setResult(consignment);
      onBooked(order.id, consignment);
      setStep("success");
    } catch (err) {
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

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      title={
        step === "success"
          ? "Delivery booked!"
          : step === "error"
          ? "Booking failed"
          : "Book Steadfast delivery"
      }
      description={
        step === "form" || step === "loading"
          ? `Order ${order.id} · ${order.customer}`
          : undefined
      }
      footer={
        step === "form" ? (
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleBook}
              leftIcon={<Truck className="h-4 w-4" />}
              disabled={!hasCredentials}
            >
              Book delivery
            </Button>
          </>
        ) : step === "error" ? (
          <>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={() => setStep("form")}>Try again</Button>
          </>
        ) : step === "success" ? (
          <Button onClick={handleClose}>Close</Button>
        ) : undefined
      }
    >
      {/* ── No credentials warning ── */}
      {step === "form" && !hasCredentials && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-ink">Steadfast credentials not set</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Go to{" "}
              <Link href="/integrations" onClick={handleClose} className="font-medium text-primary underline">
                Integrations
              </Link>{" "}
              to add your API Key and Secret Key.
            </p>
          </div>
        </div>
      )}

      {/* ── Form step ── */}
      {step === "form" && (
        <div className="space-y-4">
          {/* Read-only order summary */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-bg p-4">
            <div>
              <p className="text-xs text-ink-muted">Invoice</p>
              <p className="font-semibold text-ink">{order.id}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">COD amount</p>
              <p className="font-semibold text-ink">{formatBDT(order.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Recipient</p>
              <p className="text-sm text-ink">{order.customer}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Phone</p>
              <p className="text-sm text-ink">{order.phone}</p>
            </div>
          </div>

          {/* Fields user must / can fill */}
          <Textarea
            label="Delivery address"
            placeholder="e.g. House 12, Road 3, Mirpur-10, Dhaka 1216"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={!address.trim() && step === "form" ? undefined : undefined}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Alternative phone"
              placeholder="01XXXXXXXXX"
              leftIcon={<Phone className="h-4 w-4" />}
              value={altPhone}
              onChange={(e) => setAltPhone(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Delivery type</label>
              <div className="flex h-10 overflow-hidden rounded-xl border border-border">
                {DELIVERY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDeliveryType(t.value as "0" | "1")}
                    className={`flex-1 px-2 text-xs font-medium transition ${
                      deliveryType === t.value
                        ? "bg-primary text-white"
                        : "bg-white text-ink-muted hover:bg-bg"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Input
            label="Note for rider (optional)"
            placeholder="e.g. Deliver before 3PM, call on arrival"
            leftIcon={<FileText className="h-4 w-4" />}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <p className="text-xs text-ink-muted">
            Product:{" "}
            <span className="font-medium text-ink">{order.product}</span>
          </p>
        </div>
      )}

      {/* ── Loading step ── */}
      {step === "loading" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <Truck className="absolute inset-0 m-auto h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-ink">Booking with Steadfast…</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Sending order {order.id} to the Steadfast portal.
            </p>
          </div>
        </div>
      )}

      {/* ── Success step ── */}
      {step === "success" && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-success/5 p-4">
            <CheckCircle2 className="h-8 w-8 shrink-0 text-success" />
            <div>
              <p className="font-semibold text-ink">Consignment created</p>
              <p className="text-sm text-ink-muted">
                Order moved to <span className="font-medium">Shipped</span>. Steadfast will pick up soon.
              </p>
            </div>
          </div>

          {/* Tracking code — hero element */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
              Tracking code
            </p>
            <p className="text-3xl font-bold tracking-widest text-ink">
              {result.trackingCode}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              leftIcon={<Copy className="h-3.5 w-3.5" />}
              onClick={copyTracking}
            >
              Copy tracking code
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-bg p-3 text-sm">
            <div>
              <p className="text-xs text-ink-muted">Consignment ID</p>
              <p className="font-semibold text-ink">#{result.consignmentId}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Status</p>
              <Badge tone="primary" className="mt-0.5">
                {STEADFAST_STATUS_LABELS[result.status] ?? result.status}
              </Badge>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-ink-muted">Delivery address</p>
              <p className="text-ink">{result.deliveryAddress}</p>
            </div>
          </div>

          <a
            href={`https://portal.packzy.com`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            View on Steadfast portal <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* ── Error step ── */}
      {step === "error" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="font-semibold text-ink">Booking failed</p>
              <p className="mt-0.5 text-sm text-ink-muted">{errorMsg}</p>
            </div>
          </div>
          <div className="rounded-xl bg-bg p-3 text-xs text-ink-muted">
            <p className="font-semibold text-ink">Common causes:</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>Invalid or expired API credentials</li>
              <li>Duplicate invoice number (order ID already booked)</li>
              <li>Phone number format issue (must be 11 digits)</li>
              <li>Network / firewall blocking Steadfast portal</li>
            </ul>
          </div>
          {!hasCredentials && (
            <Link href="/integrations">
              <Button fullWidth rightIcon={<ArrowRight className="h-4 w-4" />} onClick={handleClose}>
                Go to Integrations
              </Button>
            </Link>
          )}
        </div>
      )}
    </Modal>
  );
}
