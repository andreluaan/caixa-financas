-- New Supabase projects may not expose public tables to the Data API by default.
-- Signed-in users get table access here; Row Level Security still limits every
-- row to its owner, and anonymous visitors get nothing.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.accounts,
  public.categories,
  public.transactions,
  public.budgets,
  public.goals,
  public.bills
to authenticated;

revoke all on
  public.accounts,
  public.categories,
  public.transactions,
  public.budgets,
  public.goals,
  public.bills
from anon;
