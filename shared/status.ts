import type { Bottle } from "./schema";

export type BottleStatus =
  | "to_verify"
  | "wait"
  | "peak"
  | "ready_before_peak"
  | "ready_after_peak"
  | "ready"
  | "drink_soon"
  | "possibly_past";

export function computeBottleStatus(bottle: Bottle, nowYear = new Date().getFullYear()) {
  const windowStart = bottle.windowStartYear ?? null;
  const windowEnd = bottle.windowEndYear ?? null;
  const peakStart = bottle.peakStartYear ?? null;
  const peakEnd = bottle.peakEndYear ?? null;

  const windowLabel = windowStart || windowEnd ? `${windowStart ?? "?"}–${windowEnd ?? "?"}` : "";
  const peakLabel = peakStart || peakEnd ? `${peakStart ?? "?"}–${peakEnd ?? "?"}` : "";

  if (!windowStart || !windowEnd) {
    return {
      status: "to_verify" as const,
      reason: "Missing window",
      windowLabel,
      peakLabel,
    };
  }

  if (nowYear < windowStart) {
    return {
      status: "wait" as const,
      reason: "Before window",
      windowLabel,
      peakLabel,
    };
  }

  if (peakStart && peakEnd && nowYear >= peakStart && nowYear <= peakEnd) {
    return {
      status: "peak" as const,
      reason: "Within peak",
      windowLabel,
      peakLabel,
    };
  }

  if (nowYear <= windowEnd) {
    if (windowEnd - nowYear <= 1) {
      return {
        status: "drink_soon" as const,
        reason: "Window ending",
        windowLabel,
        peakLabel,
      };
    }

    if (peakStart && nowYear < peakStart) {
      return {
        status: "ready_before_peak" as const,
        reason: "Before peak",
        windowLabel,
        peakLabel,
      };
    }

    if (peakEnd && nowYear > peakEnd) {
      return {
        status: "ready_after_peak" as const,
        reason: "After peak",
        windowLabel,
        peakLabel,
      };
    }

    return {
      status: "ready" as const,
      reason: "Within window",
      windowLabel,
      peakLabel,
    };
  }

  return {
    status: "possibly_past" as const,
    reason: "After window",
    windowLabel,
    peakLabel,
  };
}
