export type ProductStatus = "active" | "draft" | "out_of_stock";

export type ProductCategory = string;

export interface Category {
  id: string;
  slug: string;
  name: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  category: ProductCategory;
  status: ProductStatus;
  images: ProductImage[];
  tags: string[];
  facebookPostId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormPayload {
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  category: ProductCategory;
  status: ProductStatus;
  images: ProductImage[];
  tags: string[];
}

export interface ProductListQuery {
  search?: string;
  category?: ProductCategory | "all";
  status?: ProductStatus | "all";
  page?: number;
  perPage?: number;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  perPage: number;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat_women", slug: "women", name: "Women" },
  { id: "cat_men", slug: "men", name: "Men" },
  { id: "cat_kids", slug: "kids", name: "Kids" },
  { id: "cat_accessories", slug: "accessories", name: "Accessories" },
  { id: "cat_beauty", slug: "beauty", name: "Beauty & Cosmetics" },
  { id: "cat_home", slug: "home", name: "Home & Living" }
];

export const PRODUCT_STATUSES: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "out_of_stock", label: "Out of stock" }
];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Active",
  draft: "Draft",
  out_of_stock: "Out of stock"
};
