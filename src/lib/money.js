import Decimal from "decimal.js";
import { isAfter, parseISO, startOfDay } from "date-fns";

export function money(value = 0) {
  return new Decimal(value || 0);
}

export function calculateTax(amountHt, taxRate) {
  return money(amountHt).mul(money(taxRate)).div(100);
}

export function calculateTtc(amountHt, taxRate) {
  return money(amountHt).add(calculateTax(amountHt, taxRate));
}

export function calculateBalance(total, payments = []) {
  return payments.reduce((balance, payment) => balance.sub(money(payment.montant)), money(total));
}

export function getInvoiceStatus({ total, payments = [], dueDate, today = new Date() }) {
  const remaining = calculateBalance(total, payments);
  if (remaining.lte(0)) return "PAYEE";
  if (payments.length > 0 && remaining.lt(money(total))) return "PARTIELLEMENT_PAYEE";
  if (dueDate && isAfter(startOfDay(today), startOfDay(parseISO(dueDate)))) return "EN_RETARD";
  return "EMISE";
}

export function formatXaf(value) {
  return `${money(value).toNumber().toLocaleString("fr-FR")} XAF`;
}
