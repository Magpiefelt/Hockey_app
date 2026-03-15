-- Add admin-managed public event highlights for marketing on homepage/calendar
CREATE TABLE IF NOT EXISTS public_event_highlights (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER REFERENCES quote_requests(id) ON DELETE SET NULL,
  title VARCHAR(140) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Live Event',
  event_date DATE NOT NULL,
  location VARCHAR(140),
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_event_highlights_event_date
  ON public_event_highlights(event_date);

CREATE INDEX IF NOT EXISTS idx_public_event_highlights_visibility
  ON public_event_highlights(is_visible);

CREATE INDEX IF NOT EXISTS idx_public_event_highlights_display_order
  ON public_event_highlights(display_order);

CREATE INDEX IF NOT EXISTS idx_public_event_highlights_quote_id
  ON public_event_highlights(quote_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_public_event_highlights_quote_unique
  ON public_event_highlights(quote_id)
  WHERE quote_id IS NOT NULL;
