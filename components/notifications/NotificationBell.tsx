"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import type { NotificationCopy } from "@/lib/types/notification";
import copyJson from "@/lib/mock/notifications/copy.json";
import { NotificationDropdown } from "./NotificationDropdown";

const copy = copyJson as NotificationCopy;

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-ink-muted transition hover:bg-bg hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-white"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationDropdown copy={copy} onClose={() => setOpen(false)} />}
    </div>
  );
}
