import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  CreditCard,
  Facebook,
  Info,
  Key,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Truck,
  XCircle,
  type LucideIcon
} from "lucide-react";
import type { NotificationPriority, NotificationType } from "@/lib/types/notification";

const ICON_MAP: Record<string, LucideIcon> = {
  "shopping-bag": ShoppingBag,
  facebook: Facebook,
  "alert-triangle": AlertTriangle,
  "alert-circle": AlertCircle,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  truck: Truck,
  "message-square": MessageSquare,
  "credit-card": CreditCard,
  key: Key,
  sparkles: Sparkles,
  info: Info,
  bell: Bell
};

const TYPE_FALLBACK: Record<NotificationType, LucideIcon> = {
  order_new: ShoppingBag,
  order_status: Truck,
  fb_post_published: Facebook,
  fb_post_failed: AlertCircle,
  fb_token_expiring: Key,
  low_stock: AlertTriangle,
  sms_low: MessageSquare,
  plan_limit: Sparkles,
  payment_success: CreditCard,
  plan_activated: Sparkles,
  sms_updated: MessageSquare,
  ai_updated: Sparkles,
  fb_quota_updated: Facebook,
  usage_reset: CheckCircle,
  system: Info
};

export function getNotificationIcon(
  iconName: string | null | undefined,
  type: NotificationType
): LucideIcon {
  if (iconName && ICON_MAP[iconName]) return ICON_MAP[iconName];
  return TYPE_FALLBACK[type] ?? Bell;
}

const TONE_BY_PRIORITY: Record<
  NotificationPriority,
  { wrap: string; icon: string }
> = {
  high: {
    wrap: "bg-danger/10 ring-1 ring-danger/15",
    icon: "text-danger"
  },
  normal: {
    wrap: "bg-primary/10 ring-1 ring-primary/15",
    icon: "text-primary"
  },
  low: {
    wrap: "bg-ink-subtle/10 ring-1 ring-ink-subtle/15",
    icon: "text-ink-muted"
  }
};

export function getIconTone(priority: NotificationPriority) {
  return TONE_BY_PRIORITY[priority] ?? TONE_BY_PRIORITY.normal;
}
