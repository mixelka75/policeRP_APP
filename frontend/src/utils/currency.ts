// Курсы валют для PoliceRP
export const EXCHANGE_RATES = {
  AR_TO_BT: 3, // 1 АР = 3 БТ
} as const;

/**
 * Конвертирует АР в БТ по текущему курсу
 */
export function convertArToBt(arAmount: number): number {
  return arAmount * EXCHANGE_RATES.AR_TO_BT;
}

/**
 * Конвертирует БТ в АР по текущему курсу
 */
export function convertBtToAr(btAmount: number): number {
  return Math.floor(btAmount / EXCHANGE_RATES.AR_TO_BT);
}

/**
 * Форматирует сумму в БТ для отображения
 */
export function formatBt(amount: number): string {
  return `${amount} БТ`;
}

/**
 * Проверяет, достаточно ли БТ для оплаты суммы в АР
 */
export function canPayWithBt(btBalance: number, arAmount: number): boolean {
  return btBalance >= convertArToBt(arAmount);
}