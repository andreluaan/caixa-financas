# Caixa — finanças pessoais

Organizador de finanças pessoais com a identidade **andreluaan.dev** (sumi + shu, vidro fosco, Geist).
App web instalável (PWA) que roda no PC e no celular, com dados no **Supabase** (plano gratuito).

## O que faz

- **Resumo**: quanto você tem hoje, o que entrou e saiu no mês, a sobra prevista e gráficos (entradas × saídas em 6 meses e para onde foi o dinheiro).
- **Lançamentos**: entradas e saídas com categoria, conta e data; a categoria é sugerida pelas palavras-chave. Toque num lançamento para editar ou excluir.
- **Compras parceladas**: informe o total e o número de parcelas; cada parcela cai no mês certo (e na fatura certa do cartão).
- **Contas a pagar e a receber**: mensais (aluguel, salário) ou de uma vez só (IPVA, um freela), com botão "Paguei"/"Recebi" que lança no extrato.
- **Importar extrato**: OFX (qualquer banco) e CSV (Nubank conta, Nubank cartão e CSVs com colunas Data/Descrição/Valor).
  O arquivo é lido no navegador; você confere e escolhe o que entra. Reimportar o mesmo extrato não duplica.
- **Orçamentos** mensais por categoria, com aviso em shu quando passa do limite.
- **Metas** de economia com guardar/retirar.
- **Carteira**: saldo por conta, fatura do cartão pelo ciclo de fechamento e parcelamentos em aberto.

## Rodar sem Supabase (modo demonstração)

```bash
npm install
npm run demo
```

Abre com dados de exemplo em memória. Nada é salvo; recarregar a página volta ao início.

## Configurar o Supabase (uma vez)

1. Crie uma conta em <https://supabase.com> e um projeto novo (plano Free). Região sugerida: São Paulo (`sa-east-1`).
2. No projeto, abra **SQL Editor → New query**, cole todo o conteúdo de `supabase/migrations/0001_init.sql` e clique **Run**.
   Isso cria as tabelas, liga o RLS (cada usuário só vê os próprios dados) e cria as categorias iniciais para cada conta nova.
   Depois rode também, na ordem, `0002_recorrentes_e_parcelas.sql` (contas a receber, contas únicas e parcelas)
   e `0003_permissoes_api.sql` (libera as tabelas para usuários logados; projetos novos do Supabase não fazem isso sozinhos).
   Se o editor avisar que as tabelas estão sem RLS, escolha **Run and enable RLS**.
3. Em **Project Settings → API Keys**, copie a *Project URL* e a *publishable key* (`sb_publishable_…`; em projetos antigos, a chave *anon public*).
   Em **Authentication → URL Configuration**, troque o *Site URL* para `http://localhost:5173` (é para onde o e-mail de confirmação leva).
4. Copie `.env.example` para `.env` e preencha:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. Rode `npm run dev`, abra o endereço que aparecer e crie sua conta na tela de login.
   Se o Supabase pedir confirmação por e-mail, clique no link e depois entre.
6. Depois de criar a sua conta, você pode desligar novos cadastros em
   **Authentication → Sign In / Providers → Allow new users to sign up** (recomendado: o app é só seu).

A chave *anon* é pública por natureza: quem protege os dados é o RLS criado no passo 2.
Nunca coloque a chave *service_role* no `.env` deste app.

## Publicar online (para usar no celular)

Qualquer hospedagem de site estático serve. Exemplo com a Vercel (grátis):

1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel, **Add New → Project**, escolha o repositório. Framework: Vite.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Depois do deploy, no Supabase em **Authentication → URL Configuration**, coloque o endereço da Vercel em *Site URL*.
5. No celular, abra o endereço e use **Adicionar à tela inicial** para instalar como app.

## Plano grátis do Supabase: o que saber

- Projeto inativo por uma semana é pausado. Os dados ficam; é só reativar no painel.
- Sem backup automático no plano grátis. *(Próximo passo sugerido: botão de exportar backup.)*

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (precisa do `.env`) |
| `npm run demo` | Modo demonstração, sem Supabase |
| `npm run build` | Checa os tipos e gera `dist/` |
| `npm run preview` | Serve o `dist/` localmente |

## Estrutura

```
supabase/migrations/0001_init.sql   esquema, RLS e categorias iniciais
supabase/migrations/0002_*.sql      contas a pagar/receber, únicas e parcelas
supabase/migrations/0003_*.sql      acesso da API às tabelas para usuários logados
src/lib/store.tsx                   dados (Supabase ou demo) e ações
src/lib/calc.ts                     totais, orçamentos, fatura, contas a pagar
src/lib/import.ts                   leitura de OFX/CSV e sugestão de categoria
src/pages/                          telas
src/styles.css                      tokens e componentes do visual sumi
```
