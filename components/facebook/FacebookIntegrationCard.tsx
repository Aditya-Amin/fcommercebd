"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Facebook,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Plug,
  Users
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/context/ToastContext";
import {
  disconnectFacebookPage,
  getFacebookPages,
  startFacebookConnect
} from "@/lib/api/facebook";
import type { FacebookPage } from "@/lib/types/facebook";

export function FacebookIntegrationCard() {
  const { toast } = useToast();
  const params = useSearchParams();

  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getFacebookPages()
      .then((p) => {
        if (!cancelled) setPages(p);
      })
      .catch((err) => {
        if (!cancelled) toast(err instanceof Error ? err.message : "Failed to load pages", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Strip Facebook's "#_=_" leftover hash that OAuth redirects always append.
  useEffect(() => {
    if (window.location.hash === "#_=_") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Show OAuth result toasts when redirected back from Facebook.
  useEffect(() => {
    const status = params.get("fb");
    if (!status) return;
    if (status === "connected") {
      toast("Facebook page connected successfully.", "success");
      // refresh pages after connect redirect
      getFacebookPages().then(setPages).catch(() => {});
    } else if (status === "failed") {
      const reason = params.get("reason");
      toast(`Facebook connection failed${reason ? `: ${reason}` : ""}.`, "error");
    }
  }, [params, toast]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const { url } = await startFacebookConnect();
      // Redirect to Facebook (or to the mock success URL in mock mode).
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start Facebook OAuth";
      toast(msg, "error");
      setConnecting(false);
    }
  }

  async function handleDisconnect(page: FacebookPage) {
    if (!window.confirm(`Disconnect "${page.pageName}"?`)) return;
    try {
      await disconnectFacebookPage(page.id);
      setPages((prev) => prev.filter((p) => p.id !== page.id));
      toast("Page disconnected.", "info");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Disconnect failed";
      toast(msg, "error");
    }
  }

  const hasPages = pages.length > 0;

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Facebook className="h-5 w-5" style={{ color: "#1877F2" }} />
            Facebook Page
          </span>
        }
        description="Connect a Facebook Page to publish AI-generated posts directly from your dashboard."
        action={
          hasPages ? (
            <Badge tone="success">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </Badge>
          ) : (
            <Badge tone="neutral">Not connected</Badge>
          )
        }
      />
      <div className="space-y-5 p-5">
        {/* Permissions notice */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-bg/40 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" />
          <div className="text-xs text-ink-muted">
            We request the minimum permissions needed to publish on your behalf:{" "}
            <span className="font-mono text-ink">pages_show_list</span>,{" "}
            <span className="font-mono text-ink">pages_read_engagement</span>,{" "}
            <span className="font-mono text-ink">pages_manage_posts</span>. Tokens are
            encrypted on our servers and never exposed to the browser.
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading connected pages…
          </div>
        )}

        {/* Connected pages list */}
        {!loading && hasPages && (
          <div className="space-y-2">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-bg">
                  {page.pictureUrl ? (
                    <Image
                      src={page.pictureUrl}
                      alt={page.pageName}
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Facebook className="absolute inset-0 m-auto h-5 w-5 text-ink-subtle" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{page.pageName}</p>
                    {!page.isActive && <Badge tone="warning">Re-auth needed</Badge>}
                  </div>
                  <p className="flex items-center gap-3 text-xs text-ink-muted">
                    {page.category && <span>{page.category}</span>}
                    {typeof page.fanCount === "number" && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {page.fanCount.toLocaleString()} fans
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="!border-danger/30 !text-danger hover:!bg-danger/5"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => handleDisconnect(page)}
                >
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasPages && (
          <div className="rounded-xl border border-dashed border-border bg-bg/40 p-6 text-center">
            <Facebook className="mx-auto h-8 w-8 text-ink-subtle" />
            <p className="mt-3 text-sm font-medium text-ink">No Facebook page connected yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Connect your Page to enable AI-generated posts and scheduling.
            </p>
          </div>
        )}

        {/* Connect button */}
        <div className="flex flex-wrap gap-2">
          <Button
            leftIcon={<Plug className="h-4 w-4" />}
            onClick={handleConnect}
            loading={connecting}
            style={{ backgroundColor: "#1877F2" }}
            className="!text-white hover:!opacity-90"
          >
            {hasPages ? "Connect another page" : "Connect Facebook Page"}
          </Button>
        </div>

        {/* Help box */}
        <div className="rounded-xl border border-dashed border-border bg-bg/40 p-4 text-sm">
          <p className="font-medium text-ink">How Facebook posting works</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-ink-muted">
            <li>Click <strong className="text-ink">Connect Facebook Page</strong> above.</li>
            <li>You&apos;ll be redirected to Facebook to grant publishing permission.</li>
            <li>
              After connecting, head to <strong className="text-ink">AI Generate</strong>, pick a
              product, and post the AI-written caption to your Page in one click.
            </li>
          </ol>
        </div>
      </div>
    </Card>
  );
}
