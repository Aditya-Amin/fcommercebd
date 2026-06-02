"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/lib/types";

const STORAGE_PREFIX = "fcommerce.orders";

function keyFor(uid: string): string {
  return `${STORAGE_PREFIX}:${uid}`;
}

/**
 * Per-user orders store. Drop-in replacement for
 * `useState<Order[]>(MOCK_ORDERS)`. Reads + writes localStorage scoped by
 * the authenticated user's id, so signing out and into a different account
 * never inherits the previous user's orders. Returns `[]` while logged out
 * or before AuthContext finishes hydrating.
 *
 * NOTE: this is a frontend-only persistence layer. A real Order backend
 * (migration + controller + API client) is the proper production path —
 * see `project_tech_debt.md`. Until then, orders survive page reloads on
 * the same browser but not across devices.
 */
export function useOrders(): {
  orders: Order[];
  setOrders: (next: Order[] | ((prev: Order[]) => Order[])) => void;
  isReady: boolean;
} {
  const { user } = useAuth();
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [isReady, setIsReady] = useState(false);

  // One-time cleanup of any pre-existing global key from earlier mock-data
  // builds. Without this, accounts that briefly cached orders under the
  // unscoped name would still see them on first load.
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_PREFIX);
    } catch {
      // ignore
    }
  }, []);

  // Hydrate per-user on auth change.
  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setOrdersState([]);
      setIsReady(true);
      return;
    }
    try {
      const raw = localStorage.getItem(keyFor(uid));
      setOrdersState(raw ? (JSON.parse(raw) as Order[]) : []);
    } catch {
      setOrdersState([]);
    } finally {
      setIsReady(true);
    }
  }, [user?.id]);

  const setOrders = useCallback(
    (next: Order[] | ((prev: Order[]) => Order[])) => {
      setOrdersState((prev) => {
        const resolved = typeof next === "function" ? (next as (p: Order[]) => Order[])(prev) : next;
        const uid = user?.id;
        if (uid) {
          try {
            localStorage.setItem(keyFor(uid), JSON.stringify(resolved));
          } catch {
            // ignore — quota / disabled localStorage
          }
        }
        return resolved;
      });
    },
    [user?.id]
  );

  return { orders, setOrders, isReady };
}
