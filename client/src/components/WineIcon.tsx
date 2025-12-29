import { cn } from "@/lib/utils";

interface WineIconProps {
  color?: string | null;
  type?: string | null;
  className?: string;
}

export function WineIcon({ color, type, className }: WineIconProps) {
  // Determine color class
  const colorMap: Record<string, string> = {
    red: "bg-[#722F37]", // Merlot color
    white: "bg-[#F1E5AC]", // White wine color
    rose: "bg-[#F4C4C0]", // Rose color
    orange: "bg-[#D59A3A]", // Orange wine
    sparkling: "bg-[#F1E5AC]",
    dessert: "bg-[#E6A522]", // Gold/Amber
    sweet: "bg-[#E6A522]",
    fortified: "bg-[#5D282E]", // Port color
  };

  const bgColor = colorMap[color?.toLowerCase() || ""] || "bg-muted";
  
  // Is it sparkling?
  const isSparkling = type?.toLowerCase().includes("sparkling") || color?.toLowerCase().includes("sparkling");

  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden", className)}>
      <div
        className={cn(
          "h-full w-full rounded-full border border-border shadow-sm",
          bgColor,
          isSparkling &&
            "after:content-[''] after:absolute after:top-1 after:right-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-white/80 after:animate-pulse"
        )}
      />
    </div>
  );
}
