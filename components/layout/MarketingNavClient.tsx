"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { NavContent } from "@/lib/types/marketing";

export function MarketingNavClient({ content }: { content: NavContent }) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex">
          {content.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-muted transition hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button>{content.dashboardLabel}</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">{content.loginLabel}</Button>
              </Link>
              <Link href="/register">
                <Button>{content.registerLabel}</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-ink-muted hover:bg-bg hover:text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={content.mobileMenuLabel}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-border bg-white md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
          {content.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-bg hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2 border-t border-border pt-3">
            {isAuthenticated ? (
              <Link href="/dashboard" className="flex-1">
                <Button fullWidth>{content.dashboardLabel}</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="flex-1">
                  <Button variant="outline" fullWidth>
                    {content.loginLabel}
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button fullWidth>{content.registerLabel}</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
