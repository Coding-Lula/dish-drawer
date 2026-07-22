## Como o saldo dos devedores é calculado hoje

O ecrã "Devedores" (`src/pages/Debtors.tsx`) combina duas tabelas separadas:

- `credits` — cada linha representa uma **fatura por pagar** (uma venda a crédito). Só entram no cálculo as linhas com `status = 'unsettled'`. Campo principal: `sale_amount`.
- `debtor_payments` — cada linha representa um **pagamento recebido** (ou crédito manual em favor do cliente). Campo principal: `amount`.

As linhas são agrupadas por `customer_name` (normalizado em minúsculas). Para cada cliente:

```text
total_owed  = soma(credits.sale_amount)          -- só unsettled
total_paid  = soma(debtor_payments.amount)
balance     = total_paid - total_owed
```

Interpretação:

- `balance < 0` → cliente **deve** dinheiro (mostrado a vermelho como "Saldo em Dívida").
- `balance > 0` → cliente tem **crédito a favor** (mostrado a verde como "Saldo a Favor").
- `balance = 0` → quitado; o cliente é ocultado se não houver faturas nem pagamentos.

## Refactor para uma única tabela — recomendação

Sim, dá para unificar em **um único livro-razão** (ex.: `debtor_ledger`) com colunas tipo:

```text
id | store_id | customer_id/name | date | kind ('sale' | 'payment' | 'adjustment') | amount (signed) | transaction_id | note
```

Vantagens: um único `SUM(amount)` dá o saldo, elimina a divergência entre `credits.status` e `debtor_payments`, simplifica o histórico. Desvantagens: `credits` está ligada ao POS (deduz stock, gera `transaction_id`, tem `status`/`settled_at`) e a várias outras páginas (Finanças, relatórios), portanto a migração toca em bastantes sítios.

**Recomendação:** não fazer o refactor agora, só para inserir 4 clientes. Fica registado como melhoria futura; se quiser, abro um plano separado dedicado ao refactor.

## Inserir os 4 devedores via SQL (loja: Cantina C.Horizonte)

Store id: `85cb8967-fcad-49f5-b0bb-dc84bf0448d9`.

Convenção do utilizador:
- "negativo 500" = deve 500 → inserir em `credits` (`sale_amount = 500`, `status = 'unsettled'`).
- "positivo X" = crédito a favor do cliente → inserir em `debtor_payments` (`amount = X`), sem fatura correspondente, para que `balance = +X`.

Registos a criar:

| Cliente | Sinal | Valor | Tabela |
|---|---|---|---|
| Abdul Cadri e Noor | − | 500 | `credits` (unsettled) |
| Familia | − | 500 | `credits` (unsettled) |
| Elizabeth | + | 4 256 | `debtor_payments` |
| Aallyah e Ayyan | + | 970 | `debtor_payments` |

SQL a executar (via ferramenta de inserção de dados, com aprovação):

```sql
INSERT INTO public.credits (store_id, customer_name, sale_amount, status, date)
VALUES
  ('85cb8967-fcad-49f5-b0bb-dc84bf0448d9', 'Abdul Cadri e Noor', 500, 'unsettled', now()),
  ('85cb8967-fcad-49f5-b0bb-dc84bf0448d9', 'Familia',            500, 'unsettled', now());

INSERT INTO public.debtor_payments (store_id, customer_name, amount, note, date)
VALUES
  ('85cb8967-fcad-49f5-b0bb-dc84bf0448d9', 'Elizabeth',         4256, 'Saldo inicial a favor', now()),
  ('85cb8967-fcad-49f5-b0bb-dc84bf0448d9', 'Aallyah e Ayyan',    970, 'Saldo inicial a favor', now());
```

Efeito no ecrã Devedores após inserir:
- Abdul Cadri e Noor → −500 MT (dívida)
- Familia → −500 MT (dívida)
- Elizabeth → +4 256 MT (a favor, verde)
- Aallyah e Ayyan → +970 MT (a favor, verde)

Não há alterações de código nem de esquema neste plano — apenas inserção de dados.