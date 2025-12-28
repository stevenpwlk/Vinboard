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
    sparkling: "bg-[#F1E5AC]",
    dessert: "bg-[#E6A522]", // Gold/Amber
    fortified: "bg-[#5D282E]", // Port color
  };

  const bgColor = colorMap[color?.toLowerCase() || ""] || "bg-muted";
  
  // Is it sparkling?
  const isSparkling = type?.toLowerCase().includes("sparkling") || color?.toLowerCase().includes("sparkling");

  return (
    <div className={cn("relative w-8 h-8 flex items-center justify-center", className)}>
      <div 
        className={cn(
          "w-full h-full rounded-full border border-border shadow-sm",
          bgColor,
          isSparkling && "after:content-[''] after:absolute after:top-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-white/80 after:rounded-full after:animate-pulse"
        )} 
      />
    </div>
  );
}
