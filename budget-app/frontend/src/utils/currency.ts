export function formatCurrency(amount: number, currency: string = 'USD'): string {
    const locale = currency === 'SEK' ? 'sv-SE' : 'en-US';
    if (Number.isInteger(amount)) {
        return amount.toLocaleString(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    }
    return amount.toLocaleString(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
} 