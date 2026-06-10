"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ImageIcon, Facebook, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const ACCOUNT_NAV = [
  { href: "/settings", label: "Profile", icon: User, exact: true },
];

const MODEL_NAV = [
  { href: "/settings/model/image-generation", label: "Image Generation", icon: ImageIcon },
  { href: "/settings/model/facebook-post", label: "Facebook Post", icon: Facebook },
  { href: "/settings/model/sms-api", label: "SMS API", icon: MessageSquare },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname?.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-primary/10 text-primary"
          : "text-ink-muted hover:bg-bg hover:text-ink"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">Manage your account, AI models, and API integrations.</p>
      </div>

      <div className="flex gap-6">
        {/* Inner sidebar */}
        <aside className="w-52 shrink-0">
          <div className="rounded-xl border border-border bg-white p-3 space-y-4">
            <div>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-ink-subtle">
                Account
              </p>
              <ul className="space-y-0.5">
                {ACCOUNT_NAV.map((item) => (
                  <li key={item.href}>
                    <NavItem {...item} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-ink-subtle">
                Model Settings
              </p>
              <ul className="space-y-0.5">
                {MODEL_NAV.map((item) => (
                  <li key={item.href}>
                    <NavItem {...item} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
