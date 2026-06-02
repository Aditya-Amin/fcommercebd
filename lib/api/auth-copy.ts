import { apiFetch } from "./client";
import type { RegisterCopy, LoginCopy, AuthPanelCopy } from "@/lib/types/auth";

import registerMock from "@/lib/mock/auth/register.json";
import loginMock from "@/lib/mock/auth/login.json";
import panelMock from "@/lib/mock/auth/panel.json";

export function getRegisterCopy() {
  return apiFetch<RegisterCopy>(
    "/auth/copy/register",
    () => registerMock as RegisterCopy
  );
}

export function getLoginCopy() {
  return apiFetch<LoginCopy>(
    "/auth/copy/login",
    () => loginMock as LoginCopy
  );
}

export function getAuthPanelCopy() {
  return apiFetch<AuthPanelCopy>(
    "/auth/copy/panel",
    () => panelMock as AuthPanelCopy
  );
}
