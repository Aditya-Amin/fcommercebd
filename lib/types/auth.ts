export interface RegisterCopy {
  title: string;
  subtitle: string;
  fields: {
    name: { label: string; placeholder: string };
    business: { label: string; placeholder: string };
    phone: { label: string; placeholder: string; hint: string };
    email: { label: string; placeholder: string };
    password: { label: string; placeholder: string };
  };
  errors: {
    required: string;
    passwordTooShort: string;
    invalidPhone: string;
  };
  submit: string;
  submitting: string;
  successToast: string;
  terms: string;
  termsLink: string;
  and: string;
  privacyLink: string;
  termsAccept: string;
  haveAccount: string;
  signIn: string;
  selectedPlanLabel: string;
  willPay: string;
}

export interface LoginCopy {
  title: string;
  subtitle: string;
  fields: {
    email: { label: string; placeholder: string };
    password: { label: string; placeholder: string };
  };
  errors: { required: string };
  submit: string;
  submitting: string;
  successToast: string;
  rememberMe: string;
  forgotPassword: string;
  noAccount: string;
  createOne: string;
  demoNotice: { label: string; text: string };
}

export interface AuthPanelCopy {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  footer: string;
  backHome: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  business?: string;
  phone?: string;
  plan_id?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SubscriptionInfo {
  id: string;
  planId: string | null;
  planDbId: number | null;
  planName: string | null;
  planPrice: number | null;
  status: string;
  startedAt: string | null;
  expiresAt: string | null;
  limits: Record<string, number> | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  business: string | null;
  phone: string | null;
  avatarColor: string;
  createdAt: string | null;
  subscription: SubscriptionInfo | null;
  lastSubscription: SubscriptionInfo | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
