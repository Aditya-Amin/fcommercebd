"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  deleteNotification as apiDelete,
  getNotifications,
  getUnreadCount,
  markAllAsRead as apiMarkAll,
  markAsRead as apiMarkRead
} from "@/lib/api/notifications";
import type {
  Notification,
  NotificationPriority
} from "@/lib/types/notification";
import { useToast, type ToastVariant } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

const POLL_INTERVAL_MS = 15_000;
const PAGE_SIZE = 10;

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  unreadOnly: boolean;
  setUnreadOnly: (v: boolean) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationState | null>(null);

function priorityToToastVariant(p: NotificationPriority): ToastVariant {
  if (p === "high") return "error";
  if (p === "low") return "info";
  return "info";
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const lastUnreadCountRef = useRef<number>(0);
  const lastSeenIdsRef = useRef<Set<string>>(new Set());

  const loadFirstPage = useCallback(
    async (opts: { unread?: boolean } = {}) => {
      setLoading(true);
      try {
        const useUnreadOnly = opts.unread ?? unreadOnly;
        const res = await getNotifications({
          page: 1,
          perPage: PAGE_SIZE,
          unreadOnly: useUnreadOnly
        });
        setItems(res.data);
        setTotal(res.total);
        setUnreadCount(res.unreadCount);
        setPage(1);
        setHasMore(res.data.length < res.total);
        lastSeenIdsRef.current = new Set(res.data.map((n) => n.id));
        lastUnreadCountRef.current = res.unreadCount;
      } catch {
        /* swallow — don't disrupt UI on background refresh */
      } finally {
        setLoading(false);
      }
    },
    [unreadOnly]
  );

  const refresh = useCallback(() => loadFirstPage(), [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await getNotifications({
        page: next,
        perPage: PAGE_SIZE,
        unreadOnly
      });
      setItems((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        const merged = [...prev];
        for (const n of res.data) if (!seen.has(n.id)) merged.push(n);
        return merged;
      });
      setPage(next);
      setTotal(res.total);
      setUnreadCount(res.unreadCount);
      const totalLoaded = page * PAGE_SIZE + res.data.length;
      setHasMore(totalLoaded < res.total);
    } catch {
      /* swallow */
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, unreadOnly]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id && n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    lastUnreadCountRef.current = Math.max(0, lastUnreadCountRef.current - 1);
    try {
      await apiMarkRead(id);
    } catch {
      /* optimistic — leave UI as-is */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    setUnreadCount(0);
    lastUnreadCountRef.current = 0;
    try {
      await apiMarkAll();
    } catch {
      /* swallow */
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    let wasUnread = false;
    setItems((prev) => {
      const target = prev.find((n) => n.id === id);
      wasUnread = !!target && target.readAt === null;
      return prev.filter((n) => n.id !== id);
    });
    if (wasUnread) {
      setUnreadCount((c) => Math.max(0, c - 1));
      lastUnreadCountRef.current = Math.max(0, lastUnreadCountRef.current - 1);
    }
    setTotal((t) => Math.max(0, t - 1));
    try {
      await apiDelete(id);
    } catch {
      /* swallow */
    }
  }, []);

  // Reload first page whenever the filter toggles.
  useEffect(() => {
    if (!isAuthenticated) return;
    void loadFirstPage();
  }, [isAuthenticated, unreadOnly, loadFirstPage]);

  // Polling loop: fetch unread count; if it rose, fetch fresh items and toast each new one.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const count = await getUnreadCount();
        if (cancelled) return;

        if (count > lastUnreadCountRef.current) {
          // New unread arrived — pull a fresh first page and diff.
          const res = await getNotifications({
            page: 1,
            perPage: PAGE_SIZE,
            unreadOnly
          });
          if (cancelled) return;

          const newOnes = res.data.filter((n) => !lastSeenIdsRef.current.has(n.id));
          for (const n of newOnes) {
            toast(n.title, priorityToToastVariant(n.priority));
          }

          setItems(res.data);
          setTotal(res.total);
          setHasMore(res.data.length < res.total);
          lastSeenIdsRef.current = new Set(res.data.map((n) => n.id));
        }

        setUnreadCount(count);
        lastUnreadCountRef.current = count;
      } catch {
        /* swallow polling errors */
      }
    };

    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isAuthenticated, toast, unreadOnly]);

  const value = useMemo<NotificationState>(
    () => ({
      items,
      unreadCount,
      total,
      page,
      hasMore,
      loading,
      loadingMore,
      unreadOnly,
      setUnreadOnly,
      refresh,
      loadMore,
      markRead,
      markAllRead,
      remove
    }),
    [
      items,
      unreadCount,
      total,
      page,
      hasMore,
      loading,
      loadingMore,
      unreadOnly,
      refresh,
      loadMore,
      markRead,
      markAllRead,
      remove
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationState {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
