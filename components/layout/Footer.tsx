import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getFooter } from "@/lib/api/marketing";

export async function Footer() {
  const content = await getFooter();
  const copyright = content.copyright.replace("{year}", String(new Date().getFullYear()));

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink-muted">{content.tagline}</p>
          </div>
          {content.columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold text-ink">{col.title}</h4>
              <ul className="space-y-2 text-sm text-ink-muted">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-muted">{copyright}</p>
          <p className="text-xs text-ink-muted">{content.madeIn}</p>
        </div>
      </div>
    </footer>
  );
}
