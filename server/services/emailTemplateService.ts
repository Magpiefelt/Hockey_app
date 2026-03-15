import { query } from '../db/connection'
import { logger } from '../utils/logger'
import { escapeHtml } from '../utils/sanitize'

const SETTINGS_KEY = 'email_template_overrides'
const SETTINGS_DESCRIPTION = 'Admin managed email template overrides'
const SETTINGS_TABLE_MISSING_CODE = '42P01'
const TEMPLATE_CACHE_TTL_MS = 30_000

type TemplateDefinition = {
  key: string
  label: string
  description: string
  variables: string[]
  defaultSubject: string
  defaultBody: string
  sampleData: Record<string, unknown>
}

type ManagedTemplateOverride = {
  enabled: boolean
  subject: string
  body: string
  updatedAt: string
  updatedBy: number | null
}

type ManagedTemplateStore = {
  version: 1
  templates: Record<string, ManagedTemplateOverride>
}

type RenderContext = Record<string, unknown>

export type ManagedTemplateConfig = TemplateDefinition & {
  override: ManagedTemplateOverride | null
  effectiveSubject: string
  effectiveBody: string
  isUsingOverride: boolean
}

const DEFAULT_MANAGED_TEMPLATE_STORE: ManagedTemplateStore = {
  version: 1,
  templates: {}
}

