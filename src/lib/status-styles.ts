import type { ChipStatus, FactoryStatus } from "@/types/dashboard";

export const factoryStatusClass: Record<FactoryStatus, string> = {
  Healthy: "bg-emerald-50 text-emerald-700",
  Attention: "bg-amber-50 text-amber-700",
  Critical: "bg-red-50 text-red-700",
};

export const chipStatusClass: Record<ChipStatus, string> = {
  Pass: "bg-emerald-50 text-emerald-700",
  Fail: "bg-amber-50 text-amber-700",
  Error: "bg-red-50 text-red-700",
};
