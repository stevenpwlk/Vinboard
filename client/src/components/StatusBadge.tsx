import { cn } from "@/lib/utils";
import { mapStatusLabel } from "@/i18n";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (s: string) => {
    switch (s?.toLowerCase()) {
      case "ready":
        return { label: mapStatusLabel(s), className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "ready_before_peak":
        return { label: mapStatusLabel(s), className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "ready_after_peak":
        return { label: mapStatusLabel(s), className: "bg-amber-100 text-amber-800 border-amber-200" };
      case "peak":
        return { label: mapStatusLabel(s), className: "bg-purple-100 text-purple-800 border-purple-200" };
      case "drink_soon":
      case "drink fast":
        return { label: mapStatusLabel("drink_soon"), className: "bg-orange-100 text-orange-800 border-orange-200" };
      case "wait":
        return { label: mapStatusLabel(s), className: "bg-blue-100 text-blue-800 border-blue-200" };
      case "possibly_past":
      case "past":
        return { label: mapStatusLabel("possibly_past"), className: "bg-red-100 text-red-800 border-red-200" };
      case "to_verify":
      default:
        return { label: mapStatusLabel("to_verify"), className: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
