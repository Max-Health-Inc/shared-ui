export function formatPlanPrice(cents: number, currency = "USD", locale?: string): string {
  const whole = cents % 100 === 0
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100)
}
