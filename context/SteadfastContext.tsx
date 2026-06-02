"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  createConsignment as apiCreateConsignment,
  deleteCredentials as apiDeleteCredentials,
  getCredentialStatus,
  listConsignments,
  saveCredentials as apiSaveCredentials,
  syncConsignmentStatus,
  type CreateConsignmentPayload
} from "@/lib/api/steadfast";
import { useAuth } from "@/context/AuthContext";
import type { SteadfastConsignment, SteadfastCredentials } from "@/lib/types";

interface SteadfastState {
  /** Whether credentials are saved server-side. The keys themselves never leave the backend. */
  hasCredentials: boolean;
  /** true if Steadfast last accepted them; false if Steadfast rejected on a later call. */
  credentialsValid: boolean;
  /** Map of invoice → consignment, hydrated from `/api/steadfast/consignments` on mount. */
  consignments: Record<string, SteadfastConsignment>;
  saveCredentials: (creds: SteadfastCredentials) => Promise<void>;
  clearCredentials: () => Promise<void>;
  getConsignment: (invoice: string) => SteadfastConsignment | undefined;
  /** Books a delivery via Laravel → Steadfast and stores the result locally. */
  bookConsignment: (invoice: string, payload: CreateConsignmentPayload) => Promise<SteadfastConsignment>;
  /** Force-refresh status for a single invoice from Steadfast. */
  refreshStatus: (invoice: string) => Promise<SteadfastConsignment>;
}

const SteadfastContext = createContext<SteadfastState | null>(null);

export function SteadfastProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasCredentials, setHasCredentials] = useState(false);
  const [credentialsValid, setCredentialsValid] = useState(false);
  const [consignments, setConsignments] = useState<Record<string, SteadfastConsignment>>({});

  // Hydrate creds + consignments whenever the authenticated user changes
  // (login, logout, account switch). Server is source of truth — no
  // localStorage caching to bleed across accounts.
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setHasCredentials(false);
      setCredentialsValid(false);
      setConsignments({});
      return;
    }

    getCredentialStatus()
      .then((s) => {
        if (cancelled) return;
        setHasCredentials(s.connected);
        setCredentialsValid(s.isValid);
      })
      .catch(() => {
        if (!cancelled) {
          setHasCredentials(false);
          setCredentialsValid(false);
        }
      });

    listConsignments()
      .then((map) => {
        if (!cancelled) setConsignments(map);
      })
      .catch(() => {
        if (!cancelled) setConsignments({});
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const saveCredentials = useCallback(async (creds: SteadfastCredentials) => {
    const status = await apiSaveCredentials(creds);
    setHasCredentials(status.connected);
    setCredentialsValid(status.isValid);
  }, []);

  const clearCredentials = useCallback(async () => {
    await apiDeleteCredentials();
    setHasCredentials(false);
    setCredentialsValid(false);
  }, []);

  const getConsignment = useCallback(
    (invoice: string) => consignments[invoice],
    [consignments]
  );

  const bookConsignment = useCallback(
    async (invoice: string, payload: CreateConsignmentPayload) => {
      const fresh = await apiCreateConsignment({ ...payload, invoice });
      setConsignments((prev) => ({ ...prev, [invoice]: fresh }));
      return fresh;
    },
    []
  );

  const refreshStatus = useCallback(async (invoice: string) => {
    const fresh = await syncConsignmentStatus(invoice);
    setConsignments((prev) => ({ ...prev, [invoice]: fresh }));
    return fresh;
  }, []);

  const value = useMemo<SteadfastState>(
    () => ({
      hasCredentials,
      credentialsValid,
      consignments,
      saveCredentials,
      clearCredentials,
      getConsignment,
      bookConsignment,
      refreshStatus
    }),
    [
      hasCredentials,
      credentialsValid,
      consignments,
      saveCredentials,
      clearCredentials,
      getConsignment,
      bookConsignment,
      refreshStatus
    ]
  );

  return <SteadfastContext.Provider value={value}>{children}</SteadfastContext.Provider>;
}

export function useSteadfast(): SteadfastState {
  const ctx = useContext(SteadfastContext);
  if (!ctx) throw new Error("useSteadfast must be used within SteadfastProvider");
  return ctx;
}
