export type FacebookPostType = "text" | "photo" | "link" | "multi_photo";

export type FacebookPostStatus =
  | "queued"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "rejected"
  | "cancelled";

export interface FacebookPage {
  id: string;
  pageId: string;
  pageName: string;
  category?: string | null;
  pictureUrl?: string | null;
  fanCount?: number | null;
  permissions: string[];
  isActive: boolean;
  tokenExpiry?: string | null;
  lastSyncedAt?: string | null;
  connectedAt?: string | null;
}

export interface FacebookPost {
  id: string;
  pageId: string;
  productId?: string | null;
  type: FacebookPostType;
  message?: string | null;
  linkUrl?: string | null;
  imageUrl?: string | null;
  imageUrls: string[];
  hashtags: string[];
  status: FacebookPostStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  fbPostId?: string | null;
  fbPermalink?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  moderationFlags: string[];
  attempts: number;
  createdAt?: string | null;
}

export interface CreatePostPayload {
  facebook_page_id: string;
  product_id?: string;
  type: FacebookPostType;
  message?: string;
  link_url?: string;
  image_url?: string;
  image_urls?: string[];
  hashtags?: string[];
  scheduled_at?: string;
}

export interface ConnectResponse {
  state: string;
  url: string;
}

export interface AiGeneratePayload {
  product_id: string;
  tone?: "friendly" | "professional" | "promo" | "festive";
  language?: "en" | "bn" | "mixed";
  include_hashtags?: boolean;
}

export interface AiGenerateResult {
  productId: string;
  caption: string;
  hashtags: string[];
  images: string[];
  primary?: string | null;
}

export interface FbPostsQuota {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  locked: boolean;
}
