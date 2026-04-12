/**
 * Calculates the deposit amount (15%) for a given service quote.
 * Rounds to the nearest cent.
 */
export function calculateDeposit(amount: number): number {
  return Math.round(amount * 0.15 * 100) / 100;
}
