-- Elite Sports DJ Database Schema
-- PostgreSQL 14+

-- Enable UUID extension for potential future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (customers and admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Packages table (service offerings)
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  features JSONB,
  icon VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);

-- Quote requests table (orders/service requests)
CREATE TABLE IF NOT EXISTS quote_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
  contact_name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(120) NOT NULL,
  contact_phone VARCHAR(30),
  organization VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'in_progress', 'quoted', 'invoiced', 'paid', 'completed', 'cancelled', 'delivered')),
  event_date DATE,
  service_type VARCHAR(50),
  sport_type VARCHAR(50),
  notes TEXT,
  admin_notes TEXT,
  quoted_amount INTEGER,
  total_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON quote_requests(contact_email);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);

-- Form submissions table (detailed form data for each quote)
CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  team_name VARCHAR(100),
  roster_method VARCHAR(20),
  roster_players JSONB,
  roster_file_id INTEGER,
  intro_song JSONB,
  warmup_songs JSONB,
  goal_horn JSONB,
  goal_song JSONB,
  win_song JSONB,
  sponsors JSONB,
  include_sample BOOLEAN DEFAULT FALSE,
  audio_files JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_quote_id ON form_submissions(quote_id);

-- Invoices table (Stripe invoice tracking)
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(100) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(100),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  invoice_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'failed', 'void', 'uncollectible')),
  customer_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Payments table (payment transaction records)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  stripe_payment_id VARCHAR(100) UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  status VARCHAR(20) NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded', 'cancelled')),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_id ON payments(stripe_payment_id);

-- File uploads table (rosters, audio files, deliverables)
CREATE TABLE IF NOT EXISTS file_uploads (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  field_name VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  mime_type VARCHAR(100),
  file_size INTEGER,
  kind VARCHAR(20) DEFAULT 'upload' CHECK (kind IN ('upload', 'deliverable')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_quote_id ON file_uploads(quote_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_kind ON file_uploads(kind);

-- Order status history table (audit trail)
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_quote_id ON order_status_history(quote_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_status_history(changed_at DESC);

-- Email logs table (track sent emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER REFERENCES quote_requests(id) ON DELETE SET NULL,
  recipient_email VARCHAR(120) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_quote_id ON email_logs(quote_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt, salt rounds: 10
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@elitesportsdj.com', '$2b$10$YUbqwoyZ2hWYkBru0IKaKukR7WtcXurnaNvouEH/9GgnWgwf/LR1a', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Audit logs table for tracking important events
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_id INTEGER,
  target_type VARCHAR(50),
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- Seed packages from content/packages.json
-- Note: This will be done via a separate seed script that reads the JSON file
