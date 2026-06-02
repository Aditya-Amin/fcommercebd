export interface BkashCopy {
  brand: string;
  modal: {
    title: string;
    subtitle: string;
    summaryLabel: string;
    planLabel: string;
    amountLabel: string;
    merchantLabel: string;
    merchantValue: string;
  };
  steps: {
    intro: BkashStepIntro;
    otp: BkashStepOtp;
    pin: BkashStepPin;
    success: BkashStepSuccess;
    failure: BkashStepFailure;
  };
  footer: { secured: string; support: string };
}

export interface BkashStepIntro {
  title: string;
  description: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneError: string;
  agreement: string;
  submit: string;
  submitting: string;
}

export interface BkashStepOtp {
  title: string;
  description: string;
  otpLabel: string;
  otpPlaceholder: string;
  otpError: string;
  demoHint: string;
  resend: string;
  resendIn: string;
  submit: string;
  submitting: string;
}

export interface BkashStepPin {
  title: string;
  description: string;
  pinLabel: string;
  pinPlaceholder: string;
  pinError: string;
  demoHint: string;
  submit: string;
  submitting: string;
}

export interface BkashStepSuccess {
  title: string;
  description: string;
  transactionLabel: string;
  amountLabel: string;
  continueLabel: string;
}

export interface BkashStepFailure {
  title: string;
  description: string;
  retryLabel: string;
  cancelLabel: string;
}
