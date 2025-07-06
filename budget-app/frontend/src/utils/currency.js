// Currency formatter
export const currencySymbols = {
  USD: '$',
  EUR: '€',
  SEK: 'Kr',
};

export function formatCurrency(amount, currency = 'USD') {
  const locale = currency === 'SEK' ? 'sv-SE' : 'en-US';
  if (Number.isInteger(amount)) {
    return `${amount.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currencySymbols[currency]}`;
  }
  return `${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbols[currency]}`;
} 