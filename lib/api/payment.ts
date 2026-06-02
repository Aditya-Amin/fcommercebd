/**
 * bKash payment API.
 *
 * Mock implementation that mirrors the bKash Tokenized Checkout flow:
 *   1. createPayment(plan)   → returns paymentId
 *   2. sendOtp(paymentId, phone) → bKash sends OTP to wallet
 *   3. verifyOtp(paymentId, otp) → unlocks PIN step
 *   4. executePayment(paymentId, pin) → charges wallet, returns trxId
 *
 * To wire the real bKash API later, replace the bodies below with calls
 * to the production endpoints (createPayment, executePayment, etc.) and
 * leave the function signatures untouched. The UI does not change.
 */

import { delay } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/types";
import type {
  BkashSession,
  BkashExecuteResult
} from "@/lib/types/payment";
import { apiConfig } from "./client";

const BD_PHONE_RE = /^01[3-9]\d{8}$/;

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function otpExpiry(seconds = 60): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export async function createBkashPayment(planId: PlanId): Promise<BkashSession> {
  if (!apiConfig.useMock) {
    // TODO: POST {apiBase}/payment/bkash/create  { planId } → { paymentId, ... }
    throw new Error("Real bKash API not yet configured");
  }
  await delay(600);
  const plan = PLANS[planId];
  return {
    paymentId: genId("PMT"),
    phone: "",
    amount: plan.price,
    status: "pending",
    otpExpiresAt: otpExpiry()
  };
}

export async function sendBkashOtp(
  session: BkashSession,
  phone: string
): Promise<BkashSession> {
  if (!apiConfig.useMock) {
    // TODO: POST {apiBase}/payment/bkash/{paymentId}/otp  { phone }
    throw new Error("Real bKash API not yet configured");
  }
  await delay(800);
  if (!BD_PHONE_RE.test(phone)) {
    throw new Error("INVALID_PHONE");
  }
  return {
    ...session,
    phone,
    status: "otp_sent",
    otpExpiresAt: otpExpiry()
  };
}

export async function verifyBkashOtp(
  session: BkashSession,
  otp: string
): Promise<BkashSession> {
  if (!apiConfig.useMock) {
    // TODO: POST {apiBase}/payment/bkash/{paymentId}/verify-otp  { otp }
    throw new Error("Real bKash API not yet configured");
  }
  await delay(700);
  if (!/^\d{6}$/.test(otp)) {
    throw new Error("INVALID_OTP");
  }
  return { ...session, status: "pending" };
}

export async function executeBkashPayment(
  session: BkashSession,
  planId: PlanId,
  pin: string
): Promise<BkashExecuteResult> {
  if (!apiConfig.useMock) {
    // TODO: POST {apiBase}/payment/bkash/{paymentId}/execute  { pin }
    throw new Error("Real bKash API not yet configured");
  }
  await delay(1100);
  if (!/^\d{4,5}$/.test(pin)) {
    throw new Error("INVALID_PIN");
  }
  return {
    paymentId: session.paymentId,
    trxId: genId("TX"),
    status: "Completed",
    paidAt: nowIso(),
    amount: session.amount,
    planId
  };
}
