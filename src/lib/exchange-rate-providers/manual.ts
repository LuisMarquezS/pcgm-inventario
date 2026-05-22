import type { ProviderRateResult } from "./index";

export function createManualRates(
  bcvRate: number,
  parallelRate: number,
  notes?: string,
): ProviderRateResult {
  return {
    bcvRate,
    parallelRate,
    source: "Manual",
    updatedAt: new Date().toISOString(),
    notes,
  };
}
