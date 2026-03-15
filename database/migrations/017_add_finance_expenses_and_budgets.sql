-- Migration: 017 - Add finance expenses and budgets
-- Introduces real expense tracking and monthly budget targets for finance analytics.

CREATE TABLE IF NOT EXISTS finance_expenses (
  id SERIAL PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  incurred_on DATE NOT NULL,
  vendor VARCHAR(120),
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_expenses_incurred_on ON finance_expenses(incurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_category ON finance_expenses(category);

DROP TRIGGER IF EXISTS update_finance_expenses_updated_at ON finance_expenses;
CREATE TRIGGER update_finance_expenses_updated_at
  BEFORE UPDATE ON finance_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS finance_budgets (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  category VARCHAR(50) NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (year, month, category)
);

CREATE INDEX IF NOT EXISTS idx_finance_budgets_month_year ON finance_budgets(year, month);
CREATE INDEX IF NOT EXISTS idx_finance_budgets_category ON finance_budgets(category);

DROP TRIGGER IF EXISTS update_finance_budgets_updated_at ON finance_budgets;
CREATE TRIGGER update_finance_budgets_updated_at
  BEFORE UPDATE ON finance_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
