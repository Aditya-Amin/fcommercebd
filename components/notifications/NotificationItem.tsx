"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@/lib/types/notification";
import { getIconTone, getNotificationIcon } from "./notification-icons";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onRemove?: (id: string) => void;
  onNavigate?: () => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onRemove,
  onNavigate,
  compact = false
}: NotificationItemProps) {
  const router = useRouter();
  const Icon = getNotificationIcon(notification.icon, notification.type);
  const tone = getIconTone(notification.priority);
  const isUnread = notification.readAt === null;

  const handleClick = () => {
    if (isUnread) onMarkRead(notification.id);
    if (notification.actionUrl) {
      onNavigate?.();
      router.push(notification.actionUrl);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 transition-colors",
        compact ? "py-3" : "py-4",
        notification.actionUrl && "cursor-pointer hover:bg-bg",
        isUnread && "bg-primary/[0.04]"
      )}
      onClick={handleClick}
      role={notification.actionUrl ? "button" : undefined}
      tabIndex={notification.actionUrl ? 0 : undefined}
      onKeyDown={(e) => {
        if (notification.actionUrl && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full",
          tone.wrap
        )}
      >
        <Icon className={cn("h-5 w-5", tone.icon)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug text-ink",
              isUnread ? "font-semibold" : "font-medium"
            )}
          >
            {notification.title}
          </p>
          {isUnread && (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
              aria-label="Unread"
            />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-ink-subtle">{timeAgo(notification.createdAt)}</p>
      </div>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(notification.id);
          }}
          className="absolute right-2 top-2 rounded-md p-1 text-ink-subtle opacity-0 transition hover:bg-white hover:text-ink group-hover:opacity-100"
          aria-label="Remove notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
