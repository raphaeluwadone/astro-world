export const digitsOnly = (s: string) => s.replace(/\D/g, '')

/** "150000" → "150,000", for showing naira amounts while they're typed. */
export const withCommas = (digits: string) => (digits ? Number(digits).toLocaleString('en-NG', { maximumFractionDigits: 0 }) : '')
