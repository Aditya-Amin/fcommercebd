import { ProductForm } from "@/components/products/ProductForm";
import { getProductCopy } from "@/lib/api/products";

export default async function NewProductPage() {
  const copy = await getProductCopy();
  return <ProductForm copy={copy.form} mode="create" />;
}
