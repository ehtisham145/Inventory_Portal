interface DashboardCardProps {
  label: string;
  value: number | string;
  accent?: "default" | "amber" | "green" | "red" | "orange" | "blue";
}

const accentClasses: Record<NonNullable<DashboardCardProps["accent"]>, string> = {
  default: "text-gray-900",
  amber: "text-amber-600",
  green: "text-green-600",
  red: "text-red-600",
  orange: "text-orange-600",
  blue: "text-blue-600",
};

export function DashboardCard({ label, value, accent = "default" }: DashboardCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accentClasses[accent]}`}>{value}</p>
    </div>
  );
}
