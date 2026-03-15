/**
 * Public Home Page Data Endpoint
 *
 * PERF/SEO: This endpoint is called server-side via useAsyncData on the home page,
 * enabling the packages, FAQ, and testimonials sections to be SSR-rendered.
 * SSR-rendered content is visible to search engine crawlers and AI search tools,
 * whereas data fetched in onMounted() is invisible to them.
 *
 * The tRPC plugin is client-only (.client.ts), so we call the DB directly here.
 */
import { query } from '../db/connection'
import { logger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  // Cache for 5 minutes on CDN/edge, 10 minutes stale-while-revalidate.
  // This prevents a DB hit on every SSR page render for the home page.
  setHeader(event, 'Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

  const result = {
    packages: [] as any[],
    faq: [] as any[],
    testimonials: [] as any[],
    eventHighlights: [] as any[],
    eventSummary: {
      upcomingCount: 0,
      recentCount: 0,
      thisMonthCount: 0
    }
  }

  // --- Packages ---
  try {
    const pkgResult = await query(
      `SELECT id, slug, name, description, price_cents, currency, is_popular, features, icon,
              display_order, badge_text, is_visible, price_suffix
       FROM packages
       WHERE is_visible = true
       ORDER BY display_order ASC, name ASC`
    )
    result.packages = pkgResult.rows.map((row: any) => ({
      id: row.slug,
      slug: row.slug,
      name: row.name,
      description: row.description,
      price: row.price_cents / 100,
      price_cents: row.price_cents,
      currency: row.currency,
      popular: row.is_popular,
      features: row.features || [],
      icon: row.icon,
      displayOrder: row.display_order ?? 0,
      badgeText: row.badge_text || null,
      isVisible: row.is_visible ?? true,
      priceSuffix: row.price_suffix || '/game'
    }))
  } catch (err) {
    // Non-fatal: page will use client-side fetch as fallback
    logger.warn('home-data: failed to fetch packages', err as Error)
  }

  // --- FAQ ---
  try {
    const faqResult = await query(
      `SELECT question, answer
       FROM faq_items
       WHERE is_active = true
       ORDER BY display_order ASC, id ASC`
    )
    result.faq = faqResult.rows.map((row: any) => ({
      question: row.question,
      answer: row.answer
    }))
  } catch (err) {
    logger.warn('home-data: failed to fetch FAQ', err as Error)
  }

  // --- Testimonials ---
  try {
    const testimonialResult = await query(
      `SELECT id, author_name, author_role, content, rating
       FROM testimonials
       WHERE is_active = true
       ORDER BY display_order ASC, id ASC
       LIMIT 6`
    )
    result.testimonials = testimonialResult.rows.map((row: any) => ({
      id: row.id,
      authorName: row.author_name,
      authorRole: row.author_role,
      content: row.content,
      rating: row.rating
    }))
  } catch (err) {
    logger.warn('home-data: failed to fetch testimonials', err as Error)
  }

  // --- Event highlights (public-safe marketing data) ---
  try {
    let eventResult
    try {
      eventResult = await query(
        `WITH events AS (
           SELECT
             qr.event_date,
             qr.status,
             NULLIF(TRIM(fs.team_name), '') AS team_name,
             NULLIF(TRIM(qr.organization), '') AS organization,
             NULLIF(TRIM(qr.sport_type), '') AS sport_type,
             NULLIF(TRIM(qr.service_type), '') AS service_type
           FROM quote_requests qr
           LEFT JOIN form_submissions fs ON fs.quote_id = qr.id
           WHERE qr.status IN ('paid', 'confirmed', 'in_progress', 'completed')
             AND qr.event_date IS NOT NULL
             AND qr.event_date >= CURRENT_DATE - INTERVAL '120 days'
         ),
         labeled AS (
           SELECT
             event_date,
             CASE
               WHEN team_name IS NOT NULL THEN team_name
               WHEN organization IS NOT NULL THEN organization
               WHEN sport_type IS NOT NULL THEN INITCAP(REPLACE(sport_type, '-', ' ')) || ' Event'
               WHEN service_type IS NOT NULL THEN INITCAP(REPLACE(service_type, '-', ' ')) || ' Event'
               ELSE 'Sports Event'
             END AS title,
             CASE
               WHEN sport_type IS NOT NULL THEN INITCAP(REPLACE(sport_type, '-', ' '))
               WHEN service_type IS NOT NULL THEN INITCAP(REPLACE(service_type, '-', ' '))
               ELSE 'Live Event'
             END AS category,
             CASE WHEN event_date >= CURRENT_DATE THEN 'upcoming' ELSE 'recent' END AS lifecycle
           FROM events
         )
         SELECT event_date, title, category, lifecycle
         FROM labeled
         ORDER BY
           CASE WHEN lifecycle = 'upcoming' THEN 0 ELSE 1 END,
           CASE WHEN lifecycle = 'upcoming' THEN event_date END ASC,
           CASE WHEN lifecycle = 'recent' THEN event_date END DESC
         LIMIT 14`
      )
    } catch (eventErr: any) {
      // Graceful fallback if form_submissions table is not available
      if (eventErr?.code === '42P01') {
        eventResult = await query(
          `WITH events AS (
             SELECT
               qr.event_date,
               qr.status,
               NULL::text AS team_name,
               NULLIF(TRIM(qr.organization), '') AS organization,
               NULLIF(TRIM(qr.sport_type), '') AS sport_type,
               NULLIF(TRIM(qr.service_type), '') AS service_type
             FROM quote_requests qr
             WHERE qr.status IN ('paid', 'confirmed', 'in_progress', 'completed')
               AND qr.event_date IS NOT NULL
               AND qr.event_date >= CURRENT_DATE - INTERVAL '120 days'
           ),
           labeled AS (
             SELECT
               event_date,
               CASE
                 WHEN organization IS NOT NULL THEN organization
                 WHEN sport_type IS NOT NULL THEN INITCAP(REPLACE(sport_type, '-', ' ')) || ' Event'
                 WHEN service_type IS NOT NULL THEN INITCAP(REPLACE(service_type, '-', ' ')) || ' Event'
                 ELSE 'Sports Event'
               END AS title,
               CASE
                 WHEN sport_type IS NOT NULL THEN INITCAP(REPLACE(sport_type, '-', ' '))
                 WHEN service_type IS NOT NULL THEN INITCAP(REPLACE(service_type, '-', ' '))
                 ELSE 'Live Event'
               END AS category,
               CASE WHEN event_date >= CURRENT_DATE THEN 'upcoming' ELSE 'recent' END AS lifecycle
             FROM events
           )
           SELECT event_date, title, category, lifecycle
           FROM labeled
           ORDER BY
             CASE WHEN lifecycle = 'upcoming' THEN 0 ELSE 1 END,
             CASE WHEN lifecycle = 'upcoming' THEN event_date END ASC,
             CASE WHEN lifecycle = 'recent' THEN event_date END DESC
           LIMIT 14`
        )
      } else {
        throw eventErr
      }
    }

    result.eventHighlights = eventResult.rows.map((row: any) => ({
      date: row.event_date,
      title: row.title,
      category: row.category,
      lifecycle: row.lifecycle
    }))

    const summaryResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE event_date >= CURRENT_DATE) AS upcoming_count,
         COUNT(*) FILTER (WHERE event_date < CURRENT_DATE) AS recent_count,
         COUNT(*) FILTER (
           WHERE DATE_TRUNC('month', event_date) = DATE_TRUNC('month', CURRENT_DATE)
         ) AS this_month_count
       FROM quote_requests
       WHERE status IN ('paid', 'confirmed', 'in_progress', 'completed')
         AND event_date IS NOT NULL
         AND event_date >= CURRENT_DATE - INTERVAL '120 days'`
    )

    const summary = summaryResult.rows[0]
    result.eventSummary = {
      upcomingCount: Number(summary?.upcoming_count || 0),
      recentCount: Number(summary?.recent_count || 0),
      thisMonthCount: Number(summary?.this_month_count || 0)
    }
  } catch (err) {
    logger.warn('home-data: failed to fetch event highlights', err as Error)
  }

  return result
})
