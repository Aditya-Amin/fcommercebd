import { getNav } from "@/lib/api/marketing";
import { MarketingNavClient } from "./MarketingNavClient";

export async function MarketingNav() {
  const nav = await getNav();
  return <MarketingNavClient content={nav} />;
}
