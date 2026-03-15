-- Rollback: 017 - Add finance expenses and budgets

DROP TRIGGER IF EXISTS update_finance_budgets_updated_at ON finance_budgets;
DROP TABLE IF EXISTS finance_budgets;

DROP TRIGGER IF EXISTS update_finance_expenses_updated_at ON finance_expenses;
DROP TABLE IF EXISTS finance_expenses;
