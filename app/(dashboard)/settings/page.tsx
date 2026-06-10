"use client";

import { useState } from "react";
import { Save, LogOut, Plug, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/context/PlanContext";
import { useToast } from "@/context/ToastContext";
import { useSteadfast } from "@/context/SteadfastContext";
import { delay, formatBDT } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const { plan } = usePlan();
  const { toast } = useToast();
  const { hasCredentials } = useSteadfast();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [business, setBusiness] = useState(user?.business ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    await delay(700);
    updateUser({ name, email, business, phone });
    setSaving(false);
    toast("Profile updated successfully.", "success");
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader title="Profile" description="Your business and contact details." />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Business name" value={business} onChange={(e) => setBusiness(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="flex justify-end border-t border-border bg-bg/50 px-5 py-3">
          <Button onClick={saveProfile} loading={saving} leftIcon={<Save className="h-4 w-4" />}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Card>

      {/* Integrations shortcut */}
      <Card>
        <CardHeader
          title="Integrations"
          description="Courier and third-party service connections."
          action={
            <Link href="/integrations">
              <Button size="sm" variant="ghost">
                Manage →
              </Button>
            </Link>
          }
        />
        <div className="flex items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Plug className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Steadfast Courier</p>
              <p className="text-xs text-ink-muted">Book deliveries directly from Orders</p>
            </div>
          </div>
          {hasCredentials ? (
            <Badge tone="success">Connected</Badge>
          ) : (
            <Link href="/integrations">
              <Button size="sm" variant="outline">Connect</Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Plan shortcut */}
      <Card>
        <CardHeader
          title="Subscription plan"
          description="Manage your plan, upgrade, and review usage."
          action={
            <Link href="/plan-details">
              <Button size="sm" variant="ghost">
                Manage →
              </Button>
            </Link>
          }
        />
        <div className="flex items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{plan.name} plan</p>
              <p className="text-xs text-ink-muted">{formatBDT(plan.price)}/month</p>
            </div>
          </div>
          <Badge tone="primary">Active</Badge>
        </div>
      </Card>

      {/* Sign out */}
      <Card>
        <CardHeader title="Sign out" description="End your current session." />
        <div className="flex items-center justify-between gap-3 p-5">
          <p className="text-sm text-ink-muted">
            You'll need to sign in again to access your dashboard.
          </p>
          <Button variant="outline" leftIcon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}

