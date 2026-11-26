import { currentMonth, lastMonths, monthKey, toISODate } from './format';
import type { Account, Bill, Budget, Category, Transaction } from './types';

export function monthTotals(transactions: Transaction[], month = currentMonth()) {
  let income = 0;
  let expense = 0;
  let inCount = 0;
  let outCount = 0;
  for (const t of transactions) {
    if (monthKey(t.occurred_on) !== month) continue;
    if (t.kind === 'in') {
      income += t.amount;
      inCount++;
    } else {
      expense += t.amount;
      outCount++;
    }
  }
  return { income, expense, balance: income - expense, inCount, outCount };
}

export function spendingByMonth(transactions: Transaction[], count = 6) {
  const months = lastMonths(count);
  const totals = new Map(months.map((m) => [m, 0]));
  for (const t of transactions) {
    const key = monthKey(t.occurred_on);
    if (t.kind === 'out' && totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + t.amount);
  }
  return months.map((month) => ({ month, total: totals.get(month) ?? 0 }));
}

export function budgetUsage(budgets: Budget[], categories: Category[], transactions: Transaction[], month = currentMonth()) {
  return budgets
    .map((b) => {
      const category = categories.find((c) => c.id === b.category_id);
      const used = transactions
        .filter((t) => t.kind === 'out' && t.category_id === b.category_id && monthKey(t.occurred_on) === month)
        .reduce((sum, t) => sum + t.amount, 0);
      const pct = (used / b.monthly_limit) * 100;
      return { budget: b, name: category?.name ?? 'Sem categoria', used, pct, over: used > b.monthly_limit };
    })
    .sort((a, b) => b.pct - a.pct);
}

function clampDay(year: number, monthIndex: number, day: number) {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, last));
}

// The open invoice runs from the day after the previous closing up to the next closing day.
export function invoiceWindow(account: Account, ref = new Date()) {
  const closing = account.closing_day ?? 1;
  const due = account.due_day ?? closing;
  let close = clampDay(ref.getFullYear(), ref.getMonth(), closing);
  if (ref > close) close = clampDay(ref.getFullYear(), ref.getMonth() + 1, closing);
  const prevClose = clampDay(close.getFullYear(), close.getMonth() - 1, closing);
  const start = new Date(prevClose);
  start.setDate(start.getDate() + 1);
  const dueDate = clampDay(close.getFullYear(), close.getMonth() + (due <= closing ? 1 : 0), due);
  return { start: toISODate(start), end: toISODate(close), due: toISODate(dueDate) };
}

export function invoiceTotal(account: Account, transactions: Transaction[], ref = new Date()) {
  const w = invoiceWindow(account, ref);
  const total = transactions
    .filter((t) => t.account_id === account.id && t.occurred_on >= w.start && t.occurred_on <= w.end)
    .reduce((sum, t) => sum + (t.kind === 'out' ? t.amount : -t.amount), 0);
  return { ...w, total: Math.max(0, total) };
}

export function accountBalance(account: Account, transactions: Transaction[]) {
  return transactions
    .filter((t) => t.account_id === account.id)
    .reduce((sum, t) => sum + (t.kind === 'in' ? t.amount : -t.amount), account.opening_balance ?? 0);
}

export function billStatus(bill: Bill, ref = new Date()) {
  const month = toISODate(ref).slice(0, 7);
  const paid = bill.last_paid_month?.slice(0, 7) === month;
  const dueDate = clampDay(ref.getFullYear(), ref.getMonth(), bill.due_day);
  const next = paid ? clampDay(ref.getFullYear(), ref.getMonth() + 1, bill.due_day) : dueDate;
  const msPerDay = 86_400_000;
  const startOfToday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const daysLeft = Math.round((next.getTime() - startOfToday.getTime()) / msPerDay);
  return { paid, next: toISODate(next), daysLeft, overdue: !paid && daysLeft < 0 };
}
