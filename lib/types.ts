export type PlanId = "starter" | "growth";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  tagline: string;
  features: { label: string; included: boolean }[];
  limits: {
    aiGenerations: number;
    sms: number;
    fbPosts: number;
  };
  highlight?: boolean;
}

export interface UsageStats {
  aiUsed: number;
  smsUsed: number;
  fbPostsUsed: number;
}

export interface User {
  name: string;
  email: string;
  business: string;
  phone: string;
  avatarColor: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  status: "active" | "draft" | "out_of_stock";
  imageHue: number;
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customer: string;
  phone: string;
  product: string;
  amount: number;
  status: OrderStatus;
  courier: "Steadfast" | "Pathao" | "—";
  createdAt: string;
  // Steadfast consignment data (populated after booking)
  consignmentId?: number;
  trackingCode?: string;
  steadfastStatus?: string;
  deliveryAddress?: string;
}

export interface SteadfastCredentials {
  apiKey: string;
  secretKey: string;
}

export interface SteadfastConsignment {
  consignmentId: number;
  trackingCode: string;
  status: string;
  bookedAt: string;
  deliveryAddress: string;
}

export type SteadfastDeliveryStatus =
  | "in_review"
  | "pending"
  | "delivered_approval_pending"
  | "partial_delivered_approval_pending"
  | "cancelled_approval_pending"
  | "unknown_approval_pending"
  | "delivered"
  | "partial_delivered"
  | "cancelled"
  | "hold"
  | "unknown";

export const STEADFAST_STATUS_LABELS: Record<string, string> = {
  in_review: "In Review",
  pending: "Pending",
  delivered_approval_pending: "Delivered (Approval Pending)",
  partial_delivered_approval_pending: "Partial Delivered (Pending)",
  cancelled_approval_pending: "Cancelled (Approval Pending)",
  unknown_approval_pending: "Unknown (Pending)",
  delivered: "Delivered",
  partial_delivered: "Partially Delivered",
  cancelled: "Cancelled",
  hold: "On Hold",
  unknown: "Unknown"
};

export interface Activity {
  id: string;
  type: "order" | "product" | "ai" | "sms" | "system";
  text: string;
  time: string;
}

export interface GeneratedAsset {
  imageUrl: string;
  caption: string;
  hashtags: string[];
}
