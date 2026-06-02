export function BkashLogo({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md bg-[#E2136E] px-2.5 py-1 text-xs font-bold tracking-wider text-white ${className ?? ""}`}
    >
      <span className="grid h-4 w-4 place-items-center rounded-sm bg-white/20 text-[10px]">b</span>
      bKash
    </span>
  );
}
