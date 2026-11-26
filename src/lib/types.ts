export type Kind = 'in' | 'out';
export type AccountKind = 'checking' | 'savings' | 'cash' | 'credit';

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  opening_balance: number;
  credit_limit: number | null;
  closing_day: number | null;
  due_day: number | null;
}

export interface Category {
  id: string;
  name: string;
  kind: Kind;
  keywords: string[];
}

export interface Transaction {
  id: string;
  account_id: string | null;
  category_id: string | null;
  description: string;
  amount: number;
  kind: Kind;
  occurred_on: string;
  import_key: string | null;
  installment_group?: string | null;
  installment_no?: number | null;
  installments?: number | null;
}

export interface Budget {
  id: string;
  category_id: string;
  monthly_limit: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string | null;
}

export type Recurrence = 'monthly' | 'once';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  kind: Kind;
  recurrence: Recurrence;
  due_day: number | null;
  due_date: string | null;
  category_id: string | null;
  account_id: string | null;
  last_paid_month: string | null;
  active: boolean;
}

export type NewTransaction = Omit<Transaction, 'id' | 'import_key'> & { import_key?: string | null };
