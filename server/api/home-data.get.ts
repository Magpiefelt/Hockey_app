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

const toDateOnlyString = (value: unknown): string | null => {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split('T')[0]
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    return trimmed.includes('T') ? trimmed.split('T')[0] : trimmed
  }

  return null
}

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
    const eventResult = await query(
      `SELECT
         event_date,
         title,
         category,
         location,
         description,
         CASE WHEN event_date >= CURRENT_DATE THEN 'upcoming' ELSE 'recent' END AS lifecycle
       FROM public_event_highlights
       WHERE is_visible = TRUE
         AND event_date IS NOT NULL
         AND event_date >= CURRENT_DATE - INTERVAL '120 days'
       ORDER BY
         CASE WHEN event_date >= CURRENT_DATE THEN 0 ELSE 1 END,
         CASE WHEN event_date >= CURRENT_DATE THEN event_date END ASC,
         CASE WHEN event_date < CURRENT_DATE THEN event_date END DESC,
         display_order ASC,
         id DESC
       LIMIT 20`
    )

    result.eventHighlights = eventResult.rows.map((row: any) => ({
      date: toDateOnlyString(row.event_date),
      title: row.title,
      category: row.category,
      location: row.location || null,
      description: row.description || null,
      lifecycle: row.lifecycle
    })).filter((row: any) => typeof row.date === 'string' && row.date.length > 0)

    const summaryResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE event_date >= CURRENT_DATE) AS upcoming_count,
         COUNT(*) FILTER (WHERE event_date < CURRENT_DATE) AS recent_count,
         COUNT(*) FILTER (
           WHERE DATE_TRUNC('month', event_date) = DATE_TRUNC('month', CURRENT_DATE)
         ) AS this_month_count
       FROM public_event_highlights
       WHERE is_visible = TRUE
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
    logger.warn('home-data: failed to fetch event highlights (or table missing)', err as Error)
  }

  return result
})