const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    key: 'order_confirmation',
    label: 'Order Confirmation',
    description: 'Sent when a customer submits an order request.',
    variables: ['name', 'orderId', 'serviceType', 'businessName', 'supportEmail', 'appUrl'],
    defaultSubject: 'Order Confirmation - {{businessName}} #{{orderId}}',
    defaultBody: `
      <p>Hi {{name}},</p>
      <p>Thanks for your request. Your order <strong>#{{orderId}}</strong> for {{serviceType}} has been received.</p>
      <p>If you need anything, contact us at {{supportEmail}}.</p>
      <p>Best regards,<br>{{businessName}}</p>
    `,
    sampleData: {
      name: 'Alex',
      orderId: 245,
      serviceType: 'Game Day DJ'
    }
  },
  {
    key: 'quote',
    label: 'Quote',
    description: 'Basic quote notification email.',
    variables: ['name', 'orderId', 'packageName', 'quoteAmountFormatted', 'supportEmail'],
    defaultSubject: 'Your Quote is Ready - {{businessName}} #{{orderId}}',
    defaultBody: `
      <p>Hi {{name}},</p>
      <p>Your quote for <strong>{{packageName}}</strong> is ready.</p>
      <p><strong>Quote Amount:</strong> {{quoteAmountFormatted}}</p>
      <p>Please reply to this email if you have any questions.</p>
    `,
    sampleData: {
      name: 'Alex',
      orderId: 245,
      packageName: 'Premium Package',
      quoteAmount: 159900
    }
  },
  {
    key: 'quote_enhanced',
    label: 'Enhanced Quote',
    description: 'Enhanced quote email with optional payment/view links.',
    variables: ['name', 'orderId', 'packageName', 'quoteAmountFormatted', 'quoteViewUrl', 'paymentUrl', 'adminNotes'],
    defaultSubject: 'Your Quote is Ready - {{businessName}} #{{orderId}}',
    defaultBody: `
      <p>Hi {{name}},</p>
      <p>Your quote for <strong>{{packageName}}</strong> is ready.</p>
      <p><strong>Amount:</strong> {{quoteAmountFormatted}}</p>
      <p><a href="{{quoteViewUrl}}">View Quote</a></p>
      <p>{{adminNotes}}</p>
    `,
    sampleData: {
      name: 'Alex',
      orderId: 245,
      packageName: 'Premium Package',
      quoteAmount: 159900,
      quoteViewUrl: 'https://elitesportsdj.ca/orders/245/quote'
    }
  },
  {
    key: 'quote_revision',
    label: 'Quote Revision',
    description: 'Sent when a quote has been revised.',
    variables: ['name', 'orderId', 'quoteAmountFormatted', 'reason', 'quoteViewUrl'],
    defaultSubject: 'Quote Updated - Order #{{orderId}}',
    defaultBody: `
      <p>Hi {{name}},</p>
      <p>Your quote for order <strong>#{{orderId}}</strong> was updated.</p>
      <p><strong>Updated Quote:</strong> {{quoteAmountFormatted}}</p>
      <p><strong>Reason:</strong> {{reason}}</p>
      <p><a href="{{quoteViewUrl}}">View Updated Quote</a></p>
    `,
    sampleData: {
      name: 'Alex',
      orderId: 245,
      quoteAmount: 149900,
      reason: 'Updated event details',
      quoteViewUrl: 'https://elitesportsdj.ca/orders/245/quote'
    }
  },
  {
    key: 'quote_reminder',
    label: 'Quote Reminder',
    description: 'Reminder for a customer to review an open quote.',
    variables: ['name', 'orderId', 'quoteAmountFormatted', 'daysOld', 'quoteViewUrl'],
    defaultSubject: 'Reminder: Your Quote is Waiting - Order #{{orderId}}',
    defaultBody: `
      <p>Hi {{name}},</p>
      <p>This is a reminder about your quote for order <strong>#{{orderId}}</strong>.</p>
      <p><strong>Amount:</strong> {{quoteAmountFormatted}}</p>
      <p><strong>Quote Age:</strong> {{daysOld}} day(s)</p>
      <p><a href="{{quoteViewUrl}}">Review Quote</a></p>
    `,
    sampleData: {
      name: 'Alex',
      orderId: 245,
      quoteAmount: 159900,
      daysOld: 4,
      quoteViewUrl: 'https://elitesportsdj.ca/orders/245/quote'
    }
  },
  {
    key: 'invoice',
    label: 'Invoice',
    description: 'Invoice email with payment link.',
    variables: ['name', 'orderId', 'amountFormatted', 'invoiceUrl', 'businessName'],
    defaultSubject: 'Invoice #{{orderId}} - {{businessName}}',
    defaultBody: `
      <p>Hi {{name}},</p>
      <p>Your invoice for order <strong>#{{orderId}}</strong> is ready.</p>
      <p><strong>Amount Due:</strong> {{amountFormatted}}</p>
      <p><a href="{{invoiceUrl}}">Pay Invoice</a></p>
    `,
    sampleData: {
      name: 'Alex',
      orderId: 245,
      amount: 159900,
      invoiceUrl: 'https://elitesportsdj.ca/invoices/245'
    }
  },
  {
    key: 'receipt',
    label: 'Payment Receipt',
    description: 'Payment confirmation sent after successful payment.',
    variables: ['name', 'orderId', 'amountFormatted', 'completionDate', 'businessName'],
    defaultSubject: 'Payment Received - {{businessName}} #{{orderId}}',
    defaultBody: `
      <p>Hi {{name}},</p>
      <p>We received your payment for order <strong>#{{orderId}}</strong>.</p>
      <p><strong>Amount Paid:</strong> {{amountFormatted}}</p>
      <p><strong>Date:</strong> {{completionDate}}</p>
    `,
    sampleData: {
      name: 'Alex',
      orderId: 245,
      amount: 159900
    }
  },
  {
    key: 'payment_receipt',
    label: 'Payment Receipt (Alias)',
    description: 'Alias template used by parts of the system for payment receipt.',
    variables: ['name', 'orderId', 'amountFormatted', 'completionDate', 'businessName'],
    defaultSubject: 'Payment Received - {{businessName}} #{{orderId}}',
    defaultBody: `
      <p>Hi {{name}},</p>
      <p>We received your payment for order <strong>#{{orderId}}</strong>.</p>
      <p><strong>Amount Paid:</strong> {{amountFormatted}}</p>
      <p><strong>Date:</strong> {{completionDate}}</p>
    `,
    sampleData: {
      name: 'Alex',
      orderId: 245,
      amount: 159900
    }
  },
  {
    key: 'manual_completion',
    label: 'Manual Completion',
    description: 'Sent when an order is manually completed by an admin.',
    variables: ['name', 'orderId', 'amountFormatted', 'serviceType', 'completionDate', 'adminMessage'],
    defaultSubject: 'Order Complete - {{businessName}} #{{orderId}}',
    defaultBody: `
      <p>Hi {{name}},</p>
      <p>Your order <strong>#{{orderId}}</strong> has been completed.</p>
      <p><strong>Service:</strong> {{serviceType}}</p>
      <p><strong>Amount:</strong> {{amountFormatted}}</p>
      <p><strong>Date:</strong> {{completionDate}}</p>
      <p>{{adminMessage}}</p>
    `,
    sampleData: {
      name: 'Alex',
      orderId: 245,
      amount: 159900,
      serviceType: 'Game Day DJ',
      adminMessage: 'Thanks for your business.'
    }
  },
  {
    key: 'admin_notification',
    label: 'Admin Notification',
    description: 'Internal notification email to admins.',
    variables: ['subject', 'message', 'orderId', 'appUrl'],
    defaultSubject: '[Admin Notification] {{subject}}',
    defaultBody: `
      <p>{{message}}</p>
      <p><a href="{{appUrl}}/admin/orders/{{orderId}}">View Order</a></p>
    `,
    sampleData: {
      subject: 'Order requires review',
      message: 'A high-priority order needs manual review.',
      orderId: 245
    }
  },
  {
    key: 'contact_notification',
    label: 'Contact Form Notification',
    description: 'Internal notification for contact form submissions.',
    variables: ['name', 'email', 'phone', 'subject', 'message', 'submissionId'],
    defaultSubject: '[Contact Form] {{subject}}',
    defaultBody: `
      <p><strong>From:</strong> {{name}} ({{email}})</p>
      <p><strong>Phone:</strong> {{phone}}</p>
      <p><strong>Submission:</strong> #{{submissionId}}</p>
      <p>{{message}}</p>
    `,
    sampleData: {
      name: 'Jamie',
      email: 'jamie@example.com',
      phone: '555-1010',
      subject: 'Question about packages',
      message: 'Can you share package details?',
      submissionId: 73
    }
  },
  {
    key: 'custom',
    label: 'Custom',
    description: 'Generic custom email template used by admins.',
    variables: ['name', 'subject', 'message', 'orderId', 'businessName'],
    defaultSubject: '{{subject}}',
    defaultBody: `
      <p>Hi {{name}},</p>
      <p>{{message}}</p>
      <p>Best regards,<br>{{businessName}}</p>
    `,
    sampleData: {
      name: 'Alex',
      subject: 'Quick update for your order',
      message: 'Your files will be ready shortly.',
      orderId: 245
    }
  }
]

