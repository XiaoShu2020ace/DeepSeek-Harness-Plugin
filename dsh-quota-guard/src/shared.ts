export type QuotaMode = 'week' | 'month';

export interface QuotaConfig {
  mode: QuotaMode;
  bigLimitCny: number;
  smallWindowHours: number;
  smallLimitCny: number;
  inputCnyPerMillion: number;
  cachedInputCnyPerMillion: number;
  outputCnyPerMillion: number;
  reservationOutputTokens: number;
}

export interface QuotaSnapshot {
  config: QuotaConfig;
  accountBalance: number;
  bigUsedCny: number;
  bigRemainingCny: number;
  bigLimitCny: number;
  bigPercentRemaining: number;
  bigWindowMs: number;
  bigResetAt: number | null;
  smallUsedCny: number;
  smallRemainingCny: number;
  smallLimitCny: number;
  smallPercentRemaining: number;
  smallWindowMs: number;
  smallResetAt: number | null;
}

export interface UsageRecord {
  windowLabel: string;
  ts: number;
  cost: number;
}

export const QUOTA_API = {
  state: '/api/dsh-quota-guard/state',
  config: '/api/dsh-quota-guard/config',
  reset: '/api/dsh-quota-guard/reset',
} as const;

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
export const WEEK_SMALL_REFERENCE_HOURS = 70;

export function smallLimitFor(config: QuotaConfig): number {
  return config.mode === 'week'
    ? (config.bigLimitCny * config.smallWindowHours) / WEEK_SMALL_REFERENCE_HOURS
    : config.smallLimitCny;
}

export function windowsFor(config: QuotaConfig): { big: number; small: number } {
  return config.mode === 'week'
    ? { big: WEEK_MS, small: config.smallWindowHours * 60 * 60 * 1000 }
    : { big: MONTH_MS, small: WEEK_MS };
}
