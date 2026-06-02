export type NotificationType =
  | "order_new"
  | "order_status"
  | "fb_post_published"
  | "fb_post_failed"
  | "fb_token_expiring"
  | "low_stock"
  | "sms_low"
  | "plan_limit"
  | "payment_success"
  | "system";

export type NotificationPriority = "low" | "normal" | "high";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  actionUrl: string | null;
  icon: string | null;
  priority: NotificationPriority;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  perPage: number;
  unreadCount: number;
}

export interface NotificationFilters {
  page?: number;
  perPage?: number;
  unreadOnly?: boolean;
}

export interface NotificationCopy {
  header: {
    title: string;
    markAllRead: string;
    viewAll: string;
  };
  tabs: {
    all: string;
    unread: string;
  };
  empty: {
    all: string;
    unread: string;
  };
  loadMore: string;
  loading: string;
  toastTitlePrefix: string;
}
