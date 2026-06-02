import { getLoginCopy } from "@/lib/api/auth-copy";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const copy = await getLoginCopy();
  return <LoginForm copy={copy} />;
}
