import { ProductEditView } from "@/components/products/ProductEditView";
import { getProductCopy } from "@/lib/api/products";

export default async function EditProductPage({
  params
}: {
  params: { id: string };
}) {
  const copy = await getProductCopy();
  return <ProductEditView id={params.id} copy={copy.form} />;
}
