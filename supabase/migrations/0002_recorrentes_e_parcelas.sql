-- Bills become "scheduled entries": money to pay or to receive, monthly or once.
alter table public.bills
  add column kind text not null default 'out' check (kind in ('in', 'out')),
  add column recurrence text not null default 'monthly' check (recurrence in ('monthly', 'once')),
  add column due_date date,
  alter column due_day drop not null;

alter table public.bills
  add constraint bills_schedule check (
    (recurrence = 'monthly' and due_day is not null) or (recurrence = 'once' and due_date is not null)
  );

-- Installment purchases: every installment is its own transaction, tied by a group id.
alter table public.transactions
  add column installment_group uuid,
  add column installment_no smallint check (installment_no > 0),
  add column installments smallint check (installments between 2 and 48);

create index transactions_installment_group_idx
  on public.transactions (user_id, installment_group)
  where installment_group is not null;
