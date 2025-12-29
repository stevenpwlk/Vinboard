import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (s: string) => {
    switch (s?.toLowerCase()) {
      case "ready":
        return { label: "Ready", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "ready_before_peak":
        return { label: "Ready (before peak)", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "ready_after_peak":
        return { label: "After peak", className: "bg-amber-100 text-amber-800 border-amber-200" };
      case "peak":
        return { label: "Peak", className: "bg-purple-100 text-purple-800 border-purple-200" };
      case "drink_soon":
      case "drink fast":
        return { label: "Drink Soon", className: "bg-orange-100 text-orange-800 border-orange-200" };
      case "wait":
        return { label: "Wait", className: "bg-blue-100 text-blue-800 border-blue-200" };
      case "possibly_past":
      case "past":
        return { label: "Past Peak", className: "bg-red-100 text-red-800 border-red-200" };
      case "to_verify":
      default:
        return { label: "To Verify", className: "bg-gray-100 text-gray-800 border-gray-200" };
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