const DEFINITION_BY_KEY = new Map<string, TemplateDefinition>(
  TEMPLATE_DEFINITIONS.map((definition) => [definition.key, definition])
)

const GLOBAL_VARIABLES = new Set([
  'businessName',
  'supportEmail',
  'appUrl',
  'currentYear',
  'today',
  'to',
  'subject',
  'name',
  'message',
  'orderId',
  'quoteAmount',
  'quoteAmountFormatted',
  'amount',
  'amountFormatted',
  'completionDate'
])

let templateStoreCache: ManagedTemplateStore | null = null
let templateStoreCacheAt = 0

function getAppBaseUrl() {
  try {
    const runtimeConfig = useRuntimeConfig()
    return runtimeConfig.public.appBaseUrl || process.env.APP_URL || 'https://elitesportsdj.ca'
  } catch {
    return process.env.APP_URL || 'https://elitesportsdj.ca'
  }
}

function getBusinessName() {
  return process.env.BUSINESS_NAME || 'Elite Sports DJ'
}

function getSupportEmail() {
  return process.env.SUPPORT_EMAIL || 'info@elitesportsdj.ca'
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeTemplateStore(raw: unknown): ManagedTemplateStore {
  if (!isPlainObject(raw)) return { ...DEFAULT_MANAGED_TEMPLATE_STORE }
  const templatesRaw = isPlainObject(raw.templates) ? raw.templates : {}
  const templates: Record<string, ManagedTemplateOverride> = {}

  for (const [templateKey, templateValue] of Object.entries(templatesRaw)) {
    if (!isPlainObject(templateValue)) continue
    const subject = typeof templateValue.subject === 'string' ? templateValue.subject : ''
    const body = typeof templateValue.body === 'string' ? templateValue.body : ''
    const enabled = templateValue.enabled === true
    if (!subject && !body && !enabled) continue

    templates[templateKey] = {
      enabled,
      subject,
      body,
      updatedAt: typeof templateValue.updatedAt === 'string' ? templateValue.updatedAt : new Date().toISOString(),
      updatedBy: typeof templateValue.updatedBy === 'number' ? templateValue.updatedBy : null
    }
  }

  return {
    version: 1,
    templates
  }
}

async function loadManagedTemplateStore(forceRefresh = false): Promise<ManagedTemplateStore> {
  if (
    !forceRefresh &&
    templateStoreCache &&
    Date.now() - templateStoreCacheAt < TEMPLATE_CACHE_TTL_MS
  ) {
    return templateStoreCache
  }

  try {
    const result = await query(
      `SELECT value FROM settings WHERE key = $1 LIMIT 1`,
      [SETTINGS_KEY]
    )
    const rowValue = result.rows[0]?.value
    const normalized = normalizeTemplateStore(rowValue)
    templateStoreCache = normalized
    templateStoreCacheAt = Date.now()
    return normalized
  } catch (error: any) {
    if (error?.code === SETTINGS_TABLE_MISSING_CODE) {
      const fallback = { ...DEFAULT_MANAGED_TEMPLATE_STORE }
      templateStoreCache = fallback
      templateStoreCacheAt = Date.now()
      return fallback
    }
    logger.error('Failed to load managed email templates', { error: error?.message })
    const fallback = { ...DEFAULT_MANAGED_TEMPLATE_STORE }
    templateStoreCache = fallback
    templateStoreCacheAt = Date.now()
    return fallback
  }
}

async function persistManagedTemplateStore(store: ManagedTemplateStore): Promise<void> {
  try {
    await query(
      `INSERT INTO settings (key, value, description, updated_at)
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = NOW()`,
      [SETTINGS_KEY, JSON.stringify(store), SETTINGS_DESCRIPTION]
    )
    templateStoreCache = store
    templateStoreCacheAt = Date.now()
  } catch (error: any) {
    if (error?.code === SETTINGS_TABLE_MISSING_CODE) {
      throw new Error('Email template settings are unavailable because the settings table does not exist.')
    }
    throw error
  }
}

function getTemplateDefinition(templateKey: string): TemplateDefinition | null {
  return DEFINITION_BY_KEY.get(templateKey) || null
}

function formatCurrency(cents: unknown): string {
  const numeric = Number(cents)
  if (!Number.isFinite(numeric)) return ''
  return `$${(numeric / 100).toFixed(2)}`
}

function flattenContext(
  value: unknown,
  target: RenderContext,
  prefix = '',
  depth = 0
) {
  if (depth > 4 || value === null || value === undefined) return

  if (Array.isArray(value)) {
    target[prefix] = value.join(', ')
    return
  }

  if (isPlainObject(value)) {
    for (const [key, nestedValue] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key
      flattenContext(nestedValue, target, nextPrefix, depth + 1)
      if (!prefix) {
        target[key] = nestedValue
      }
    }
    return
  }

  if (prefix) {
    target[prefix] = value
  }
}

function getDefaultRenderContext(): RenderContext {
  const now = new Date()
  return {
    businessName: getBusinessName(),
    supportEmail: getSupportEmail(),
    appUrl: getAppBaseUrl(),
    currentYear: now.getFullYear(),
    today: now.toISOString().split('T')[0],
    completionDate: now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

function buildRenderContext(metadata: Record<string, unknown>, fallbackSubject?: string): RenderContext {
  const context: RenderContext = {
    ...getDefaultRenderContext()
  }

  if (fallbackSubject) {
    context.subject = fallbackSubject
  }

  flattenContext(metadata, context)

  if (typeof context.quoteAmount === 'number') {
    context.quoteAmountFormatted = formatCurrency(context.quoteAmount)
  }
  if (typeof context.amount === 'number') {
    context.amountFormatted = formatCurrency(context.amount)
  }
  if (typeof context.quoteAmount === 'string') {
    const quoteAmountNumber = Number(context.quoteAmount)
    if (Number.isFinite(quoteAmountNumber)) {
      context.quoteAmountFormatted = formatCurrency(quoteAmountNumber)
    }
  }
  if (typeof context.amount === 'string') {
    const amountNumber = Number(context.amount)
    if (Number.isFinite(amountNumber)) {
      context.amountFormatted = formatCurrency(amountNumber)
    }
  }

  return context
}

function getContextValue(context: RenderContext, key: string): unknown {
  if (Object.prototype.hasOwnProperty.call(context, key)) {
    return context[key]
  }

  const path = key.split('.')
  let cursor: unknown = context
  for (const segment of path) {
    if (!isPlainObject(cursor) && !Array.isArray(cursor)) return ''
    cursor = (cursor as any)[segment]
    if (cursor === undefined || cursor === null) return ''
  }
  return cursor
}

function renderTemplateString(template: string, context: RenderContext): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, rawKey: string) => {
    const value = getContextValue(context, rawKey)
    if (value === null || value === undefined) return ''
    if (value instanceof Date) return escapeHtml(value.toISOString())
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return escapeHtml(value.join(', '))
    if (typeof value === 'object') return escapeHtml(JSON.stringify(value))
    return escapeHtml(String(value))
  })
}

function sanitizeRenderedHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, ' $1=$2#$2')
}

function extractPlaceholders(input: string): string[] {
  const placeholders = new Set<string>()
  const regex = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g
  let match: RegExpExecArray | null = null
  while (true) {
    match = regex.exec(input)
    if (!match) break
    placeholders.add(match[1])
  }
  return [...placeholders]
}

function validateTemplateForDefinition(definition: TemplateDefinition, subject: string, body: string) {
  const allowed = new Set([...definition.variables, ...GLOBAL_VARIABLES])
  const placeholders = [...extractPlaceholders(subject), ...extractPlaceholders(body)]
  const invalid = placeholders.filter((placeholder) => !allowed.has(placeholder))
  if (invalid.length > 0) {
    throw new Error(`Unknown template variables: ${[...new Set(invalid)].join(', ')}`)
  }

  if (/<script\b|<iframe\b|javascript\s*:/i.test(body)) {
    throw new Error('Template body contains unsafe HTML content.')
  }
}

function sanitizeTemplateSubject(subject: string) {
  return subject.replace(/[\r\n]/g, '').trim().slice(0, 200)
}

function sanitizeTemplateBody(body: string) {
  return body.trim().slice(0, 20_000)
}

export function getManagedEmailTemplateDefinitions(): TemplateDefinition[] {
  return TEMPLATE_DEFINITIONS
}

