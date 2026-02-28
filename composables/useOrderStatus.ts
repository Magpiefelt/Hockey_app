/**
 * Single source of truth for order status labels, colours, and badge classes.
 *
 * Every admin page and component MUST use this composable instead of defining
 * local getStatusClasses / getStatusColor / getStatusLabel functions.
 *
 * Colour scheme (dark-mode admin panel):
 *   pending    → amber   (needs attention)
 *   submitted  → amber   (needs attention)
 *   in_progress→ cyan    (active work)
 *   quoted     → blue    (quote sent)
 *   quote_viewed → blue  (quote opened)
 *   quote_accepted → blue (quote accepted)
 *   invoiced   → purple  (awaiting payment)
 *   paid       → emerald (money received)
 *   completed  → emerald (work done)
 *   delivered  → teal    (final)
 *   cancelled  → red     (terminal)
 *   refunded   → red     (terminal)
 *
 * Colour scheme (light-mode customer pages):
 *   Uses lighter bg + darker text for readability on white backgrounds.
 */

interface StatusColorSet {
  /** Badge class for dark backgrounds (admin panel) */
  badge: string
  /** Background tint for timeline / card highlights */
  bg: string
  /** Border accent for timeline dots */
  border: string
  /** Solid colour for pipeline / chart bars */
  solid: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  in_progress: 'In Progress',
  quoted: 'Quoted',
  quote_viewed: 'Quote Viewed',
  quote_accepted: 'Quote Accepted',
  invoiced: 'Invoiced',
  paid: 'Paid',
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const STATUS_COLORS: Record<string, StatusColorSet> = {
  pending: {
    badge: 'bg-amber-500/20 text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    solid: 'bg-amber-500',
  },
  submitted: {
    badge: 'bg-amber-500/20 text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    solid: 'bg-amber-500',
  },
  in_progress: {
    badge: 'bg-cyan-500/20 text-cyan-400',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500',
    solid: 'bg-cyan-500',
  },
  quoted: {
    badge: 'bg-blue-500/20 text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    solid: 'bg-blue-500',
  },
  quote_viewed: {
    badge: 'bg-blue-500/20 text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    solid: 'bg-blue-500',
  },
  quote_accepted: {
    badge: 'bg-blue-500/20 text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    solid: 'bg-blue-500',
  },
  invoiced: {
    badge: 'bg-purple-500/20 text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500',
    solid: 'bg-purple-500',
  },
  paid: {
    badge: 'bg-emerald-500/20 text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500',
    solid: 'bg-emerald-500',
  },
  completed: {
    badge: 'bg-emerald-500/20 text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500',
    solid: 'bg-emerald-500',
  },
  delivered: {
    badge: 'bg-teal-500/20 text-teal-400',
    bg: 'bg-teal-500/20',
    border: 'border-teal-500',
    solid: 'bg-teal-500',
  },
  cancelled: {
    badge: 'bg-red-500/20 text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    solid: 'bg-red-500',
  },
  refunded: {
    badge: 'bg-red-500/20 text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    solid: 'bg-red-500',
  },
}

/** Light-mode badge classes for customer-facing pages */
const STATUS_COLORS_LIGHT: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  submitted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-cyan-100 text-cyan-700',
  quoted: 'bg-purple-100 text-purple-700',
  quote_viewed: 'bg-purple-100 text-purple-700',
  quote_accepted: 'bg-green-100 text-green-700',
  invoiced: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  delivered: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-slate-100 text-slate-700',
}

const FALLBACK: StatusColorSet = {
  badge: 'bg-slate-500/20 text-slate-400',
  bg: 'bg-slate-500/20',
  border: 'border-slate-500',
  solid: 'bg-slate-500',
}

export const useOrderStatus = () => {
  /**
   * Human-readable label for a status string.
   */
  const getStatusLabel = (status: string): string => {
    return STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
  }

  /**
   * Dark-mode badge class string (admin panel).
   * Usage: `:class="getStatusBadge(order.status)"`
   */
  const getStatusBadge = (status: string): string => {
    return (STATUS_COLORS[status] || FALLBACK).badge
  }

  /**
   * Full colour set for a status (bg, border, badge, solid).
   * Useful for timeline items, pipeline charts, etc.
   */
  const getStatusColors = (status: string): StatusColorSet => {
    return STATUS_COLORS[status] || FALLBACK
  }

  /**
   * Light-mode badge class string (customer-facing pages).
   */
  const getStatusBadgeLight = (status: string): string => {
    return STATUS_COLORS_LIGHT[status] || 'bg-slate-100 text-slate-700'
  }

  return {
    getStatusLabel,
    getStatusBadge,
    getStatusColors,
    getStatusBadgeLight,
  }
}
