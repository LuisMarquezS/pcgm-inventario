export type PricingInput = {
  costUSD: number;
  baseSalePriceUSD: number;
  bcvRate: number;
  parallelRate: number;
};

export type PricingResult = {
  adjustedSalePriceUSD: number;
  salePriceBs: number;
  profitUSD: number;
  profitMarginPercent: number;
};

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function calculatePrices(input: PricingInput): PricingResult {
  const adjustedSalePriceUSD =
    input.bcvRate > 0
      ? input.baseSalePriceUSD * input.parallelRate / input.bcvRate
      : 0;
  const salePriceBs = adjustedSalePriceUSD * input.bcvRate;
  const profitUSD = adjustedSalePriceUSD - input.costUSD;
  const profitMarginPercent =
    adjustedSalePriceUSD > 0 ? profitUSD / adjustedSalePriceUSD * 100 : 0;

  return {
    adjustedSalePriceUSD: roundMoney(adjustedSalePriceUSD),
    salePriceBs: roundMoney(salePriceBs),
    profitUSD: roundMoney(profitUSD),
    profitMarginPercent: Math.round(profitMarginPercent * 100) / 100,
  };
}