export async function listManagedEmailTemplates(): Promise<ManagedTemplateConfig[]> {
  const store = await loadManagedTemplateStore()
  return TEMPLATE_DEFINITIONS.map((definition) => {
    const override = store.templates[definition.key] || null
    const isUsingOverride = override?.enabled === true && !!override.subject && !!override.body

    return {
      ...definition,
      override,
      effectiveSubject: isUsingOverride ? override!.subject : definition.defaultSubject,
      effectiveBody: isUsingOverride ? override!.body : definition.defaultBody,
      isUsingOverride
    }
  })
}

export async function saveManagedEmailTemplate(input: {
  templateKey: string
  enabled: boolean
  subject: string
  body: string
  updatedBy: number | null
}): Promise<ManagedTemplateConfig> {
  const definition = getTemplateDefinition(input.templateKey)
  if (!definition) {
    throw new Error(`Unsupported template key '${input.templateKey}'.`)
  }

  const subject = sanitizeTemplateSubject(input.subject)
  const body = sanitizeTemplateBody(input.body)

  if (input.enabled && (!subject || !body)) {
    throw new Error('Enabled templates require both a subject and body.')
  }

  validateTemplateForDefinition(definition, subject || definition.defaultSubject, body || definition.defaultBody)

  const store = await loadManagedTemplateStore(true)
  store.templates[input.templateKey] = {
    enabled: input.enabled,
    subject,
    body,
    updatedAt: new Date().toISOString(),
    updatedBy: input.updatedBy
  }

  await persistManagedTemplateStore(store)

  const override = store.templates[input.templateKey]
  const isUsingOverride = override.enabled && !!override.subject && !!override.body
  return {
    ...definition,
    override,
    effectiveSubject: isUsingOverride ? override.subject : definition.defaultSubject,
    effectiveBody: isUsingOverride ? override.body : definition.defaultBody,
    isUsingOverride
  }
}

