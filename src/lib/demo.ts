import { addMonths, splitInstallments } from './calc';
import { currentMonth, lastMonths } from './format';
import type { Account, Bill, Budget, Category, Goal, Transaction } from './types';

export const isDemo = import.meta.env.VITE_DEMO === '1';

let counter = 0;
export const newId = () => `demo-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export function demoData() {
  const cat = (name: string, kind: 'in' | 'out', keywords: string[] = []): Category => ({ id: `c-${name}`, name, kind, keywords });
  const categories = [
    cat('Renda', 'in', ['salario', 'freela']),
    cat('Moradia', 'out', ['aluguel']),
    cat('Mercado', 'out', ['mercado', 'supermercado']),
    cat('Transporte', 'out', ['uber', 'posto']),
    cat('Lazer', 'out', ['cinema']),
    cat('Saúde', 'out', ['farmacia']),
    cat('Outros', 'out'),
  ];
  const accounts: Account[] = [
    { id: 'a-bank', name: 'Conta corrente', kind: 'checking', opening_balance: 1500, credit_limit: null, closing_day: null, due_day: null },
    { id: 'a-card', name: 'Cartão Nubank', kind: 'credit', opening_balance: 0, credit_limit: 3000, closing_day: 3, due_day: 10 },
  ];
  const m = currentMonth();
  const tx = (d: string, description: string, category: string, amount: number, kind: 'in' | 'out', account = 'a-bank'): Transaction => ({
    id: newId(),
    description,
    amount,
    kind,
    occurred_on: `${m}-${d}`,
    category_id: `c-${category}`,
    account_id: account,
    import_key: null,
  });
  const history = lastMonths(6).slice(0, 5).map((month, i) => ({
    id: newId(),
    description: 'Gastos do mês',
    amount: [3120, 2780, 3410, 2950, 3260][i],
    kind: 'out' as const,
    occurred_on: `${month}-15`,
    category_id: 'c-Outros',
    account_id: 'a-bank',
    import_key: null,
  }));
  const pastIncome = lastMonths(6).slice(0, 5).map((month) => ({
    id: newId(),
    description: 'Salário',
    amount: 6800,
    kind: 'in' as const,
    occurred_on: `${month}-05`,
    category_id: 'c-Renda',
    account_id: 'a-bank',
    import_key: null,
  }));
  const transactions: Transaction[] = [
    ...pastIncome,
    tx('24', 'Farmácia', 'Saúde', 86.4, 'out', 'a-card'),
    tx('22', 'Jantar fora', 'Lazer', 148.9, 'out', 'a-card'),
    tx('20', 'Combustível', 'Transporte', 230, 'out', 'a-card'),
    tx('18', 'Freela — landing page', 'Renda', 1200, 'in'),
    tx('12', 'Supermercado', 'Mercado', 412.37, 'out'),
    tx('06', 'Aluguel', 'Moradia', 1850, 'out'),
    tx('05', 'Salário', 'Renda', 6800, 'in'),
    ...history,
  ];
  const budgets: Budget[] = [
    { id: newId(), category_id: 'c-Mercado', monthly_limit: 900 },
    { id: newId(), category_id: 'c-Transporte', monthly_limit: 400 },
    { id: newId(), category_id: 'c-Lazer', monthly_limit: 120 },
    { id: newId(), category_id: 'c-Saúde', monthly_limit: 250 },
  ];
  const goals: Goal[] = [
    { id: newId(), name: 'Reserva de emergência', target: 12000, saved: 7400, deadline: null },
    { id: newId(), name: 'Viagem de férias', target: 5000, saved: 2100, deadline: '2027-07-01' },
  ];
  const bill = (b: Partial<Bill> & Pick<Bill, 'name' | 'amount'>): Bill => ({
    id: newId(),
    kind: 'out',
    recurrence: 'monthly',
    due_day: null,
    due_date: null,
    category_id: null,
    account_id: 'a-bank',
    last_paid_month: null,
    active: true,
    ...b,
  });
  const bills: Bill[] = [
    bill({ name: 'Salário', amount: 6800, kind: 'in', due_day: 5, category_id: 'c-Renda', last_paid_month: `${m}-01` }),
    bill({ name: 'Internet', amount: 119.9, due_day: 27 }),
    bill({ name: 'Energia', amount: 214.35, due_day: 28 }),
    bill({ name: 'Academia', amount: 99, due_day: 10, category_id: 'c-Saúde', account_id: 'a-card', last_paid_month: `${m}-01` }),
    bill({ name: 'IPVA', amount: 1240, recurrence: 'once', due_date: addMonths(`${m}-15`, 1), category_id: 'c-Transporte' }),
    bill({ name: 'Freela do site', amount: 1500, kind: 'in', recurrence: 'once', due_date: `${m}-30`, category_id: 'c-Renda' }),
  ];
  const start = addMonths(`${m}-08`, -3);
  const parcels = splitInstallments(3600, 10).map((amount, i) => ({
    id: newId(),
    description: `Notebook (${i + 1}/10)`,
    amount,
    kind: 'out' as const,
    occurred_on: addMonths(start, i),
    category_id: 'c-Outros',
    account_id: 'a-card',
    import_key: null,
    installment_group: 'g-notebook',
    installment_no: i + 1,
    installments: 10,
  }));
  transactions.push(...parcels);
  transactions.sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));
  return { accounts, categories, transactions, budgets, goals, bills };
}
