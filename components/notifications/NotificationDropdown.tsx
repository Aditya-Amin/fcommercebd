"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import type { NotificationCopy } from "@/lib/types/notification";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
  copy: NotificationCopy;
  onClose: () => void;
}

export function NotificationDropdown({ copy, onClose }: NotificationDropdownProps) {
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

  const panelRef = useRef<HTMLDivElement>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleMarkAll = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await markAllRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const visible = unreadOnly ? items.filter((n) => n.readAt === null) : items;
  const isEmpty = !loading && visible.length === 0;

  return (
    <>
      <button
        aria-label="Close notifications"
        onClick={onClose}
        className="fixed inset-0 z-30 cursor-default"
      />
      <div
        ref={panelRef}
        className="absolute right-0 z-40 mt-2 flex w-[22rem] origin-top-right flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card animate-fade-in sm:w-[24rem]"
        role="dialog"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{copy.header.title}</h3>
            {unreadCount > 0 && (
              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || isMarkingAll}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:text-ink-subtle disabled:hover:bg-transparent"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {copy.header.markAllRead}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border bg-bg/40 px-3 py-2">
          <TabButton active={!unreadOnly} onClick={() => setUnreadOnly(false)}>
            {copy.tabs.all}
          </TabButton>
          <TabButton active={unreadOnly} onClick={() => setUnreadOnly(true)}>
            {copy.tabs.unread}
            {unreadCount > 0 && (
              <span className="ml-1 text-[10px] font-bold text-primary">{unreadCount}</span>
            )}
          </TabButton>
        </div>

        {/* List */}
        <div className="max-h-[26rem] overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="grid place-items-center py-12 text-ink-subtle">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="grid place-items-center gap-2 px-6 py-12 text-center">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-bg">
                <Bell className="h-5 w-5 text-ink-subtle" />
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
                    onNavigate={onClose}
                    compact
                  />
                </li>
              ))}
            </ul>
          )}

          {hasMore && !isEmpty && (
            <div className="border-t border-border p-2">
              <button
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="w-full rounded-lg py-2 text-xs font-medium text-primary transition hover:bg-primary/5 disabled:opacity-60"
              >
                {loadingMore ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> {copy.loading}
                  </span>
                ) : (
                  copy.loadMore
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-bg/40 px-4 py-2.5 text-center">
          <Link
            href="/notifications"
            onClick={onClose}
            className="text-xs font-medium text-primary hover:underline"
          >
            {copy.header.viewAll}
          </Link>
        </div>
      </div>
    </>
  );
}

function TabButton({
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
        "rounded-lg px-3 py-1 text-xs font-medium transition",
        active
          ? "bg-white text-ink shadow-sm ring-1 ring-border"
          : "text-ink-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}
