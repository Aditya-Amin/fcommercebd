"use client";

import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import {
  PRODUCT_STATUSES,
  type Category,
  type ProductStatus
} from "@/lib/types/product";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  category: string | "all";
  onCategoryChange: (value: string | "all") => void;
  status: ProductStatus | "all";
  onStatusChange: (value: ProductStatus | "all") => void;
  categories: Category[];
  searchPlaceholder: string;
  categoryAll: string;
  statusAll: string;
}

export function ProductFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  categories,
  searchPlaceholder,
  categoryAll,
  statusAll
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <Input
          placeholder={searchPlaceholder}
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:w-auto">
        <div className="sm:w-44">
          <Select
            value={category}
            onChange={(e) => onCategoryChange((e.target as HTMLSelectElement).value)}
            options={[
              { label: categoryAll, value: "all" },
              ...categories.map((c) => ({ label: c.name, value: c.slug }))
            ]}
          />
        </div>
        <div className="sm:w-40">
          <Select
            value={status}
            onChange={(e) =>
              onStatusChange((e.target as HTMLSelectElement).value as ProductStatus | "all")
            }
            options={[
              { label: statusAll, value: "all" },
              ...PRODUCT_STATUSES.map((s) => ({ label: s.label, value: s.value }))
            ]}
          />
        </div>
      </div>
    </div>
  );
}
