import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getAuthPanelCopy } from "@/lib/api/auth-copy";

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const panel = await getAuthPanelCopy();
  const footer = panel.footer.replace("{year}", String(new Date().getFullYear()));

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-700 via-primary to-primary-500 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10">
          <Logo
            href="/"
            className="text-white [&_span:last-child]:text-white [&_span:first-child]:bg-white/15 [&_span:first-child]:backdrop-blur-sm"
          />
        </div>
        <div className="relative z-10 max-w-md text-white">
          <p className="text-sm font-medium uppercase tracking-wider text-white/80">
            {panel.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">{panel.title}</h2>
          <p className="mt-4 text-white/85">{panel.description}</p>
          <ul className="mt-6 space-y-2 text-sm text-white/90">
            {panel.highlights.map((h) => (
              <li key={h}>✓ {h}</li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/60">{footer}</p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 lg:hidden">
          <Logo href="/" />
          <Link href="/" className="text-sm font-medium text-ink-muted hover:text-ink">
            {panel.backHome}
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
