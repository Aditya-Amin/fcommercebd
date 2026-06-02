import { getRegisterCopy } from "@/lib/api/auth-copy";
import { getBkashCopy } from "@/lib/api/payment-copy";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const [copy, bkashCopy] = await Promise.all([
    getRegisterCopy(),
    getBkashCopy()
  ]);
  return <RegisterForm copy={copy} bkashCopy={bkashCopy} />;
}
