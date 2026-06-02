"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Copy, Truck, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSteadfast } from "@/context/SteadfastContext";
import { useToast } from "@/context/ToastContext";
import { timeAgo } from "@/lib/utils";
import { STEADFAST_STATUS_LABELS } from "@/lib/types";
import type { SteadfastConsignment } from "@/lib/types";

const STATUS_TONES: Record<string, "success" | "primary" | "warning" | "danger" | "neutral"> = {
  delivered: "success",
  partial_delivered: "success",
  delivered_approval_pending: "warning",
  partial_delivered_approval_pending: "warning",
  in_review: "primary",
  pending: "warning",
  hold: "warning",
  cancelled: "danger",
  cancelled_approval_pending: "danger",
  unknown: "neutral",
  unknown_approval_pending: "neutral"
};

interface Props {
  orderId: string;
  consignment: SteadfastConsignment;
  open: boolean;
  onClose: () => void;
}

export function SteadfastTrackModal({ orderId, consignment, open, onClose }: Props) {
  const { hasCredentials, refreshStatus } = useSteadfast();
  const { toast } = useToast();
  const [liveStatus, setLiveStatus] = useState<string>(consignment.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fetch status when modal opens
  useEffect(() => {
    if (open) fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function fetchStatus() {
    if (!hasCredentials) return;
    setLoading(true);
    setError("");
    try {
      const fresh = await refreshStatus(orderId);
      setLiveStatus(fresh.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach Steadfast.");
    } finally {
      setLoading(false);
    }
  }

  function copyTracking() {
    navigator.clipboard.writeText(consignment.trackingCode);
    toast("Tracking code copied!", "success");
  }

  const tone = STATUS_TONES[liveStatus] ?? "neutral";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Steadfast tracking"
      description={`Order ${orderId} · Consignment #${consignment.consignmentId}`}
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />}
            onClick={fetchStatus}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tracking code */}
        <div className="flex items-center justify-between rounded-xl bg-bg px-4 py-3">
          <div>
            <p className="text-xs text-ink-muted">Tracking code</p>
            <p className="text-xl font-bold tracking-widest text-ink">
              {consignment.trackingCode}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Copy className="h-3.5 w-3.5" />}
            onClick={copyTracking}
          >
            Copy
          </Button>
        </div>

        {/* Live status */}
        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-ink-muted" />
            <div>
              <p className="text-xs text-ink-muted">Delivery status</p>
              {loading ? (
                <p className="text-sm text-ink-muted">Fetching…</p>
              ) : (
                <Badge tone={tone}>
                  {STEADFAST_STATUS_LABELS[liveStatus] ?? liveStatus}
                </Badge>
              )}
            </div>
          </div>
          {!hasCredentials && (
            <span className="text-xs text-ink-subtle">Set credentials to refresh</span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-xs text-ink-muted">{error}</p>
          </div>
        )}

        {/* Consignment details */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between border-b border-border py-1.5">
            <span className="text-ink-muted">Consignment ID</span>
            <span className="font-medium text-ink">#{consignment.consignmentId}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border py-1.5">
            <span className="text-ink-muted">Booked</span>
            <span className="font-medium text-ink">{timeAgo(consignment.bookedAt)}</span>
          </div>
          <div className="flex items-start justify-between py-1.5">
            <span className="shrink-0 text-ink-muted">Address</span>
            <span className="ml-4 text-right font-medium text-ink">{consignment.deliveryAddress}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
