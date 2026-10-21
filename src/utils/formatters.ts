/**
 * Formatters utility functions for Trust Wallet Pro
 */

export function formatCurrency(amount: number | undefined | null, currency: string = 'USD'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCryptoAmount(
  amount: number | undefined | null,
  maxDecimalsOrSymbol: number | string = 6
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0';
  }
  const symbol = typeof maxDecimalsOrSymbol === 'string' ? maxDecimalsOrSymbol : undefined;
  const maxDecimals = typeof maxDecimalsOrSymbol === 'number' ? maxDecimalsOrSymbol : 6;

  let formatted: string;
  if (amount === 0) {
    formatted = '0';
  } else if (Math.abs(amount) < 0.000001) {
    formatted = amount.toFixed(8);
  } else {
    formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: maxDecimals,
    }).format(amount);
  }

  return symbol ? `${formatted} ${symbol}` : formatted;
}

export function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatDateTime(dateInput: string | number | Date | undefined | null, isArabic: boolean = false): string {
  if (!dateInput) return '';
  
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat(isArabic ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

export function shortenAddress(address: string | undefined | null, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}
