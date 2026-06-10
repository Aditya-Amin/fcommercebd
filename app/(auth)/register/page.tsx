import { Suspense } from "react";
import { getRegisterCopy } from "@/lib/api/auth-copy";
import { getBkashCopy } from "@/lib/api/payment-copy";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const [copy, bkashCopy] = await Promise.all([
    getRegisterCopy(),
    getBkashCopy()
  ]);
  return (
    <Suspense fallback={null}>
      <RegisterForm copy={copy} bkashCopy={bkashCopy} />
    </Suspense>
  );
}
