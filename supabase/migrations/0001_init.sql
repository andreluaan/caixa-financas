-- Caixa: personal finance schema.
-- Every table is owned by a user and protected by row level security.

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  kind text not null check (kind in ('checking', 'savings', 'cash', 'credit')),
  opening_balance numeric(12, 2) not null default 0,
  credit_limit numeric(12, 2) check (credit_limit is null or credit_limit >= 0),
  closing_day smallint check (closing_day between 1 and 31),
  due_day smallint check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  kind text not null check (kind in ('in', 'out')),
  keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, name, kind)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  description text not null check (length(description) between 1 and 140),
  amount numeric(12, 2) not null check (amount > 0),
  kind text not null check (kind in ('in', 'out')),
  occurred_on date not null default current_date,
  import_key text,
  created_at timestamptz not null default now(),
  unique (user_id, import_key)
);

create index transactions_user_date on public.transactions (user_id, occurred_on desc);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  monthly_limit numeric(12, 2) not null check (monthly_limit > 0),
  unique (user_id, category_id)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  target numeric(12, 2) not null check (target > 0),
  saved numeric(12, 2) not null default 0 check (saved >= 0),
  deadline date,
  created_at timestamptz not null default now()
);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  amount numeric(12, 2) not null check (amount > 0),
  due_day smallint not null check (due_day between 1 and 31),
  category_id uuid references public.categories (id) on delete set null,
  account_id uuid references public.accounts (id) on delete set null,
  last_paid_month date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['accounts', 'categories', 'transactions', 'budgets', 'goals', 'bills'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Starter categories and a checking account for every new user.
create function public.seed_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.categories (user_id, name, kind, keywords) values
    (new.id, 'Renda', 'in', array['salario', 'salário', 'pix recebido', 'transferencia recebida', 'freela', 'rendimento']),
    (new.id, 'Moradia', 'out', array['aluguel', 'condominio', 'condomínio', 'iptu']),
    (new.id, 'Mercado', 'out', array['mercado', 'supermercado', 'atacadao', 'assai', 'carrefour', 'pao de acucar', 'hortifruti']),
    (new.id, 'Transporte', 'out', array['uber', '99app', '99 pop', 'posto', 'combustivel', 'combustível', 'gasolina', 'shell', 'ipiranga', 'estacionamento']),
    (new.id, 'Alimentação', 'out', array['ifood', 'restaurante', 'lanchonete', 'padaria', 'rappi']),
    (new.id, 'Lazer', 'out', array['cinema', 'show', 'steam', 'ingresso']),
    (new.id, 'Saúde', 'out', array['farmacia', 'farmácia', 'drogasil', 'raia', 'consulta', 'academia']),
    (new.id, 'Assinaturas', 'out', array['netflix', 'spotify', 'prime', 'youtube', 'disney', 'internet', 'claro', 'vivo']),
    (new.id, 'Contas da casa', 'out', array['energia', 'conta de luz', 'conta de agua', 'conta de água', 'enel', 'sabesp', 'comgas', 'comgás']),
    (new.id, 'Outros', 'out', array[]::text[]);
  insert into public.accounts (user_id, name, kind) values (new.id, 'Conta corrente', 'checking');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_new_user();
