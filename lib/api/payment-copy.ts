import { apiFetch } from "./client";
import type { BkashCopy } from "@/lib/types/payment-copy";

import bkashMock from "@/lib/mock/payment/bkash.json";

export function getBkashCopy() {
  return apiFetch<BkashCopy>(
    "/payment/copy/bkash",
    () => bkashMock as BkashCopy
  );
}
