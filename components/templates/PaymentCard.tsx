interface PaymentCardProps {
  bkash?: string;
  nagad?: string;
  rocket?: string;
}

const METHODS = [
  {
    key: "bkash" as const,
    name: "bKash",
    textColor: "text-pink-700",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    emoji: "💗",
  },
  {
    key: "nagad" as const,
    name: "Nagad",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    emoji: "🟠",
  },
  {
    key: "rocket" as const,
    name: "Rocket",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    emoji: "🟣",
  },
];

export function PaymentCard({ bkash, nagad, rocket }: PaymentCardProps) {
  const numbers: Record<string, string | undefined> = { bkash, nagad, rocket };
  const active = METHODS.filter((m) => numbers[m.key]?.trim());

  if (active.length === 0) return null;

  return (
    <div className={`grid gap-3 ${active.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : active.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
      {active.map(({ key, name, textColor, bgColor, borderColor, emoji }) => (
        <div
          key={key}
          className={`rounded-xl border ${borderColor} ${bgColor} p-4 text-center`}
        >
          <p className="text-lg">{emoji}</p>
          <p className={`mt-1 font-bold ${textColor}`}>{name}</p>
          <p className="mt-1 font-mono text-sm text-gray-700">{numbers[key]}</p>
        </div>
      ))}
    </div>
  );
}
