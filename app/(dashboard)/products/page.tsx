import { ProductListView } from "@/components/products/ProductListView";
import { getProductCopy, getProducts } from "@/lib/api/products";

export default async function ProductsPage() {
  const [copy, list] = await Promise.all([getProductCopy(), getProducts()]);
  return <ProductListView copy={copy.list} initialProducts={list.data} />;
}
