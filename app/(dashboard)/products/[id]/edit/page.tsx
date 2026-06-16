import { ProductEditView } from "@/components/products/ProductEditView";
import { getProductCopy } from "@/lib/api/products";

export default async function EditProductPage({
  params
}: {
  // Next.js 15+ makes params a Promise — it must be awaited before reading.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const copy = await getProductCopy();
  return <ProductEditView id={id} copy={copy.form} />;
}
