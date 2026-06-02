export interface HeroContent {
  badge: string;
  titleStart: string;
  titleHighlight: string;
  titleEnd: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  trustBadges: string[];
  preview: HeroPreviewContent;
}

export interface HeroPreviewContent {
  todayLabel: string;
  overviewTitle: string;
  liveLabel: string;
  stats: { label: string; value: string; delta: string }[];
  aiCardTitle: string;
  aiCardBadge: string;
}

export interface StatItem {
  value: string;
  label: string;
  iconName: string;
}

export interface StatsContent {
  eyebrow: string;
  title: string;
  description: string;
  items: StatItem[];
}

export interface ProblemItem {
  iconName: string;
  title: string;
  description: string;
}

export interface ProblemsContent {
  eyebrow: string;
  title: string;
  description: string;
  items: ProblemItem[];
  outroTitle: string;
  outroDescription: string;
}

export interface FeatureItem {
  iconName: string;
  title: string;
  description: string;
}

export interface FeaturesContent {
  eyebrow: string;
  title: string;
  description: string;
  items: FeatureItem[];
}

export interface HowItWorksStep {
  iconName: string;
  title: string;
  description: string;
}

export interface HowItWorksContent {
  eyebrow: string;
  title: string;
  description: string;
  steps: HowItWorksStep[];
}

export interface TestimonialItem {
  name: string;
  role: string;
  business: string;
  avatarHue: number;
  message: string;
  rating: number;
}

export interface TestimonialsContent {
  eyebrow: string;
  title: string;
  description: string;
  items: TestimonialItem[];
}

export interface PricingSectionContent {
  eyebrow: string;
  title: string;
  description: string;
  monthlyLabel: string;
  popularLabel: string;
  starterCtaLabel: string;
  growthCtaLabel: string;
  aiBadgeLabel: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqContent {
  eyebrow: string;
  title: string;
  description: string;
  items: FaqItem[];
}

export interface CtaContent {
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export interface NavLink {
  href: string;
  label: string;
}

export interface NavContent {
  links: NavLink[];
  loginLabel: string;
  registerLabel: string;
  dashboardLabel: string;
  mobileMenuLabel: string;
}

export interface FooterColumn {
  title: string;
  links: { href: string; label: string }[];
}

export interface FooterContent {
  tagline: string;
  columns: FooterColumn[];
  copyright: string;
  madeIn: string;
}
