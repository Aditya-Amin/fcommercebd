"use client";

import { useState, useEffect } from "react";
import { User, Phone, BanknoteIcon, FileText } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import type { Order, OrderStatus } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onSaved: (updated: Order) => void;
}

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" }
];

interface FormState {
  customer: string;
  phone: string;
  amount: string;
  status: OrderStatus;
  deliveryAddress: string;
  note: string;
}

interface FormErrors {
  customer?: string;
  phone?: string;
  amount?: string;
}

function validatePhone(phone: string) {
  return /^01[3-9]\d{8}$/.test(phone.replace(/-/g, ""));
}

export function EditOrderModal({ open, onClose, order, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>({
    customer: "",
    phone: "",
    amount: "",
    status: "pending",
    deliveryAddress: "",
    note: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (order) {
      setForm({
        customer: order.customer,
        phone: order.phone,
        amount: String(order.amount),
        status: order.status,
        deliveryAddress: order.deliveryAddress ?? "",
        note: order.note ?? ""
      });
      setErrors({});
    }
  }, [order]);

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.customer.trim()) next.customer = "Customer name is required.";
    if (!form.phone.trim()) {
      next.phone = "Phone number is required.";
    } else if (!validatePhone(form.phone)) {
      next.phone = "Enter a valid 11-digit Bangladeshi number.";
    }
    const amt = parseFloat(form.amount);
    if (!form.amount.trim() || isNaN(amt) || amt < 0) {
      next.amount = "Enter a valid amount (≥ 0).";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!order || !validate()) return;
    const updated: Order = {
      ...order,
      customer: form.customer.trim(),
      phone: form.phone.replace(/-/g, ""),
      amount: parseFloat(form.amount),
      status: form.status,
      deliveryAddress: form.deliveryAddress.trim() || order.deliveryAddress,
      note: form.note.trim() || undefined
    };
    onSaved(updated);
    toast(`${order.id} updated.`, "success");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Edit ${order?.id ?? "Order"}`}
      description="Update customer details, amount, or order status."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-4">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="COD Amount (৳)"
            name="amount"
            type="number"
            min={0}
            leftIcon={<BanknoteIcon className="h-4 w-4" />}
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            error={errors.amount}
            required
          />
          <Select
            label="Status"
            name="status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => set("status", (e.target as HTMLSelectElement).value as OrderStatus)}
          />
        </div>

        <Textarea
          label="Delivery Address"
          name="deliveryAddress"
          rows={2}
          placeholder="Flat# A1, House# 17/1, Road# 3/A, Dhanmondi, Dhaka-1209"
          value={form.deliveryAddress}
          onChange={(e) => set("deliveryAddress", e.target.value)}
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
    </Modal>
  );
}
