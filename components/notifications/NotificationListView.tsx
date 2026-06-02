"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { NotificationCopy } from "@/lib/types/notification";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./NotificationItem";

interface NotificationListViewProps {
  copy: NotificationCopy;
}

export function NotificationListView({ copy }: NotificationListViewProps) {
  const {
    items,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    unreadOnly,
    setUnreadOnly,
    loadMore,
    markRead,
    markAllRead,
    remove
  } = useNotifications();

  const visible = unreadOnly ? items.filter((n) => n.readAt === null) : items;
  const isEmpty = !loading && visible.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{copy.header.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
              : "You're all caught up."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<CheckCheck className="h-4 w-4" />}
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
        >
          {copy.header.markAllRead}
        </Button>
      </div>

      <Card>
        <div className="flex items-center justify-end gap-1 border-b border-border px-3 py-2">
          <FilterTab active={!unreadOnly} onClick={() => setUnreadOnly(false)}>
            {copy.tabs.all}
          </FilterTab>
          <FilterTab active={unreadOnly} onClick={() => setUnreadOnly(true)}>
            {copy.tabs.unread}
            {unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] font-bold text-primary">{unreadCount}</span>
            )}
          </FilterTab>
        </div>

        <CardBody className="p-0">
          {loading && items.length === 0 ? (
            <div className="grid place-items-center py-16 text-ink-subtle">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="grid place-items-center gap-3 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-bg">
                <Bell className="h-6 w-6 text-ink-subtle" />
              </div>
              <p className="text-sm text-ink-muted">
                {unreadOnly ? copy.empty.unread : copy.empty.all}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((n) => (
                <li key={n.id}>
                  <NotificationItem
                    notification={n}
                    onMarkRead={markRead}
                    onRemove={remove}
                  />
                </li>
              ))}
            </ul>
          )}

          {hasMore && !isEmpty && (
            <div className="border-t border-border p-3">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                loading={loadingMore}
                onClick={() => void loadMore()}
              >
                {copy.loadMore}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition",
        active
          ? "bg-primary/10 text-primary"
          : "text-ink-muted hover:bg-bg hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}
