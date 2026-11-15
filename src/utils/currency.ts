export type AppCurrency = 'NGN' | 'USD';

export const USD_TO_NGN_RATE = 1600;
export const GBP_TO_NGN_RATE = 2000;
export const EUR_TO_NGN_RATE = 1750;

export function detectCurrencySymbol(symbolOrCode?: string): 'NGN' | 'USD' | 'GBP' | 'EUR' {
  const s = (symbolOrCode || '').trim().toUpperCase();
  if (s === '$' || s === 'USD') return 'USD';
  if (s === '£' || s === 'GBP') return 'GBP';
  if (s === '€' || s === 'EUR') return 'EUR';
  return 'NGN';
}

export function convertAmount(
  amount: number,
  from: 'NGN' | 'USD' | 'GBP' | 'EUR',
  to: AppCurrency
): number {
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;

  // Normalize to NGN first
  let amountInNGN = amount;
  if (from === 'USD') amountInNGN = amount * USD_TO_NGN_RATE;
  else if (from === 'GBP') amountInNGN = amount * GBP_TO_NGN_RATE;
  else if (from === 'EUR') amountInNGN = amount * EUR_TO_NGN_RATE;

  if (to === 'NGN') {
    return Math.round(amountInNGN);
  }

  // Convert NGN -> USD
  const usd = amountInNGN / USD_TO_NGN_RATE;
  return Math.round(usd * 100) / 100;
}

export function formatMoney(
  amountNGN: number,
  currency: AppCurrency,
  explicitUSD?: number
): string {
  if (currency === 'NGN') {
    return `₦${Math.round(amountNGN).toLocaleString('en-NG')}`;
  }
  const usdValue =
    explicitUSD !== undefined && Number.isFinite(explicitUSD)
      ? explicitUSD
      : Math.round((amountNGN / USD_TO_NGN_RATE) * 100) / 100;

  if (Number.isInteger(usdValue)) {
    return `$${usdValue.toLocaleString('en-US')}`;
  }
  return `$${usdValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAmountInCurrency(
  amount: number,
  sourceCurrency: string | undefined,
  targetCurrency: AppCurrency
): string {
  const src = detectCurrencySymbol(sourceCurrency);
  const converted = convertAmount(amount, src, targetCurrency);
  if (targetCurrency === 'NGN') {
    return `₦${Math.round(converted).toLocaleString('en-NG')}`;
  }
  if (Number.isInteger(converted)) {
    return `$${converted.toLocaleString('en-US')}`;
  }
  return `$${converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Dynamically converts any price/remuneration string containing £, $, €, or ₦ amounts
 * into the active AppCurrency (₦ NGN or $ USD), while preserving non-numeric strings like "Free".
 */
export function formatPriceString(rawText: string | undefined | null, currency: AppCurrency): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();
  if (!trimmed) return '';

  return trimmed.replace(/([£$€₦])\s*([\d,]+(?:\.\d+)?)/g, (_match, symbol: string, numStr: string) => {
    const numericVal = parseFloat(numStr.replace(/,/g, ''));
    if (!Number.isFinite(numericVal)) return _match;
    return formatAmountInCurrency(numericVal, symbol, currency);
  });
}

export function getCurrencySymbol(currency: AppCurrency): '₦' | '$' {
  return currency === 'USD' ? '$' : '₦';
}
