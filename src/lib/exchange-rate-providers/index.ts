export type ExchangeRateSource = "Manual" | "CrystoDolar" | "Futuro BCV" | "Futuro Binance P2P";

export type ProviderRateResult = {
  bcvRate: number;
  parallelRate: number;
  source: ExchangeRateSource;
  updatedAt: string;
  notes?: string;
};

export type ExchangeRateProvider = {
  id: string;
  label: string;
  fetchRates: () => Promise<ProviderRateResult>;
};
