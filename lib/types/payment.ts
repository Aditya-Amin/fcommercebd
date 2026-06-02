import type { PlanId } from "@/lib/types";

export type PaymentMethod = "bkash";
export type PaymentStatus = "pending" | "otp_sent" | "completed" | "failed";

export interface PaymentIntent {
  paymentId: string;
  planId: PlanId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface BkashSession {
  paymentId: string;
  phone: string;
  amount: number;
  status: PaymentStatus;
  otpExpiresAt: string;
}

export interface BkashExecuteResult {
  paymentId: string;
  trxId: string;
  status: "Completed" | "Failed";
  paidAt: string;
  amount: number;
  planId: PlanId;
}
