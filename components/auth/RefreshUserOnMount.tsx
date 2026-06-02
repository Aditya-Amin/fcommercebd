"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Drop-in component that fires `refreshUser()` once on mount. Place it on
 * pages where the server-side state has just changed (e.g. payment success
 * created a new active subscription) so AuthContext picks up the new data
 * without a full page reload.
 */
export function RefreshUserOnMount() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return null;
}