export async function resetManagedEmailTemplate(templateKey: string): Promise<void> {
  const definition = getTemplateDefinition(templateKey)
  if (!definition) {
    throw new Error(`Unsupported template key '${templateKey}'.`)
  }

  const store = await loadManagedTemplateStore(true)
  delete store.templates[templateKey]
  await persistManagedTemplateStore(store)
}

export async function previewManagedEmailTemplate(input: {
  templateKey: string
  subject?: string
  body?: string
  context?: Record<string, unknown>
}): Promise<{ subject: string; html: string }> {
  const definition = getTemplateDefinition(input.templateKey)
  if (!definition) {
    throw new Error(`Unsupported template key '${input.templateKey}'.`)
  }

  const subject = sanitizeTemplateSubject(input.subject || definition.defaultSubject)
  const body = sanitizeTemplateBody(input.body || definition.defaultBody)

  validateTemplateForDefinition(definition, subject, body)

  const context = buildRenderContext(
    {
      ...definition.sampleData,
      ...(input.context || {})
    },
    subject
  )

  const renderedSubject = sanitizeTemplateSubject(renderTemplateString(subject, context))
  const renderedHtml = sanitizeRenderedHtml(renderTemplateString(body, context))

  return {
    subject: renderedSubject,
    html: renderedHtml
  }
}

export async function resolveManagedEmailTemplate(
  templateKey: string,
  fallback: {
    subject: string
    html: string
    metadata?: Record<string, unknown>
  }
): Promise<{ subject: string; html: string; overrideApplied: boolean }> {
  const definition = getTemplateDefinition(templateKey)
  if (!definition) {
    return {
      subject: fallback.subject,
      html: fallback.html,
      overrideApplied: false
    }
  }

  try {
    const store = await loadManagedTemplateStore()
    const override = store.templates[templateKey]
    if (!override || !override.enabled || !override.subject || !override.body) {
      return {
        subject: fallback.subject,
        html: fallback.html,
        overrideApplied: false
      }
    }

    validateTemplateForDefinition(definition, override.subject, override.body)

    const context = buildRenderContext(fallback.metadata || {}, fallback.subject)
    const subject = sanitizeTemplateSubject(renderTemplateString(override.subject, context))
    const html = sanitizeRenderedHtml(renderTemplateString(override.body, context))

    if (!subject || !html) {
      return {
        subject: fallback.subject,
        html: fallback.html,
        overrideApplied: false
      }
    }

    return {
      subject,
      html,
      overrideApplied: true
    }
  } catch (error: any) {
    logger.warn('Failed to apply managed template override, falling back to default template', {
      templateKey,
      error: error?.message
    })
    return {
      subject: fallback.subject,
      html: fallback.html,
      overrideApplied: false
    }
  }
}
