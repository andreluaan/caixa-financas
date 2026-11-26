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

export function accountBalance(account: Account, transactions: Transaction[], ref = new Date()) {
  const today = toISODate(ref);
  return transactions
    .filter((t) => t.account_id === account.id && t.occurred_on <= today)
    .reduce((sum, t) => sum + (t.kind === 'in' ? t.amount : -t.amount), account.opening_balance ?? 0);
}

const MS_PER_DAY = 86_400_000;

export function billStatus(bill: Bill, ref = new Date()) {
  const month = toISODate(ref).slice(0, 7);
  const startOfToday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  let paid: boolean;
  let next: Date;
  if (bill.recurrence === 'once') {
    const [y, m, d] = (bill.due_date ?? toISODate(ref)).split('-').map(Number);
    next = new Date(y, m - 1, d);
    paid = !!bill.last_paid_month;
  } else {
    const day = bill.due_day ?? 1;
    paid = bill.last_paid_month?.slice(0, 7) === month;
    next = paid ? clampDay(ref.getFullYear(), ref.getMonth() + 1, day) : clampDay(ref.getFullYear(), ref.getMonth(), day);
  }
  const daysLeft = Math.round((next.getTime() - startOfToday.getTime()) / MS_PER_DAY);
  return { paid, next: toISODate(next), daysLeft, overdue: !paid && daysLeft < 0 };
}

/** Unpaid scheduled entries due up to the end of the current month (overdue ones included). */
export function pendingThisMonth(bills: Bill[], ref = new Date()) {
  const month = toISODate(ref).slice(0, 7);
  let toPay = 0;
  let toReceive = 0;
  for (const b of bills) {
    if (!b.active) continue;
    const st = billStatus(b, ref);
    if (st.paid || st.next.slice(0, 7) > month) continue;
    if (b.kind === 'in') toReceive += b.amount;
    else toPay += b.amount;
  }
  return { toPay, toReceive };
}

/** Money available today: every non-credit account balance added up. */
export function totalBalance(accounts: Account[], transactions: Transaction[]) {
  return accounts.filter((a) => a.kind !== 'credit').reduce((sum, a) => sum + accountBalance(a, transactions), 0);
}

export function monthFlow(transactions: Transaction[], count = 6) {
  const months = lastMonths(count);
  const rows = new Map(months.map((m) => [m, { month: m, income: 0, expense: 0 }]));
  for (const t of transactions) {
    const row = rows.get(monthKey(t.occurred_on));
    if (!row) continue;
    if (t.kind === 'in') row.income += t.amount;
    else row.expense += t.amount;
  }
  return months.map((m) => rows.get(m)!);
}

export function spendingByCategory(transactions: Transaction[], categories: Category[], month = currentMonth(), top = 5) {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind !== 'out' || monthKey(t.occurred_on) !== month) continue;
    const key = t.category_id ?? '';
    totals.set(key, (totals.get(key) ?? 0) + t.amount);
  }
  const rows = [...totals.entries()]
    .map(([id, total]) => ({ id, name: categories.find((c) => c.id === id)?.name ?? 'Sem categoria', total }))
    .sort((a, b) => b.total - a.total);
  if (rows.length <= top) return rows;
  const rest = rows.slice(top - 1).reduce((sum, r) => sum + r.total, 0);
  return [...rows.slice(0, top - 1), { id: 'rest', name: 'Demais', total: rest }];
}

export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(clampDay(y, m - 1 + months, d));
}

/** Splits a total into n installments in cents; the first one absorbs the rounding. */
export function splitInstallments(total: number, n: number) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  return Array.from({ length: n }, (_, i) => (i === 0 ? cents - base * (n - 1) : base) / 100);
}

export function installmentPlans(transactions: Transaction[], ref = new Date()) {
  const today = toISODate(ref);
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (!t.installment_group) continue;
    groups.set(t.installment_group, [...(groups.get(t.installment_group) ?? []), t]);
  }
  return [...groups.entries()]
    .map(([group, items]) => {
      const sorted = [...items].sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
      const future = sorted.filter((t) => t.occurred_on > today);
      return {
        group,
        name: sorted[0].description.replace(/\s*\(\d+\/\d+\)$/, ''),
        accountId: sorted[0].account_id,
        installments: sorted[0].installments ?? sorted.length,
        total: sorted.reduce((sum, t) => sum + t.amount, 0),
        each: sorted[sorted.length - 1].amount,
        remaining: future.length,
        remainingAmount: future.reduce((sum, t) => sum + t.amount, 0),
        next: future[0]?.occurred_on ?? null,
        futureIds: future.map((t) => t.id),
      };
    })
    .filter((p) => p.remaining > 0)
    .sort((a, b) => (a.next ?? '').localeCompare(b.next ?? ''));
}
