# Technical Implementation Plan: Quote Process & User Management Enhancements

**Repository:** Hockey_app (Elite Sports DJ)  
**Date:** January 1, 2026  
**Author:** Development Bot

---

## Executive Summary

This document provides a comprehensive technical implementation plan for enhancing the quote submission process and user management capabilities in the Hockey_app. Each enhancement includes detailed specifications for database changes, backend modifications, frontend components, and integration points within the existing codebase.

The implementation strategy prioritizes integrating new features into existing files and systems rather than creating entirely new structures, maintaining codebase cohesion and reducing file proliferation.

---

## Table of Contents

1. [Payment Integration After Quote Acceptance](#1-payment-integration-after-quote-acceptance)
2. [Quote Email Enhancement with Order Details](#2-quote-email-enhancement-with-order-details)
3. [Customer Order Management from Admin Panel](#3-customer-order-management-from-admin-panel)
4. [Quote Acceptance Tracking](#4-quote-acceptance-tracking)
5. [Bulk Actions for Order Management](#5-bulk-actions-for-order-management)
6. [File Preview System](#6-file-preview-system)
7. [Quote Revision Workflow](#7-quote-revision-workflow)
8. [Customer Order Editing](#8-customer-order-editing)
9. [Email History & Communication Tracking](#9-email-history--communication-tracking)
10. [Enhanced Order Filtering](#10-enhanced-order-filtering)
11. [Dashboard Analytics Enhancements](#11-dashboard-analytics-enhancements)
12. [Automated Quote Reminders](#12-automated-quote-reminders)

---

## 1. Payment Integration After Quote Acceptance

### Problem Statement

Currently, when an admin submits a quote, the customer receives an email instructing them to "reply to this email or contact us" to proceed with payment. There is no direct payment link or online payment flow, creating friction and potential lost conversions.

### Current State Analysis

| Component | Location | Current Behavior |
|-----------|----------|------------------|
| Quote Submission | `/server/trpc/routers/admin.ts` (lines 490-563) | Updates order status to `quoted`, sends email without payment link |
| Quote Email | `/server/utils/email.ts` (lines 218-291) | Shows quote amount but no actionable payment button |
| Stripe Utils | `/server/utils/stripe.ts` | Full Stripe integration exists but not connected to quote flow |
| Payment Router | `/server/trpc/routers/payments.ts` | `createCheckout` endpoint exists but not triggered from quote |

### Technical Implementation

#### 1.1 Database Changes

No schema changes required. The existing `invoices` table already supports the required fields.

#### 1.2 Backend Modifications

**File: `/server/trpc/routers/admin.ts`**

Modify the `submitQuote` mutation to optionally create a Stripe checkout session and include the payment URL in the quote email.

```typescript
// Location: After line 540 (after updating order status)
// Add new parameter to input schema

submitQuote: adminProcedure
  .input(z.object({
    orderId: z.number(),
    quoteAmount: z.number(),
    adminNotes: z.string().optional(),
    includePaymentLink: z.boolean().default(true),  // NEW
    expirationDays: z.number().default(30)          // NEW
  }))
  .mutation(async ({ input, ctx }) => {
    return transaction(async (client) => {
      // ... existing code ...
      
      // NEW: Generate payment link if requested
      let paymentUrl: string | null = null
      if (input.includePaymentLink && isStripeConfigured()) {
        try {
          const customer = await getOrCreateCustomer(
            order.contact_email,
            order.contact_name,
            { orderId: input.orderId.toString() }
          )
          
          const config = useRuntimeConfig()
          const session = await createCheckoutSession({
            customerId: customer.id,
            orderId: input.orderId,
            amount: input.quoteAmount,
            description: `${packageName} - Order #${input.orderId}`,
            successUrl: `${config.public.appBaseUrl}/orders/${input.orderId}?payment=success`,
            cancelUrl: `${config.public.appBaseUrl}/orders/${input.orderId}?payment=cancelled`
          })
          
          paymentUrl = session.url
          
          // Save invoice record
          await client.query(
            `INSERT INTO invoices (quote_id, stripe_invoice_id, stripe_customer_id, amount_cents, status, invoice_url)
             VALUES ($1, $2, $3, $4, 'draft', $5)`,
            [input.orderId, session.id, customer.id, input.quoteAmount, session.url]
          )
        } catch (err) {
          logger.warn('Failed to create payment link, proceeding without', { orderId: input.orderId })
        }
      }
      
      // Send quote email with payment link
      await sendQuoteEmail({
        to: order.contact_email,
        name: order.contact_name,
        quoteAmount: input.quoteAmount,
        packageName,
        orderId: input.orderId,
        paymentUrl,                    // NEW
        expirationDate: new Date(Date.now() + input.expirationDays * 24 * 60 * 60 * 1000)  // NEW
      })
      
      // ... rest of existing code ...
    })
  })
```

**File: `/server/utils/email.ts`**

Update the `sendQuoteEmail` function to include the payment button.

```typescript
// Location: Line 218, update interface and function

interface QuoteEmailData {
  to: string
  name: string
  quoteAmount: number
  packageName: string
  orderId: number
  paymentUrl?: string | null      // NEW
  expirationDate?: Date           // NEW
  eventDate?: string              // NEW
  teamName?: string               // NEW
  adminNotes?: string             // NEW
}

export async function sendQuoteEmail(data: QuoteEmailData): Promise<boolean> {
  const formattedAmount = `$${(data.quoteAmount / 100).toFixed(2)}`
  const expirationText = data.expirationDate 
    ? data.expirationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '30 days from today'
  
  // Add payment button section if paymentUrl exists
  const paymentSection = data.paymentUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.paymentUrl}" 
         style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
        Accept Quote & Pay Now
      </a>
    </div>
    <p style="text-align: center; color: #64748b; font-size: 14px;">
      Or copy this link: <a href="${data.paymentUrl}">${data.paymentUrl}</a>
    </p>
  ` : `
    <p><strong>Next Steps:</strong></p>
    <p>To proceed with this quote, please reply to this email or contact us.</p>
  `
  
  // Add order details section
  const orderDetailsSection = `
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #334155;">Order Details</h3>
      ${data.teamName ? `<p><strong>Team:</strong> ${data.teamName}</p>` : ''}
      ${data.eventDate ? `<p><strong>Event Date:</strong> ${data.eventDate}</p>` : ''}
      <p><strong>Package:</strong> ${data.packageName}</p>
      ${data.adminNotes ? `<p><strong>Notes:</strong> ${data.adminNotes}</p>` : ''}
    </div>
  `
  
  // Update HTML template to include new sections
  // ... (integrate into existing template)
}
```

#### 1.3 Frontend Modifications

**File: `/pages/admin/orders/[id].vue`**

Add checkbox option when submitting quote.

```vue
<!-- Location: Insert in quote submission form section (around line 145) -->
<div class="mt-4">
  <label class="flex items-center gap-3 cursor-pointer">
    <input
      v-model="includePaymentLink"
      type="checkbox"
      class="w-5 h-5 rounded border-white/20 bg-dark-primary text-brand-500 focus:ring-brand-500"
    />
    <span class="text-slate-300">Include payment link in quote email</span>
  </label>
  <p class="text-sm text-slate-500 mt-1 ml-8">
    Customer will be able to pay directly from the email
  </p>
</div>

<!-- In script section, add: -->
const includePaymentLink = ref(true)

// Update submitQuote function call:
await trpc.admin.submitQuote.mutate({
  orderId: orderId.value,
  quoteAmount: quoteAmount.value * 100,
  adminNotes: adminNotes.value,
  includePaymentLink: includePaymentLink.value
})
```

**New File: `/pages/orders/[id]/pay.vue`**

Create a dedicated payment page for customers.

```vue
<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12">
    <div class="container mx-auto max-w-2xl px-4">
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-cyan-500 to-blue-500 p-8 text-white text-center">
          <h1 class="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p class="opacity-90">Order #{{ orderId }}</p>
        </div>
        
        <!-- Order Summary -->
        <div class="p-8" v-if="order">
          <div class="border-b pb-6 mb-6">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Order Summary</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-slate-600">Package</span>
                <span class="font-medium">{{ order.packageName }}</span>
              </div>
              <div class="flex justify-between" v-if="order.eventDate">
                <span class="text-slate-600">Event Date</span>
                <span class="font-medium">{{ formatDate(order.eventDate) }}</span>
              </div>
              <div class="flex justify-between text-xl font-bold pt-4 border-t">
                <span>Total</span>
                <span class="text-cyan-600">{{ formatPrice(order.quotedAmount) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Payment Button -->
          <button
            @click="proceedToPayment"
            :disabled="isLoading"
            class="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span v-if="isLoading">Processing...</span>
            <span v-else>Pay {{ formatPrice(order.quotedAmount) }}</span>
          </button>
          
          <p class="text-center text-sm text-slate-500 mt-4">
            Secure payment powered by Stripe
          </p>
        </div>
        
        <!-- Loading State -->
        <div v-else-if="isLoading" class="p-12 text-center">
          <div class="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="mt-4 text-slate-600">Loading order details...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'minimal',
  middleware: 'auth'
})

const route = useRoute()
const trpc = useTrpc()
const { formatPrice, formatDate } = useUtils()

const orderId = computed(() => route.params.id as string)
const order = ref(null)
const isLoading = ref(true)

onMounted(async () => {
  try {
    const result = await trpc.orders.get.query({ id: orderId.value })
    order.value = result.order
  } catch (err) {
    // Handle error
  } finally {
    isLoading.value = false
  }
})

async function proceedToPayment() {
  isLoading.value = true
  try {
    const result = await trpc.payments.createCheckout.mutate({
      orderId: parseInt(orderId.value)
    })
    
    if (result.url) {
      window.location.href = result.url
    }
  } catch (err) {
    // Handle error
  } finally {
    isLoading.value = false
  }
}
</script>
```

#### 1.4 Integration Points

| Integration | Description |
|-------------|-------------|
| Stripe Webhooks | Already configured at `/server/api/webhooks/stripe.post.ts` - handles `checkout.session.completed` |
| Email System | Update `sendQuoteEmail` to pass additional order details |
| Order Status | Webhook updates status to `paid` when payment succeeds |

---

## 2. Quote Email Enhancement with Order Details

### Problem Statement

The current quote email only shows the package name and quote amount. It lacks critical information such as event date, team name, specific services requested, and admin notes.

### Technical Implementation

#### 2.1 Backend Modifications

**File: `/server/trpc/routers/admin.ts`**

Modify the `submitQuote` mutation to fetch and pass additional order details to the email function.

```typescript
// Location: Inside submitQuote mutation, after fetching order (around line 500)

// Fetch complete order details for email
const orderDetailsResult = await client.query(
  `SELECT 
    qr.contact_name,
    qr.contact_email,
    qr.event_date,
    qr.requirements_json,
    qr.service_type,
    qr.sport_type,
    p.name as package_name
   FROM quote_requests qr
   LEFT JOIN packages p ON qr.package_id = p.id
   WHERE qr.id = $1`,
  [input.orderId]
)

const orderDetails = orderDetailsResult.rows[0]

// Extract team name from requirements_json
const requirements = orderDetails.requirements_json || {}
const teamName = requirements.teamName || requirements.team_name || null
const eventDateFormatted = orderDetails.event_date 
  ? new Date(orderDetails.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  : null

// Pass to email function
await sendQuoteEmail({
  to: order.contact_email,
  name: order.contact_name,
  quoteAmount: input.quoteAmount,
  packageName,
  orderId: input.orderId,
  paymentUrl,
  eventDate: eventDateFormatted,
  teamName,
  sportType: orderDetails.sport_type,
  adminNotes: input.adminNotes,
  servicesRequested: extractServicesFromRequirements(requirements)
})
```

**File: `/server/utils/email.ts`**

Create enhanced quote email template.

```typescript
// Location: Replace sendQuoteEmail function (lines 218-291)

interface QuoteEmailData {
  to: string
  name: string
  quoteAmount: number
  packageName: string
  orderId: number
  paymentUrl?: string | null
  eventDate?: string | null
  teamName?: string | null
  sportType?: string | null
  adminNotes?: string | null
  servicesRequested?: string[]
}

export async function sendQuoteEmail(data: QuoteEmailData): Promise<boolean> {
  const formattedAmount = `$${(data.quoteAmount / 100).toFixed(2)}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { background: #ffffff; padding: 40px 30px; }
        .quote-box { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 30px; border-radius: 12px; margin: 25px 0; border: 2px solid #0ea5e9; text-align: center; }
        .price { font-size: 48px; font-weight: bold; color: #0ea5e9; margin: 15px 0; }
        .details-box { background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-label { font-weight: 600; color: #64748b; width: 140px; }
        .detail-value { color: #334155; flex: 1; }
        .cta-button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; }
        .services-list { list-style: none; padding: 0; margin: 15px 0; }
        .services-list li { padding: 8px 0 8px 25px; position: relative; }
        .services-list li:before { content: "✓"; position: absolute; left: 0; color: #0ea5e9; font-weight: bold; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
        .admin-notes { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Your Custom Quote is Ready!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${data.orderId}</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">Hi ${data.name},</p>
          
          <p>Great news! We've prepared a custom quote for your ${data.packageName} request.</p>
          
          <div class="quote-box">
            <p style="margin: 0; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Your Quote</p>
            <div class="price">${formattedAmount}</div>
            <p style="margin: 0; color: #64748b;">Valid for 30 days</p>
          </div>
          
          ${data.eventDate || data.teamName || data.sportType ? `
          <div class="details-box">
            <h3 style="margin-top: 0; color: #0f172a;">Order Details</h3>
            ${data.teamName ? `
            <div class="detail-row">
              <span class="detail-label">Team Name</span>
              <span class="detail-value">${data.teamName}</span>
            </div>` : ''}
            ${data.eventDate ? `
            <div class="detail-row">
              <span class="detail-label">Event Date</span>
              <span class="detail-value">${data.eventDate}</span>
            </div>` : ''}
            ${data.sportType ? `
            <div class="detail-row">
              <span class="detail-label">Sport</span>
              <span class="detail-value">${data.sportType}</span>
            </div>` : ''}
            <div class="detail-row" style="border-bottom: none;">
              <span class="detail-label">Package</span>
              <span class="detail-value">${data.packageName}</span>
            </div>
          </div>` : ''}
          
          ${data.adminNotes ? `
          <div class="admin-notes">
            <strong>Note from our team:</strong>
            <p style="margin: 10px 0 0 0;">${data.adminNotes}</p>
          </div>` : ''}
          
          <h3>What's Included:</h3>
          <ul class="services-list">
            <li>Professional DJ services for your event</li>
            <li>Custom music selection and mixing</li>
            <li>High-quality audio production</li>
            <li>Unlimited revisions until you're satisfied</li>
          </ul>
          
          ${data.paymentUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.paymentUrl}" class="cta-button">Accept Quote & Pay Now</a>
          </div>
          <p style="text-align: center; color: #64748b; font-size: 14px;">
            Secure payment powered by Stripe
          </p>` : `
          <p><strong>Next Steps:</strong></p>
          <p>To proceed with this quote, please reply to this email or contact us at:</p>
          <p>📞 Phone: (555) 123-4567<br>📧 Email: info@elitesportsdj.com</p>`}
          
          <p style="margin-top: 30px;">We look forward to working with you!</p>
          <p>Best regards,<br><strong>The Elite Sports DJ Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
          <p style="margin-top: 10px;">
            <a href="#" style="color: #0ea5e9;">View Order Online</a> | 
            <a href="#" style="color: #0ea5e9;">Contact Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(
    {
      to: data.to,
      subject: `Your Quote is Ready - Elite Sports DJ #${data.orderId}`,
      html
    },
    'quote',
    data,
    data.orderId
  )
}
```

---

## 3. Customer Order Management from Admin Panel

### Problem Statement

The admin customers page (`/admin/customers`) displays customer information but provides no way to view a customer's order history or manage their orders directly. Admins must search orders separately by email.

### Technical Implementation

#### 3.1 Database Changes

No schema changes required.

#### 3.2 Backend Modifications

**File: `/server/trpc/routers/admin.ts`**

Add a new endpoint to fetch customer details with order history.

```typescript
// Location: Inside customers router (after line 605)

/**
 * Get customer details with order history
 */
getCustomer: adminProcedure
  .input(z.object({
    email: z.string().email()
  }))
  .query(async ({ input }) => {
    // Fetch customer info
    const customerResult = await query(
      `SELECT 
        COALESCE(MAX(u.id), 0) as id,
        COALESCE(MAX(u.name), MAX(qr.contact_name)) as name,
        $1 as email,
        MAX(qr.contact_phone) as phone,
        MAX(qr.organization) as organization,
        COUNT(qr.id) as order_count,
        COALESCE(SUM(qr.total_amount), 0) as total_spent,
        MIN(qr.created_at) as first_order_date
      FROM quote_requests qr
      LEFT JOIN users u ON qr.user_id = u.id
      WHERE COALESCE(u.email, qr.contact_email) = $1
      GROUP BY COALESCE(u.email, qr.contact_email)`,
      [input.email]
    )
    
    if (customerResult.rows.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Customer not found'
      })
    }
    
    const customer = customerResult.rows[0]
    
    // Fetch order history
    const ordersResult = await query(
      `SELECT 
        qr.id,
        qr.status,
        qr.service_type,
        qr.event_date,
        qr.quoted_amount,
        qr.total_amount,
        qr.created_at,
        p.name as package_name
      FROM quote_requests qr
      LEFT JOIN packages p ON qr.package_id = p.id
      WHERE qr.contact_email = $1
      ORDER BY qr.created_at DESC`,
      [input.email]
    )
    
    // Fetch email history
    const emailsResult = await query(
      `SELECT 
        id,
        subject,
        email_type,
        status,
        sent_at
      FROM email_logs
      WHERE recipient_email = $1
      ORDER BY sent_at DESC
      LIMIT 20`,
      [input.email]
    )
    
    return {
      customer: {
        id: customer.id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        organization: customer.organization,
        orderCount: parseInt(customer.order_count),
        totalSpent: parseInt(customer.total_spent),
        firstOrderDate: customer.first_order_date?.toISOString()
      },
      orders: ordersResult.rows.map(row => ({
        id: row.id.toString(),
        status: row.status,
        serviceType: row.service_type,
        packageName: row.package_name,
        eventDate: row.event_date?.toISOString(),
        quotedAmount: row.quoted_amount,
        totalAmount: row.total_amount,
        createdAt: row.created_at.toISOString()
      })),
      emails: emailsResult.rows.map(row => ({
        id: row.id,
        subject: row.subject,
        type: row.email_type,
        status: row.status,
        sentAt: row.sent_at?.toISOString()
      }))
    }
  }),
```

#### 3.3 Frontend Modifications

**New File: `/pages/admin/customers/[email].vue`**

Create customer detail page.

```vue
<template>
  <div class="min-h-screen px-4 py-12 bg-dark-primary">
    <div class="container mx-auto max-w-6xl">
      <!-- Back Button -->
      <NuxtLink 
        to="/admin/customers" 
        class="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <Icon name="mdi:arrow-left" class="w-5 h-5" />
        Back to Customers
      </NuxtLink>
      
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
      
      <!-- Content -->
      <div v-else-if="customerData" class="space-y-6">
        <!-- Customer Header -->
        <div class="card p-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
                <span class="text-2xl font-bold text-brand-500">
                  {{ customerData.customer.name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-white">{{ customerData.customer.name }}</h1>
                <p class="text-slate-400">{{ customerData.customer.email }}</p>
              </div>
            </div>
            <div class="flex gap-3">
              <button 
                @click="showNewOrderModal = true"
                class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
              >
                <Icon name="mdi:plus" class="w-5 h-5 inline-block mr-1" />
                New Order
              </button>
              <button 
                @click="sendEmail"
                class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <Icon name="mdi:email" class="w-5 h-5 inline-block mr-1" />
                Send Email
              </button>
            </div>
          </div>
        </div>
        
        <!-- Stats -->
        <div class="grid md:grid-cols-4 gap-4">
          <div class="card p-4">
            <p class="text-slate-400 text-sm">Total Orders</p>
            <p class="text-2xl font-bold text-white">{{ customerData.customer.orderCount }}</p>
          </div>
          <div class="card p-4">
            <p class="text-slate-400 text-sm">Total Spent</p>
            <p class="text-2xl font-bold text-green-400">{{ formatPrice(customerData.customer.totalSpent) }}</p>
          </div>
          <div class="card p-4">
            <p class="text-slate-400 text-sm">Customer Since</p>
            <p class="text-2xl font-bold text-white">{{ formatDate(customerData.customer.firstOrderDate) }}</p>
          </div>
          <div class="card p-4">
            <p class="text-slate-400 text-sm">Avg Order Value</p>
            <p class="text-2xl font-bold text-white">{{ avgOrderValue }}</p>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="card overflow-hidden">
          <div class="flex border-b border-white/10">
            <button 
              @click="activeTab = 'orders'"
              :class="['px-6 py-4 font-medium transition-colors', activeTab === 'orders' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-400 hover:text-white']"
            >
              Orders ({{ customerData.orders.length }})
            </button>
            <button 
              @click="activeTab = 'emails'"
              :class="['px-6 py-4 font-medium transition-colors', activeTab === 'emails' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-400 hover:text-white']"
            >
              Email History ({{ customerData.emails.length }})
            </button>
          </div>
          
          <!-- Orders Tab -->
          <div v-if="activeTab === 'orders'" class="p-6">
            <div v-if="customerData.orders.length === 0" class="text-center py-12 text-slate-400">
              No orders found
            </div>
            <div v-else class="space-y-3">
              <div 
                v-for="order in customerData.orders" 
                :key="order.id"
                @click="navigateTo(`/admin/orders/${order.id}`)"
                class="flex items-center justify-between p-4 rounded-lg bg-dark-secondary border border-white/10 hover:border-brand-500/30 cursor-pointer transition-colors"
              >
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <span class="text-white font-bold">Order #{{ order.id }}</span>
                    <UiBadge :variant="getStatusVariant(order.status)" size="sm">
                      {{ getStatusLabel(order.status) }}
                    </UiBadge>
                  </div>
                  <p class="text-sm text-slate-400">
                    {{ order.packageName || order.serviceType }} 
                    <span v-if="order.eventDate">• {{ formatDate(order.eventDate) }}</span>
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-white font-bold" v-if="order.totalAmount || order.quotedAmount">
                    {{ formatPrice(order.totalAmount || order.quotedAmount) }}
                  </p>
                  <p class="text-sm text-slate-400">{{ formatDate(order.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Emails Tab -->
          <div v-if="activeTab === 'emails'" class="p-6">
            <div v-if="customerData.emails.length === 0" class="text-center py-12 text-slate-400">
              No emails sent
            </div>
            <div v-else class="space-y-3">
              <div 
                v-for="email in customerData.emails" 
                :key="email.id"
                class="flex items-center justify-between p-4 rounded-lg bg-dark-secondary border border-white/10"
              >
                <div>
                  <p class="text-white font-medium">{{ email.subject }}</p>
                  <p class="text-sm text-slate-400">{{ email.type }}</p>
                </div>
                <div class="text-right">
                  <UiBadge :variant="email.status === 'sent' ? 'success' : 'warning'" size="sm">
                    {{ email.status }}
                  </UiBadge>
                  <p class="text-sm text-slate-400 mt-1">{{ formatDateTime(email.sentAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const route = useRoute()
const trpc = useTrpc()
const { formatPrice, formatDate, formatDateTime, getStatusLabel } = useUtils()

const customerEmail = computed(() => decodeURIComponent(route.params.email as string))
const loading = ref(true)
const customerData = ref(null)
const activeTab = ref('orders')
const showNewOrderModal = ref(false)

const avgOrderValue = computed(() => {
  if (!customerData.value || customerData.value.customer.orderCount === 0) return '$0'
  return formatPrice(customerData.value.customer.totalSpent / customerData.value.customer.orderCount)
})

const getStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    submitted: 'brand',
    quoted: 'warning',
    paid: 'success',
    completed: 'success',
    cancelled: 'neutral'
  }
  return variants[status] || 'neutral'
}

onMounted(async () => {
  try {
    customerData.value = await trpc.admin.customers.getCustomer.query({
      email: customerEmail.value
    })
  } catch (err) {
    console.error('Failed to load customer:', err)
  } finally {
    loading.value = false
  }
})
</script>
```

**File: `/pages/admin/customers.vue`**

Make customer rows clickable.

```vue
<!-- Location: Update the table row (around line 111) -->
<tr 
  v-for="customer in filteredCustomers" 
  :key="customer.id"
  @click="navigateTo(`/admin/customers/${encodeURIComponent(customer.email)}`)"
  class="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
>
  <!-- ... existing columns ... -->
  <td class="py-4 px-6">
    <Icon name="mdi:chevron-right" class="w-5 h-5 text-slate-400" />
  </td>
</tr>
```

---

## 4. Quote Acceptance Tracking

### Problem Statement

The current status flow goes directly from `quoted` to `paid` with no intermediate tracking. There's no way to know if a customer has viewed or accepted a quote before payment.

### Technical Implementation

#### 4.1 Database Changes

**File: `/database/migrations/002_quote_tracking.sql`** (NEW)

```sql
-- Add quote tracking fields to quote_requests
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS quote_viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quote_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quote_expires_at TIMESTAMPTZ;

-- Add quote_viewed and quote_accepted to status enum
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS quote_requests_status_check;

ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN ('pending', 'submitted', 'in_progress', 'quoted', 'quote_viewed', 'quote_accepted', 'invoiced', 'paid', 'completed', 'cancelled', 'delivered'));

-- Create quote tracking events table
CREATE TABLE IF NOT EXISTS quote_events (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('viewed', 'accepted', 'declined', 'expired', 'reminder_sent')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_type ON quote_events(event_type);
```

#### 4.2 Backend Modifications

**File: `/server/trpc/routers/orders.ts`**

Add quote viewing and acceptance tracking.

```typescript
// Location: Add new endpoints

/**
 * Track quote view event
 */
trackQuoteView: protectedProcedure
  .input(z.object({
    orderId: z.number()
  }))
  .mutation(async ({ input, ctx }) => {
    const event = getEvent(ctx.event)
    const ip = getRequestIP(event)
    const userAgent = getHeader(event, 'user-agent')
    
    return transaction(async (client) => {
      // Check if already viewed
      const existing = await client.query(
        `SELECT quote_viewed_at FROM quote_requests WHERE id = $1`,
        [input.orderId]
      )
      
      if (!existing.rows[0]?.quote_viewed_at) {
        // Update first view timestamp
        await client.query(
          `UPDATE quote_requests SET quote_viewed_at = NOW() WHERE id = $1`,
          [input.orderId]
        )
      }
      
      // Log view event
      await client.query(
        `INSERT INTO quote_events (quote_id, event_type, ip_address, user_agent)
         VALUES ($1, 'viewed', $2, $3)`,
        [input.orderId, ip, userAgent]
      )
      
      return { success: true }
    })
  }),

/**
 * Accept quote
 */
acceptQuote: protectedProcedure
  .input(z.object({
    orderId: z.number()
  }))
  .mutation(async ({ input, ctx }) => {
    return transaction(async (client) => {
      // Verify order belongs to user and is in quoted status
      const orderResult = await client.query(
        `SELECT id, status, contact_email, quote_expires_at 
         FROM quote_requests 
         WHERE id = $1 AND user_id = $2`,
        [input.orderId, ctx.user.userId]
      )
      
      if (orderResult.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found'
        })
      }
      
      const order = orderResult.rows[0]
      
      if (!['quoted', 'quote_viewed'].includes(order.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Quote cannot be accepted in current status'
        })
      }
      
      // Check if quote expired
      if (order.quote_expires_at && new Date(order.quote_expires_at) < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This quote has expired. Please contact us for a new quote.'
        })
      }
      
      // Update status to accepted
      await client.query(
        `UPDATE quote_requests 
         SET status = 'quote_accepted', quote_accepted_at = NOW()
         WHERE id = $1`,
        [input.orderId]
      )
      
      // Log acceptance event
      await client.query(
        `INSERT INTO quote_events (quote_id, event_type)
         VALUES ($1, 'accepted')`,
        [input.orderId]
      )
      
      // Log status change
      await client.query(
        `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
         VALUES ($1, $2, 'quote_accepted', $3, 'Customer accepted quote')`,
        [input.orderId, order.status, ctx.user.userId]
      )
      
      return { success: true }
    })
  }),
```

#### 4.3 Frontend Modifications

**File: `/pages/orders/[id].vue`**

Add quote acceptance UI for customers.

```vue
<!-- Location: Add in the order detail view when status is 'quoted' -->
<div v-if="order.status === 'quoted' || order.status === 'quote_viewed'" class="card p-6 border-2 border-brand-500">
  <div class="text-center">
    <h3 class="text-2xl font-bold text-white mb-2">Quote Ready for Acceptance</h3>
    <p class="text-slate-400 mb-6">Review the details below and accept to proceed with payment</p>
    
    <div class="bg-dark-secondary rounded-lg p-6 mb-6">
      <p class="text-slate-400 text-sm mb-2">Quote Amount</p>
      <p class="text-4xl font-bold text-brand-500">{{ formatPrice(order.quotedAmount) }}</p>
      <p class="text-slate-500 text-sm mt-2" v-if="order.quoteExpiresAt">
        Valid until {{ formatDate(order.quoteExpiresAt) }}
      </p>
    </div>
    
    <div class="flex gap-4 justify-center">
      <button
        @click="acceptQuote"
        :disabled="isAccepting"
        class="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
      >
        <span v-if="isAccepting">Processing...</span>
        <span v-else>Accept Quote & Continue to Payment</span>
      </button>
      <button
        @click="showDeclineModal = true"
        class="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
      >
        Request Changes
      </button>
    </div>
  </div>
</div>

<!-- In script section -->
const isAccepting = ref(false)

async function acceptQuote() {
  isAccepting.value = true
  try {
    await trpc.orders.acceptQuote.mutate({ orderId: parseInt(orderId.value) })
    // Redirect to payment
    navigateTo(`/orders/${orderId.value}/pay`)
  } catch (err) {
    showError(err.message)
  } finally {
    isAccepting.value = false
  }
}

// Track quote view on mount
onMounted(async () => {
  if (order.value?.status === 'quoted') {
    await trpc.orders.trackQuoteView.mutate({ orderId: parseInt(orderId.value) })
  }
})
```

---

## 5. Bulk Actions for Order Management

### Problem Statement

Admins must open each order individually to change status, send emails, or perform other actions. There are no bulk operations available.

### Technical Implementation

#### 5.1 Backend Modifications

**File: `/server/trpc/routers/admin.ts`**

Add bulk action endpoints.

```typescript
// Location: Inside orders router

/**
 * Bulk update order status
 */
bulkUpdateStatus: adminProcedure
  .input(z.object({
    orderIds: z.array(z.number()).min(1).max(100),
    status: z.string(),
    notes: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    const results = {
      success: [] as number[],
      failed: [] as { id: number; error: string }[]
    }
    
    for (const orderId of input.orderIds) {
      try {
        await transaction(async (client) => {
          // Get current status
          const current = await client.query(
            `SELECT status FROM quote_requests WHERE id = $1`,
            [orderId]
          )
          
          if (current.rows.length === 0) {
            throw new Error('Order not found')
          }
          
          const previousStatus = current.rows[0].status
          
          // Validate transition
          const validTransitions: Record<string, string[]> = {
            'submitted': ['in_progress', 'quoted', 'cancelled'],
            'quoted': ['invoiced', 'in_progress', 'cancelled'],
            'invoiced': ['paid', 'cancelled'],
            'paid': ['completed', 'delivered'],
            'completed': ['delivered'],
          }
          
          const allowed = validTransitions[previousStatus] || []
          if (!allowed.includes(input.status)) {
            throw new Error(`Invalid transition from ${previousStatus} to ${input.status}`)
          }
          
          // Update status
          await client.query(
            `UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
            [input.status, orderId]
          )
          
          // Log status change
          await client.query(
            `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, previousStatus, input.status, ctx.user.userId, input.notes || 'Bulk status update']
          )
        })
        
        results.success.push(orderId)
      } catch (err: any) {
        results.failed.push({ id: orderId, error: err.message })
      }
    }
    
    return results
  }),

/**
 * Bulk send emails
 */
bulkSendEmail: adminProcedure
  .input(z.object({
    orderIds: z.array(z.number()).min(1).max(50),
    emailType: z.enum(['reminder', 'status_update', 'custom']),
    subject: z.string().optional(),
    body: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    const results = {
      sent: 0,
      failed: 0
    }
    
    for (const orderId of input.orderIds) {
      try {
        const orderResult = await query(
          `SELECT contact_name, contact_email, status, quoted_amount 
           FROM quote_requests WHERE id = $1`,
          [orderId]
        )
        
        if (orderResult.rows.length === 0) continue
        
        const order = orderResult.rows[0]
        
        // Send appropriate email based on type
        if (input.emailType === 'reminder' && order.status === 'quoted') {
          await sendQuoteReminderEmail({
            to: order.contact_email,
            name: order.contact_name,
            orderId,
            quoteAmount: order.quoted_amount
          })
        } else if (input.emailType === 'custom' && input.subject && input.body) {
          await sendCustomEmail({
            to: order.contact_email,
            subject: input.subject,
            body: input.body.replace('{{name}}', order.contact_name).replace('{{orderId}}', orderId.toString()),
            orderId
          })
        }
        
        results.sent++
      } catch (err) {
        results.failed++
      }
    }
    
    return results
  }),

/**
 * Export orders to CSV
 */
exportOrders: adminProcedure
  .input(z.object({
    orderIds: z.array(z.number()).optional(),
    filters: z.object({
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional()
    }).optional()
  }))
  .mutation(async ({ input }) => {
    let whereClause = '1=1'
    const params: any[] = []
    let paramCount = 1
    
    if (input.orderIds && input.orderIds.length > 0) {
      whereClause += ` AND qr.id = ANY($${paramCount})`
      params.push(input.orderIds)
      paramCount++
    }
    
    if (input.filters?.status) {
      whereClause += ` AND qr.status = $${paramCount}`
      params.push(input.filters.status)
      paramCount++
    }
    
    const result = await query(
      `SELECT 
        qr.id as "Order ID",
        qr.contact_name as "Customer Name",
        qr.contact_email as "Email",
        qr.contact_phone as "Phone",
        qr.status as "Status",
        p.name as "Package",
        qr.event_date as "Event Date",
        qr.quoted_amount / 100.0 as "Quote Amount",
        qr.total_amount / 100.0 as "Total Amount",
        qr.created_at as "Created At"
      FROM quote_requests qr
      LEFT JOIN packages p ON qr.package_id = p.id
      WHERE ${whereClause}
      ORDER BY qr.created_at DESC`,
      params
    )
    
    // Convert to CSV
    const headers = Object.keys(result.rows[0] || {})
    const csvRows = [
      headers.join(','),
      ...result.rows.map(row => 
        headers.map(h => {
          const val = row[h]
          if (val === null) return ''
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`
          return val
        }).join(',')
      )
    ]
    
    return {
      csv: csvRows.join('\n'),
      filename: `orders_export_${new Date().toISOString().split('T')[0]}.csv`
    }
  }),
```

#### 5.2 Frontend Modifications

**File: `/pages/admin/orders/index.vue`**

Add bulk selection and actions.

```vue
<!-- Location: Add above the orders table -->
<div v-if="selectedOrders.length > 0" class="mb-4 p-4 bg-brand-500/10 border border-brand-500/30 rounded-lg flex items-center justify-between">
  <span class="text-white">
    <strong>{{ selectedOrders.length }}</strong> orders selected
  </span>
  <div class="flex gap-3">
    <select 
      v-model="bulkAction" 
      class="px-4 py-2 bg-dark-secondary border border-white/10 rounded-lg text-white"
    >
      <option value="">Select Action...</option>
      <option value="status_quoted">Mark as Quoted</option>
      <option value="status_in_progress">Mark as In Progress</option>
      <option value="status_completed">Mark as Completed</option>
      <option value="send_reminder">Send Quote Reminder</option>
      <option value="export">Export to CSV</option>
    </select>
    <button 
      @click="executeBulkAction"
      :disabled="!bulkAction || isProcessingBulk"
      class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50"
    >
      {{ isProcessingBulk ? 'Processing...' : 'Apply' }}
    </button>
    <button 
      @click="clearSelection"
      class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
    >
      Clear Selection
    </button>
  </div>
</div>

<!-- Add checkbox column to table -->
<thead>
  <tr class="border-b border-white/10">
    <th class="py-4 px-4">
      <input 
        type="checkbox" 
        :checked="allSelected"
        @change="toggleSelectAll"
        class="w-5 h-5 rounded border-white/20 bg-dark-primary text-brand-500"
      />
    </th>
    <!-- ... existing headers ... -->
  </tr>
</thead>
<tbody>
  <tr v-for="order in orders" :key="order.id">
    <td class="py-4 px-4">
      <input 
        type="checkbox" 
        :checked="selectedOrders.includes(order.id)"
        @change="toggleOrderSelection(order.id)"
        class="w-5 h-5 rounded border-white/20 bg-dark-primary text-brand-500"
      />
    </td>
    <!-- ... existing columns ... -->
  </tr>
</tbody>

<!-- In script section -->
const selectedOrders = ref<number[]>([])
const bulkAction = ref('')
const isProcessingBulk = ref(false)

const allSelected = computed(() => 
  orders.value.length > 0 && selectedOrders.value.length === orders.value.length
)

function toggleSelectAll() {
  if (allSelected.value) {
    selectedOrders.value = []
  } else {
    selectedOrders.value = orders.value.map(o => parseInt(o.id))
  }
}

function toggleOrderSelection(orderId: number) {
  const index = selectedOrders.value.indexOf(orderId)
  if (index > -1) {
    selectedOrders.value.splice(index, 1)
  } else {
    selectedOrders.value.push(orderId)
  }
}

function clearSelection() {
  selectedOrders.value = []
  bulkAction.value = ''
}

async function executeBulkAction() {
  if (!bulkAction.value || selectedOrders.value.length === 0) return
  
  isProcessingBulk.value = true
  
  try {
    if (bulkAction.value.startsWith('status_')) {
      const status = bulkAction.value.replace('status_', '')
      const result = await trpc.admin.orders.bulkUpdateStatus.mutate({
        orderIds: selectedOrders.value,
        status
      })
      
      showSuccess(`Updated ${result.success.length} orders`)
      if (result.failed.length > 0) {
        showWarning(`${result.failed.length} orders failed to update`)
      }
    } else if (bulkAction.value === 'send_reminder') {
      const result = await trpc.admin.orders.bulkSendEmail.mutate({
        orderIds: selectedOrders.value,
        emailType: 'reminder'
      })
      
      showSuccess(`Sent ${result.sent} reminder emails`)
    } else if (bulkAction.value === 'export') {
      const result = await trpc.admin.orders.exportOrders.mutate({
        orderIds: selectedOrders.value
      })
      
      // Download CSV
      const blob = new Blob([result.csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
    }
    
    // Refresh orders list
    await fetchOrders()
    clearSelection()
  } catch (err) {
    showError('Failed to execute bulk action')
  } finally {
    isProcessingBulk.value = false
  }
}
```

---

## 6. File Preview System

### Problem Statement

Files attached to orders are displayed as a simple list with names only. Users must download files to view them, with no preview capability for images, PDFs, or audio files.

### Technical Implementation

#### 6.1 Frontend Modifications

**New File: `/components/ui/FilePreview.vue`**

Create a reusable file preview component.

```vue
<template>
  <div>
    <!-- File Card -->
    <div 
      @click="openPreview"
      class="flex items-center gap-3 p-3 rounded-lg bg-dark-secondary border border-white/10 hover:border-brand-500/30 cursor-pointer transition-colors"
    >
      <!-- File Type Icon -->
      <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', iconBgClass]">
        <Icon :name="fileIcon" class="w-5 h-5 text-white" />
      </div>
      
      <!-- File Info -->
      <div class="flex-1 min-w-0">
        <p class="text-white text-sm font-medium truncate">{{ file.filename }}</p>
        <p class="text-slate-400 text-xs">{{ formatFileSize(file.fileSize) }}</p>
      </div>
      
      <!-- Preview Indicator -->
      <div v-if="canPreview" class="text-slate-400">
        <Icon name="mdi:eye" class="w-5 h-5" />
      </div>
      
      <!-- Download Button -->
      <a 
        :href="file.url" 
        download
        @click.stop
        class="p-2 text-slate-400 hover:text-white transition-colors"
      >
        <Icon name="mdi:download" class="w-5 h-5" />
      </a>
    </div>
    
    <!-- Preview Modal -->
    <Teleport to="body">
      <div 
        v-if="showPreview" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        @click.self="closePreview"
      >
        <div class="relative max-w-4xl max-h-[90vh] w-full mx-4">
          <!-- Close Button -->
          <button 
            @click="closePreview"
            class="absolute -top-12 right-0 text-white hover:text-slate-300"
          >
            <Icon name="mdi:close" class="w-8 h-8" />
          </button>
          
          <!-- Image Preview -->
          <img 
            v-if="isImage" 
            :src="file.url" 
            :alt="file.filename"
            class="max-w-full max-h-[80vh] mx-auto rounded-lg"
          />
          
          <!-- PDF Preview -->
          <iframe 
            v-else-if="isPdf"
            :src="file.url"
            class="w-full h-[80vh] rounded-lg bg-white"
          />
          
          <!-- Audio Preview -->
          <div v-else-if="isAudio" class="bg-dark-secondary p-8 rounded-lg">
            <div class="text-center mb-6">
              <Icon name="mdi:music" class="w-16 h-16 text-brand-500 mx-auto mb-4" />
              <p class="text-white font-medium">{{ file.filename }}</p>
            </div>
            <audio 
              :src="file.url" 
              controls 
              class="w-full"
            />
          </div>
          
          <!-- Video Preview -->
          <video 
            v-else-if="isVideo"
            :src="file.url"
            controls
            class="max-w-full max-h-[80vh] mx-auto rounded-lg"
          />
          
          <!-- Unsupported Format -->
          <div v-else class="bg-dark-secondary p-8 rounded-lg text-center">
            <Icon name="mdi:file" class="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p class="text-white font-medium mb-2">{{ file.filename }}</p>
            <p class="text-slate-400 mb-4">Preview not available for this file type</p>
            <a 
              :href="file.url" 
              download
              class="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
            >
              <Icon name="mdi:download" class="w-5 h-5" />
              Download File
            </a>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface FileData {
  id: string | number
  filename: string
  fileSize: number
  url: string
  mimeType?: string
}

interface Props {
  file: FileData
}

const props = defineProps<Props>()

const showPreview = ref(false)

const mimeType = computed(() => {
  if (props.file.mimeType) return props.file.mimeType
  
  // Infer from extension
  const ext = props.file.filename.split('.').pop()?.toLowerCase()
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4',
    'webm': 'video/webm'
  }
  return mimeMap[ext || ''] || 'application/octet-stream'
})

const isImage = computed(() => mimeType.value.startsWith('image/'))
const isPdf = computed(() => mimeType.value === 'application/pdf')
const isAudio = computed(() => mimeType.value.startsWith('audio/'))
const isVideo = computed(() => mimeType.value.startsWith('video/'))

const canPreview = computed(() => isImage.value || isPdf.value || isAudio.value || isVideo.value)

const fileIcon = computed(() => {
  if (isImage.value) return 'mdi:image'
  if (isPdf.value) return 'mdi:file-pdf-box'
  if (isAudio.value) return 'mdi:music'
  if (isVideo.value) return 'mdi:video'
  return 'mdi:file'
})

const iconBgClass = computed(() => {
  if (isImage.value) return 'bg-purple-500/20'
  if (isPdf.value) return 'bg-red-500/20'
  if (isAudio.value) return 'bg-green-500/20'
  if (isVideo.value) return 'bg-blue-500/20'
  return 'bg-slate-500/20'
})

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function openPreview() {
  if (canPreview.value) {
    showPreview.value = true
  }
}

function closePreview() {
  showPreview.value = false
}
</script>
```

**File: `/pages/admin/orders/[id].vue`**

Replace file list with preview component.

```vue
<!-- Location: Replace file display sections (around lines 283-330) -->

<!-- Customer Uploads -->
<div v-if="uploadedFiles.length > 0" class="mb-6">
  <h3 class="text-lg font-semibold text-white mb-3">Customer Uploads</h3>
  <div class="grid gap-3">
    <UiFilePreview 
      v-for="file in uploadedFiles" 
      :key="file.id" 
      :file="file" 
    />
  </div>
</div>

<!-- Deliverables -->
<div v-if="deliverableFiles.length > 0">
  <h3 class="text-lg font-semibold text-white mb-3">Deliverables</h3>
  <div class="grid gap-3">
    <UiFilePreview 
      v-for="file in deliverableFiles" 
      :key="file.id" 
      :file="file" 
    />
  </div>
</div>
```

---

## 7. Quote Revision Workflow

### Problem Statement

When an admin updates a quote amount, no notification is sent to the customer. There's no version history of quotes, and customers see updated amounts without context.

### Technical Implementation

#### 7.1 Database Changes

**File: `/database/migrations/003_quote_revisions.sql`** (NEW)

```sql
-- Quote revisions table
CREATE TABLE IF NOT EXISTS quote_revisions (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  amount_cents INTEGER NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_revisions_quote_id ON quote_revisions(quote_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_revisions_version ON quote_revisions(quote_id, version);

-- Add current_revision to quote_requests
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS current_quote_version INTEGER DEFAULT 1;
```

#### 7.2 Backend Modifications

**File: `/server/trpc/routers/admin.ts`**

Modify quote update to track revisions.

```typescript
// Location: Add new endpoint for quote revision

/**
 * Revise quote amount
 */
reviseQuote: adminProcedure
  .input(z.object({
    orderId: z.number(),
    newAmount: z.number().positive(),
    reason: z.string().min(1, 'Please provide a reason for the revision'),
    notifyCustomer: z.boolean().default(true)
  }))
  .mutation(async ({ input, ctx }) => {
    return transaction(async (client) => {
      // Get current quote info
      const currentResult = await client.query(
        `SELECT 
          qr.quoted_amount,
          qr.current_quote_version,
          qr.contact_email,
          qr.contact_name,
          p.name as package_name
         FROM quote_requests qr
         LEFT JOIN packages p ON qr.package_id = p.id
         WHERE qr.id = $1`,
        [input.orderId]
      )
      
      if (currentResult.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found'
        })
      }
      
      const current = currentResult.rows[0]
      const previousAmount = current.quoted_amount
      const newVersion = (current.current_quote_version || 1) + 1
      
      // Create revision record
      await client.query(
        `INSERT INTO quote_revisions (quote_id, version, amount_cents, notes, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [input.orderId, newVersion, input.newAmount, input.reason, ctx.user.userId]
      )
      
      // Update order with new quote
      await client.query(
        `UPDATE quote_requests 
         SET quoted_amount = $1, current_quote_version = $2, updated_at = NOW()
         WHERE id = $3`,
        [input.newAmount, newVersion, input.orderId]
      )
      
      // Log status history
      await client.query(
        `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
         VALUES ($1, 'quoted', 'quoted', $2, $3)`,
        [input.orderId, ctx.user.userId, `Quote revised: ${input.reason}`]
      )
      
      // Send notification if requested
      if (input.notifyCustomer) {
        await sendQuoteRevisionEmail({
          to: current.contact_email,
          name: current.contact_name,
          orderId: input.orderId,
          previousAmount,
          newAmount: input.newAmount,
          reason: input.reason,
          packageName: current.package_name
        })
      }
      
      return {
        success: true,
        version: newVersion,
        previousAmount,
        newAmount: input.newAmount
      }
    })
  }),

/**
 * Get quote revision history
 */
getQuoteRevisions: adminProcedure
  .input(z.object({
    orderId: z.number()
  }))
  .query(async ({ input }) => {
    const result = await query(
      `SELECT 
        qr.id,
        qr.version,
        qr.amount_cents,
        qr.notes,
        qr.created_at,
        u.name as created_by_name
       FROM quote_revisions qr
       LEFT JOIN users u ON qr.created_by = u.id
       WHERE qr.quote_id = $1
       ORDER BY qr.version DESC`,
      [input.orderId]
    )
    
    return result.rows.map(row => ({
      id: row.id,
      version: row.version,
      amount: row.amount_cents,
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      createdBy: row.created_by_name
    }))
  }),
```

**File: `/server/utils/email.ts`**

Add quote revision email template.

```typescript
// Location: Add new email function

interface QuoteRevisionEmailData {
  to: string
  name: string
  orderId: number
  previousAmount: number
  newAmount: number
  reason: string
  packageName: string
}

export async function sendQuoteRevisionEmail(data: QuoteRevisionEmailData): Promise<boolean> {
  const formattedPrevious = `$${(data.previousAmount / 100).toFixed(2)}`
  const formattedNew = `$${(data.newAmount / 100).toFixed(2)}`
  const difference = data.newAmount - data.previousAmount
  const isIncrease = difference > 0
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .revision-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b; }
        .price-comparison { display: flex; justify-content: space-around; text-align: center; margin: 20px 0; }
        .price-old { color: #94a3b8; text-decoration: line-through; }
        .price-new { color: #0ea5e9; font-size: 32px; font-weight: bold; }
        .reason-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Quote Updated</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          
          <p>We've updated the quote for your ${data.packageName} order.</p>
          
          <div class="revision-box">
            <h3 style="margin-top: 0; text-align: center;">Order #${data.orderId}</h3>
            <div class="price-comparison">
              <div>
                <p style="margin: 0; color: #64748b;">Previous Quote</p>
                <p class="price-old" style="font-size: 24px;">${formattedPrevious}</p>
              </div>
              <div>
                <p style="margin: 0; color: #64748b;">New Quote</p>
                <p class="price-new">${formattedNew}</p>
              </div>
            </div>
          </div>
          
          <div class="reason-box">
            <strong>Reason for update:</strong>
            <p style="margin: 10px 0 0 0;">${data.reason}</p>
          </div>
          
          <p>If you have any questions about this update, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(
    {
      to: data.to,
      subject: `Quote Updated - Order #${data.orderId}`,
      html
    },
    'quote_revision',
    data,
    data.orderId
  )
}
```

---

## 8. Customer Order Editing

### Problem Statement

Customers cannot edit or update their orders after submission. They must contact admin to make any changes, increasing support burden.

### Technical Implementation

#### 8.1 Backend Modifications

**File: `/server/trpc/routers/orders.ts`**

Add order update endpoint for customers.

```typescript
// Location: Add new endpoint

/**
 * Update order (customer)
 * Only allowed when status is 'submitted' or 'quoted'
 */
updateOrder: protectedProcedure
  .input(z.object({
    orderId: z.number(),
    eventDate: z.string().optional(),
    teamName: z.string().optional(),
    notes: z.string().optional(),
    requestChanges: z.string().optional() // Message to admin about requested changes
  }))
  .mutation(async ({ input, ctx }) => {
    return transaction(async (client) => {
      // Verify ownership and status
      const orderResult = await client.query(
        `SELECT id, status, requirements_json, contact_email 
         FROM quote_requests 
         WHERE id = $1 AND user_id = $2`,
        [input.orderId, ctx.user.userId]
      )
      
      if (orderResult.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found'
        })
      }
      
      const order = orderResult.rows[0]
      
      // Only allow edits in certain statuses
      if (!['submitted', 'quoted', 'quote_viewed'].includes(order.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order cannot be edited in current status'
        })
      }
      
      // Build updates
      const updates: string[] = []
      const params: any[] = []
      let paramCount = 1
      
      if (input.eventDate) {
        updates.push(`event_date = $${paramCount}`)
        params.push(input.eventDate)
        paramCount++
      }
      
      // Update requirements_json with new values
      let requirements = order.requirements_json || {}
      if (input.teamName) {
        requirements.teamName = input.teamName
      }
      if (input.notes) {
        requirements.customerNotes = input.notes
      }
      
      updates.push(`requirements_json = $${paramCount}`)
      params.push(JSON.stringify(requirements))
      paramCount++
      
      // Add customer change request note
      if (input.requestChanges) {
        const existingNotes = order.admin_notes || ''
        const changeRequest = `\n\n[Customer Request - ${new Date().toISOString()}]\n${input.requestChanges}`
        updates.push(`admin_notes = $${paramCount}`)
        params.push(existingNotes + changeRequest)
        paramCount++
      }
      
      params.push(input.orderId)
      
      await client.query(
        `UPDATE quote_requests 
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount}`,
        params
      )
      
      // Log the update
      await client.query(
        `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
         VALUES ($1, $2, $2, $3, 'Customer updated order details')`,
        [input.orderId, order.status, ctx.user.userId]
      )
      
      // Notify admin if changes requested
      if (input.requestChanges) {
        // Send notification to admin
        await sendAdminNotificationEmail({
          subject: `Customer Requested Changes - Order #${input.orderId}`,
          body: `Customer ${order.contact_email} has requested changes to their order:\n\n${input.requestChanges}`,
          orderId: input.orderId
        })
      }
      
      return { success: true }
    })
  }),
```

#### 8.2 Frontend Modifications

**File: `/pages/orders/[id].vue`**

Add edit functionality for customers.

```vue
<!-- Location: Add edit button and modal -->

<!-- Edit Button (show when editable) -->
<button 
  v-if="canEdit"
  @click="showEditModal = true"
  class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
>
  <Icon name="mdi:pencil" class="w-5 h-5 inline-block mr-1" />
  Edit Order
</button>

<!-- Edit Modal -->
<UiModal v-model="showEditModal" title="Edit Order">
  <form @submit.prevent="saveChanges" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-slate-300 mb-2">Event Date</label>
      <input 
        v-model="editForm.eventDate"
        type="date"
        class="w-full px-4 py-2 bg-dark-primary border border-white/10 rounded-lg text-white"
      />
    </div>
    
    <div>
      <label class="block text-sm font-medium text-slate-300 mb-2">Team Name</label>
      <input 
        v-model="editForm.teamName"
        type="text"
        class="w-full px-4 py-2 bg-dark-primary border border-white/10 rounded-lg text-white"
      />
    </div>
    
    <div>
      <label class="block text-sm font-medium text-slate-300 mb-2">Additional Notes</label>
      <textarea 
        v-model="editForm.notes"
        rows="3"
        class="w-full px-4 py-2 bg-dark-primary border border-white/10 rounded-lg text-white"
      ></textarea>
    </div>
    
    <div>
      <label class="block text-sm font-medium text-slate-300 mb-2">Request Changes (Optional)</label>
      <textarea 
        v-model="editForm.requestChanges"
        rows="3"
        placeholder="Describe any changes you'd like to request..."
        class="w-full px-4 py-2 bg-dark-primary border border-white/10 rounded-lg text-white placeholder:text-slate-500"
      ></textarea>
      <p class="text-sm text-slate-500 mt-1">This message will be sent to our team</p>
    </div>
    
    <div class="flex gap-3 pt-4">
      <button 
        type="button"
        @click="showEditModal = false"
        class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
      >
        Cancel
      </button>
      <button 
        type="submit"
        :disabled="isSaving"
        class="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50"
      >
        {{ isSaving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>
  </form>
</UiModal>

<!-- In script section -->
const showEditModal = ref(false)
const isSaving = ref(false)
const editForm = ref({
  eventDate: '',
  teamName: '',
  notes: '',
  requestChanges: ''
})

const canEdit = computed(() => {
  return ['submitted', 'quoted', 'quote_viewed'].includes(order.value?.status)
})

// Initialize form when order loads
watch(order, (newOrder) => {
  if (newOrder) {
    editForm.value.eventDate = newOrder.eventDate?.split('T')[0] || ''
    editForm.value.teamName = newOrder.requirements?.teamName || ''
    editForm.value.notes = newOrder.requirements?.customerNotes || ''
  }
}, { immediate: true })

async function saveChanges() {
  isSaving.value = true
  try {
    await trpc.orders.updateOrder.mutate({
      orderId: parseInt(orderId.value),
      ...editForm.value
    })
    
    showSuccess('Order updated successfully')
    showEditModal.value = false
    
    // Refresh order data
    await fetchOrder()
  } catch (err) {
    showError(err.message)
  } finally {
    isSaving.value = false
  }
}
```

---

## 9. Email History & Communication Tracking

### Problem Statement

The `email_logs` table exists but there's no UI to view email history. Admins cannot see what emails were sent to customers or resend emails.

### Technical Implementation

#### 9.1 Backend Modifications

**File: `/server/trpc/routers/admin.ts`**

Add email history endpoint.

```typescript
// Location: Add new endpoints

/**
 * Get email history for an order
 */
getEmailHistory: adminProcedure
  .input(z.object({
    orderId: z.number()
  }))
  .query(async ({ input }) => {
    const result = await query(
      `SELECT 
        id,
        recipient_email,
        subject,
        email_type,
        status,
        error_message,
        sent_at,
        created_at
       FROM email_logs
       WHERE quote_id = $1
       ORDER BY sent_at DESC`,
      [input.orderId]
    )
    
    return result.rows.map(row => ({
      id: row.id,
      recipientEmail: row.recipient_email,
      subject: row.subject,
      type: row.email_type,
      status: row.status,
      errorMessage: row.error_message,
      sentAt: row.sent_at?.toISOString(),
      createdAt: row.created_at.toISOString()
    }))
  }),

/**
 * Resend email
 */
resendEmail: adminProcedure
  .input(z.object({
    orderId: z.number(),
    emailType: z.enum(['quote', 'invoice', 'confirmation', 'status_update'])
  }))
  .mutation(async ({ input }) => {
    // Fetch order details
    const orderResult = await query(
      `SELECT 
        qr.contact_name,
        qr.contact_email,
        qr.quoted_amount,
        qr.status,
        p.name as package_name,
        i.invoice_url
       FROM quote_requests qr
       LEFT JOIN packages p ON qr.package_id = p.id
       LEFT JOIN invoices i ON qr.id = i.quote_id
       WHERE qr.id = $1`,
      [input.orderId]
    )
    
    if (orderResult.rows.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found'
      })
    }
    
    const order = orderResult.rows[0]
    
    // Send appropriate email
    switch (input.emailType) {
      case 'quote':
        await sendQuoteEmail({
          to: order.contact_email,
          name: order.contact_name,
          quoteAmount: order.quoted_amount,
          packageName: order.package_name,
          orderId: input.orderId
        })
        break
        
      case 'invoice':
        if (!order.invoice_url) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No invoice exists for this order'
          })
        }
        await sendInvoiceEmail({
          to: order.contact_email,
          name: order.contact_name,
          amount: order.quoted_amount,
          orderId: input.orderId,
          invoiceUrl: order.invoice_url
        })
        break
        
      // ... handle other types
    }
    
    return { success: true }
  }),
```

#### 9.2 Frontend Modifications

**New File: `/components/admin/EmailHistory.vue`**

Create email history component.

```vue
<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-lg font-bold text-white flex items-center gap-2">
        <Icon name="mdi:email-multiple" class="w-5 h-5 text-cyan-400" />
        Email History
      </h4>
      <div class="flex gap-2">
        <select 
          v-model="resendType"
          class="px-3 py-1.5 bg-dark-primary border border-white/10 rounded text-white text-sm"
        >
          <option value="">Resend Email...</option>
          <option value="quote">Quote Email</option>
          <option value="invoice">Invoice Email</option>
          <option value="confirmation">Confirmation</option>
        </select>
        <button 
          v-if="resendType"
          @click="resendEmail"
          :disabled="isResending"
          class="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded disabled:opacity-50"
        >
          {{ isResending ? 'Sending...' : 'Send' }}
        </button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <Icon name="mdi:loading" class="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
    
    <!-- Email List -->
    <div v-else-if="emails.length > 0" class="space-y-3">
      <div 
        v-for="email in emails" 
        :key="email.id"
        class="p-4 rounded-lg bg-slate-800 border border-slate-700"
      >
        <div class="flex items-start justify-between mb-2">
          <div>
            <p class="text-white font-medium">{{ email.subject }}</p>
            <p class="text-sm text-slate-400">To: {{ email.recipientEmail }}</p>
          </div>
          <div class="text-right">
            <span 
              :class="[
                'px-2 py-1 rounded text-xs font-semibold',
                email.status === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              ]"
            >
              {{ email.status }}
            </span>
          </div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500">{{ formatEmailType(email.type) }}</span>
          <span class="text-slate-500">{{ formatDateTime(email.sentAt) }}</span>
        </div>
        <p v-if="email.errorMessage" class="mt-2 text-sm text-red-400">
          Error: {{ email.errorMessage }}
        </p>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center py-8 text-slate-400">
      <Icon name="mdi:email-off" class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>No emails sent for this order</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  orderId: number
}

const props = defineProps<Props>()

const trpc = useTrpc()
const { formatDateTime } = useUtils()
const { showSuccess, showError } = useNotification()

const emails = ref([])
const isLoading = ref(true)
const resendType = ref('')
const isResending = ref(false)

onMounted(async () => {
  await loadEmails()
})

async function loadEmails() {
  isLoading.value = true
  try {
    emails.value = await trpc.admin.getEmailHistory.query({ orderId: props.orderId })
  } catch (err) {
    console.error('Failed to load email history:', err)
  } finally {
    isLoading.value = false
  }
}

async function resendEmail() {
  if (!resendType.value) return
  
  isResending.value = true
  try {
    await trpc.admin.resendEmail.mutate({
      orderId: props.orderId,
      emailType: resendType.value
    })
    
    showSuccess('Email sent successfully')
    resendType.value = ''
    await loadEmails()
  } catch (err) {
    showError(err.message)
  } finally {
    isResending.value = false
  }
}

function formatEmailType(type: string): string {
  const types: Record<string, string> = {
    'quote': 'Quote Email',
    'invoice': 'Invoice',
    'confirmation': 'Order Confirmation',
    'status_update': 'Status Update',
    'quote_revision': 'Quote Revision'
  }
  return types[type] || type
}
</script>
```

---

## 10. Enhanced Order Filtering

### Problem Statement

Current filters are limited to status, package, and basic search. Missing date range, amount range, and file attachment filters.

### Technical Implementation

#### 10.1 Backend Modifications

**File: `/server/trpc/routers/admin.ts`**

Enhance the orders list query to support additional filters.

```typescript
// Location: Update orders.list endpoint input schema and query

list: adminProcedure
  .input(z.object({
    limit: z.number().optional(),
    offset: z.number().optional(),
    status: z.string().optional(),
    packageId: z.string().optional(),
    search: z.string().optional(),
    // NEW filters
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    eventDateFrom: z.string().optional(),
    eventDateTo: z.string().optional(),
    amountMin: z.number().optional(),
    amountMax: z.number().optional(),
    hasFiles: z.boolean().optional(),
    hasDeliverables: z.boolean().optional(),
    sortBy: z.enum(['created_at', 'event_date', 'quoted_amount', 'status']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  }).optional())
  .query(async ({ input }) => {
    const filters = input || {}
    let whereClause = '1=1'
    const params: any[] = []
    let paramCount = 1
    
    // Existing filters
    if (filters.status) {
      whereClause += ` AND qr.status = $${paramCount}`
      params.push(filters.status)
      paramCount++
    }
    
    if (filters.packageId) {
      whereClause += ` AND p.slug = $${paramCount}`
      params.push(filters.packageId)
      paramCount++
    }
    
    if (filters.search) {
      whereClause += ` AND (
        qr.contact_name ILIKE $${paramCount} OR 
        qr.contact_email ILIKE $${paramCount} OR 
        qr.id::text = $${paramCount + 1}
      )`
      params.push(`%${filters.search}%`)
      params.push(filters.search)
      paramCount += 2
    }
    
    // NEW: Date range filters
    if (filters.dateFrom) {
      whereClause += ` AND qr.created_at >= $${paramCount}`
      params.push(filters.dateFrom)
      paramCount++
    }
    
    if (filters.dateTo) {
      whereClause += ` AND qr.created_at <= $${paramCount}`
      params.push(filters.dateTo + ' 23:59:59')
      paramCount++
    }
    
    if (filters.eventDateFrom) {
      whereClause += ` AND qr.event_date >= $${paramCount}`
      params.push(filters.eventDateFrom)
      paramCount++
    }
    
    if (filters.eventDateTo) {
      whereClause += ` AND qr.event_date <= $${paramCount}`
      params.push(filters.eventDateTo)
      paramCount++
    }
    
    // NEW: Amount range filters
    if (filters.amountMin !== undefined) {
      whereClause += ` AND COALESCE(qr.quoted_amount, 0) >= $${paramCount}`
      params.push(filters.amountMin * 100) // Convert to cents
      paramCount++
    }
    
    if (filters.amountMax !== undefined) {
      whereClause += ` AND COALESCE(qr.quoted_amount, 0) <= $${paramCount}`
      params.push(filters.amountMax * 100)
      paramCount++
    }
    
    // NEW: File filters
    if (filters.hasFiles === true) {
      whereClause += ` AND EXISTS (SELECT 1 FROM file_uploads fu WHERE fu.quote_id = qr.id AND fu.kind = 'upload')`
    } else if (filters.hasFiles === false) {
      whereClause += ` AND NOT EXISTS (SELECT 1 FROM file_uploads fu WHERE fu.quote_id = qr.id AND fu.kind = 'upload')`
    }
    
    if (filters.hasDeliverables === true) {
      whereClause += ` AND EXISTS (SELECT 1 FROM file_uploads fu WHERE fu.quote_id = qr.id AND fu.kind = 'deliverable')`
    } else if (filters.hasDeliverables === false) {
      whereClause += ` AND NOT EXISTS (SELECT 1 FROM file_uploads fu WHERE fu.quote_id = qr.id AND fu.kind = 'deliverable')`
    }
    
    // Sorting
    const sortColumn = filters.sortBy || 'created_at'
    const sortOrder = filters.sortOrder || 'desc'
    const orderClause = `ORDER BY qr.${sortColumn} ${sortOrder.toUpperCase()}`
    
    // Pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0
    
    const result = await query(
      `SELECT 
        qr.id,
        qr.contact_name as name,
        qr.contact_email as email,
        qr.status,
        qr.event_date,
        qr.quoted_amount,
        qr.total_amount,
        qr.created_at,
        p.name as package_name,
        p.slug as package_slug,
        (SELECT COUNT(*) FROM file_uploads fu WHERE fu.quote_id = qr.id AND fu.kind = 'upload') as upload_count,
        (SELECT COUNT(*) FROM file_uploads fu WHERE fu.quote_id = qr.id AND fu.kind = 'deliverable') as deliverable_count
       FROM quote_requests qr
       LEFT JOIN packages p ON qr.package_id = p.id
       WHERE ${whereClause}
       ${orderClause}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )
    
    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM quote_requests qr
       LEFT JOIN packages p ON qr.package_id = p.id
       WHERE ${whereClause}`,
      params
    )
    
    return {
      orders: result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        status: row.status,
        eventDate: row.event_date?.toISOString(),
        quotedAmount: row.quoted_amount,
        totalAmount: row.total_amount,
        createdAt: row.created_at.toISOString(),
        packageName: row.package_name,
        packageSlug: row.package_slug,
        uploadCount: parseInt(row.upload_count),
        deliverableCount: parseInt(row.deliverable_count)
      })),
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    }
  }),
```

#### 10.2 Frontend Modifications

**File: `/components/admin/OrderFilters.vue`**

Enhance with additional filter options.

```vue
<!-- Location: Add new filter sections -->

<!-- Amount Range -->
<div class="grid grid-cols-2 gap-2">
  <div>
    <label class="block text-sm font-semibold text-white mb-2">Min Amount</label>
    <input
      v-model.number="localFilters.amountMin"
      @change="emitFilters"
      type="number"
      min="0"
      placeholder="$0"
      class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
    />
  </div>
  <div>
    <label class="block text-sm font-semibold text-white mb-2">Max Amount</label>
    <input
      v-model.number="localFilters.amountMax"
      @change="emitFilters"
      type="number"
      min="0"
      placeholder="No limit"
      class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
    />
  </div>
</div>

<!-- Event Date Range -->
<div class="grid grid-cols-2 gap-2">
  <div>
    <label class="block text-sm font-semibold text-white mb-2">Event From</label>
    <input
      v-model="localFilters.eventDateFrom"
      @change="emitFilters"
      type="date"
      class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
    />
  </div>
  <div>
    <label class="block text-sm font-semibold text-white mb-2">Event To</label>
    <input
      v-model="localFilters.eventDateTo"
      @change="emitFilters"
      type="date"
      class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
    />
  </div>
</div>

<!-- File Filters -->
<div class="flex gap-4">
  <label class="flex items-center gap-2 cursor-pointer">
    <input
      v-model="localFilters.hasFiles"
      @change="emitFilters"
      type="checkbox"
      class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500"
    />
    <span class="text-white text-sm">Has Uploads</span>
  </label>
  <label class="flex items-center gap-2 cursor-pointer">
    <input
      v-model="localFilters.hasDeliverables"
      @change="emitFilters"
      type="checkbox"
      class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500"
    />
    <span class="text-white text-sm">Has Deliverables</span>
  </label>
</div>

<!-- Sort Options -->
<div class="grid grid-cols-2 gap-2">
  <div>
    <label class="block text-sm font-semibold text-white mb-2">Sort By</label>
    <select
      v-model="localFilters.sortBy"
      @change="emitFilters"
      class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
    >
      <option value="created_at">Created Date</option>
      <option value="event_date">Event Date</option>
      <option value="quoted_amount">Quote Amount</option>
      <option value="status">Status</option>
    </select>
  </div>
  <div>
    <label class="block text-sm font-semibold text-white mb-2">Order</label>
    <select
      v-model="localFilters.sortOrder"
      @change="emitFilters"
      class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
    >
      <option value="desc">Newest First</option>
      <option value="asc">Oldest First</option>
    </select>
  </div>
</div>
```

---

## 11. Dashboard Analytics Enhancements

### Problem Statement

The current dashboard shows basic stats but lacks conversion metrics, trends, and actionable insights.

### Technical Implementation

#### 11.1 Backend Modifications

**File: `/server/trpc/routers/admin.ts`**

Add enhanced analytics endpoint.

```typescript
// Location: Add to admin router

/**
 * Get dashboard analytics
 */
analytics: adminProcedure
  .input(z.object({
    period: z.enum(['7d', '30d', '90d', '1y']).default('30d')
  }).optional())
  .query(async ({ input }) => {
    const period = input?.period || '30d'
    const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period]
    
    // Quote conversion rate
    const conversionResult = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'quoted') as quoted,
        COUNT(*) FILTER (WHERE status IN ('paid', 'completed', 'delivered')) as converted
       FROM quote_requests
       WHERE created_at >= NOW() - INTERVAL '${days} days'`
    )
    
    const quoted = parseInt(conversionResult.rows[0].quoted) || 0
    const converted = parseInt(conversionResult.rows[0].converted) || 0
    const conversionRate = quoted > 0 ? ((converted / quoted) * 100).toFixed(1) : '0'
    
    // Average time to quote
    const timeToQuoteResult = await query(
      `SELECT 
        AVG(EXTRACT(EPOCH FROM (
          (SELECT MIN(changed_at) FROM order_status_history osh 
           WHERE osh.quote_id = qr.id AND osh.new_status = 'quoted')
          - qr.created_at
        )) / 3600) as avg_hours
       FROM quote_requests qr
       WHERE qr.status IN ('quoted', 'paid', 'completed', 'delivered')
       AND qr.created_at >= NOW() - INTERVAL '${days} days'`
    )
    
    const avgTimeToQuote = parseFloat(timeToQuoteResult.rows[0].avg_hours) || 0
    
    // Revenue trend (daily for last period)
    const trendResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
       FROM quote_requests
       WHERE status IN ('paid', 'completed', 'delivered')
       AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date`
    )
    
    // Top packages
    const topPackagesResult = await query(
      `SELECT 
        COALESCE(p.name, qr.service_type, 'Other') as package,
        COUNT(*) as orders,
        COALESCE(SUM(qr.total_amount), 0) as revenue
       FROM quote_requests qr
       LEFT JOIN packages p ON qr.package_id = p.id
       WHERE qr.status IN ('paid', 'completed', 'delivered')
       AND qr.created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY p.name, qr.service_type
       ORDER BY revenue DESC
       LIMIT 5`
    )
    
    // Pending actions
    const pendingResult = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'submitted') as awaiting_quote,
        COUNT(*) FILTER (WHERE status = 'quoted' AND created_at < NOW() - INTERVAL '3 days') as stale_quotes,
        COUNT(*) FILTER (WHERE status = 'paid') as ready_to_start
       FROM quote_requests`
    )
    
    return {
      period,
      conversionRate: parseFloat(conversionRate),
      quotedCount: quoted,
      convertedCount: converted,
      avgTimeToQuoteHours: Math.round(avgTimeToQuote * 10) / 10,
      revenueTrend: trendResult.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        orders: parseInt(row.orders),
        revenue: parseInt(row.revenue)
      })),
      topPackages: topPackagesResult.rows.map(row => ({
        package: row.package,
        orders: parseInt(row.orders),
        revenue: parseInt(row.revenue)
      })),
      pendingActions: {
        awaitingQuote: parseInt(pendingResult.rows[0].awaiting_quote),
        staleQuotes: parseInt(pendingResult.rows[0].stale_quotes),
        readyToStart: parseInt(pendingResult.rows[0].ready_to_start)
      }
    }
  }),
```

#### 11.2 Frontend Modifications

**File: `/pages/admin/dashboard.vue`**

Add analytics section.

```vue
<!-- Location: Add after existing stats cards -->

<!-- Analytics Section -->
<div class="card p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-bold text-white">Performance Analytics</h2>
    <select 
      v-model="analyticsPeriod"
      @change="fetchAnalytics"
      class="px-4 py-2 bg-dark-secondary border border-white/10 rounded-lg text-white"
    >
      <option value="7d">Last 7 Days</option>
      <option value="30d">Last 30 Days</option>
      <option value="90d">Last 90 Days</option>
      <option value="1y">Last Year</option>
    </select>
  </div>
  
  <!-- Key Metrics -->
  <div class="grid md:grid-cols-3 gap-6 mb-8">
    <div class="p-4 rounded-lg bg-dark-secondary">
      <p class="text-slate-400 text-sm mb-1">Quote Conversion Rate</p>
      <p class="text-3xl font-bold text-white">{{ analytics.conversionRate }}%</p>
      <p class="text-sm text-slate-500">{{ analytics.convertedCount }} of {{ analytics.quotedCount }} quotes</p>
    </div>
    <div class="p-4 rounded-lg bg-dark-secondary">
      <p class="text-slate-400 text-sm mb-1">Avg Time to Quote</p>
      <p class="text-3xl font-bold text-white">{{ analytics.avgTimeToQuoteHours }}h</p>
      <p class="text-sm text-slate-500">From submission to quote</p>
    </div>
    <div class="p-4 rounded-lg bg-dark-secondary">
      <p class="text-slate-400 text-sm mb-1">Pending Actions</p>
      <div class="flex gap-4 mt-2">
        <div>
          <p class="text-xl font-bold text-yellow-400">{{ analytics.pendingActions?.awaitingQuote }}</p>
          <p class="text-xs text-slate-500">Need Quote</p>
        </div>
        <div>
          <p class="text-xl font-bold text-red-400">{{ analytics.pendingActions?.staleQuotes }}</p>
          <p class="text-xs text-slate-500">Stale Quotes</p>
        </div>
        <div>
          <p class="text-xl font-bold text-green-400">{{ analytics.pendingActions?.readyToStart }}</p>
          <p class="text-xs text-slate-500">Ready</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Revenue Chart -->
  <div class="mb-8">
    <h3 class="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
    <div class="h-64">
      <canvas ref="revenueChartRef"></canvas>
    </div>
  </div>
  
  <!-- Top Packages -->
  <div>
    <h3 class="text-lg font-semibold text-white mb-4">Top Packages</h3>
    <div class="space-y-3">
      <div 
        v-for="pkg in analytics.topPackages" 
        :key="pkg.package"
        class="flex items-center justify-between p-3 rounded-lg bg-dark-secondary"
      >
        <span class="text-white">{{ pkg.package }}</span>
        <div class="text-right">
          <span class="text-white font-bold">{{ formatPrice(pkg.revenue) }}</span>
          <span class="text-slate-400 text-sm ml-2">({{ pkg.orders }} orders)</span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- In script section -->
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const analyticsPeriod = ref('30d')
const analytics = ref({
  conversionRate: 0,
  quotedCount: 0,
  convertedCount: 0,
  avgTimeToQuoteHours: 0,
  revenueTrend: [],
  topPackages: [],
  pendingActions: { awaitingQuote: 0, staleQuotes: 0, readyToStart: 0 }
})
const revenueChartRef = ref(null)
let revenueChart = null

async function fetchAnalytics() {
  try {
    analytics.value = await trpc.admin.analytics.query({ period: analyticsPeriod.value })
    updateRevenueChart()
  } catch (err) {
    console.error('Failed to fetch analytics:', err)
  }
}

function updateRevenueChart() {
  if (revenueChart) {
    revenueChart.destroy()
  }
  
  if (!revenueChartRef.value) return
  
  const ctx = revenueChartRef.value.getContext('2d')
  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: analytics.value.revenueTrend.map(d => d.date),
      datasets: [{
        label: 'Revenue',
        data: analytics.value.revenueTrend.map(d => d.revenue / 100),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => '$' + value
          }
        }
      }
    }
  })
}

onMounted(() => {
  fetchAnalytics()
})
```

---

## 12. Automated Quote Reminders

### Problem Statement

There's no automated system to remind customers about unpaid quotes or admins about pending orders.

### Technical Implementation

#### 12.1 Backend Modifications

**New File: `/server/tasks/quote-reminders.ts`**

Create scheduled task for reminders.

```typescript
import { query } from '../db/connection'
import { sendQuoteReminderEmail, sendAdminReminderEmail } from '../utils/email'
import { logger } from '../utils/logger'

/**
 * Send reminders for stale quotes
 * Run daily via cron job
 */
export async function sendQuoteReminders() {
  logger.info('Starting quote reminder task')
  
  // Find quotes that are 3 days old without response
  const staleQuotesResult = await query(
    `SELECT 
      qr.id,
      qr.contact_name,
      qr.contact_email,
      qr.quoted_amount,
      qr.created_at,
      p.name as package_name
     FROM quote_requests qr
     LEFT JOIN packages p ON qr.package_id = p.id
     WHERE qr.status = 'quoted'
     AND qr.created_at < NOW() - INTERVAL '3 days'
     AND qr.created_at > NOW() - INTERVAL '30 days'
     AND NOT EXISTS (
       SELECT 1 FROM email_logs el 
       WHERE el.quote_id = qr.id 
       AND el.email_type = 'quote_reminder'
       AND el.sent_at > NOW() - INTERVAL '3 days'
     )`
  )
  
  let sentCount = 0
  
  for (const quote of staleQuotesResult.rows) {
    try {
      await sendQuoteReminderEmail({
        to: quote.contact_email,
        name: quote.contact_name,
        orderId: quote.id,
        quoteAmount: quote.quoted_amount,
        packageName: quote.package_name,
        daysOld: Math.floor((Date.now() - new Date(quote.created_at).getTime()) / (1000 * 60 * 60 * 24))
      })
      sentCount++
    } catch (err) {
      logger.error('Failed to send quote reminder', { orderId: quote.id, error: err.message })
    }
  }
  
  logger.info(`Quote reminder task completed: ${sentCount} reminders sent`)
  return { sent: sentCount }
}

/**
 * Send admin notifications for pending orders
 * Run daily via cron job
 */
export async function sendAdminPendingNotifications() {
  logger.info('Starting admin notification task')
  
  // Count pending items
  const pendingResult = await query(
    `SELECT 
      COUNT(*) FILTER (WHERE status = 'submitted') as awaiting_quote,
      COUNT(*) FILTER (WHERE status = 'quoted' AND created_at < NOW() - INTERVAL '7 days') as stale_quotes,
      COUNT(*) FILTER (WHERE status = 'paid') as ready_to_start
     FROM quote_requests`
  )
  
  const pending = pendingResult.rows[0]
  
  if (pending.awaiting_quote > 0 || pending.stale_quotes > 0) {
    await sendAdminReminderEmail({
      awaitingQuote: parseInt(pending.awaiting_quote),
      staleQuotes: parseInt(pending.stale_quotes),
      readyToStart: parseInt(pending.ready_to_start)
    })
  }
  
  logger.info('Admin notification task completed')
}
```

**File: `/server/api/cron/reminders.post.ts`** (NEW)

Create cron endpoint.

```typescript
import { sendQuoteReminders, sendAdminPendingNotifications } from '../../tasks/quote-reminders'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  // Verify cron secret
  const cronSecret = getHeader(event, 'x-cron-secret')
  const config = useRuntimeConfig()
  
  if (cronSecret !== config.cronSecret) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
  
  try {
    const quoteResults = await sendQuoteReminders()
    await sendAdminPendingNotifications()
    
    return {
      success: true,
      quoteRemindersSent: quoteResults.sent
    }
  } catch (err: any) {
    logger.error('Cron job failed', err)
    throw createError({
      statusCode: 500,
      message: 'Cron job failed'
    })
  }
})
```

**File: `/server/utils/email.ts`**

Add reminder email templates.

```typescript
// Location: Add new email functions

interface QuoteReminderEmailData {
  to: string
  name: string
  orderId: number
  quoteAmount: number
  packageName: string
  daysOld: number
}

export async function sendQuoteReminderEmail(data: QuoteReminderEmailData): Promise<boolean> {
  const formattedAmount = `$${(data.quoteAmount / 100).toFixed(2)}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .quote-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b; text-align: center; }
        .price { font-size: 36px; font-weight: bold; color: #f59e0b; }
        .cta-button { display: inline-block; padding: 14px 28px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Don't Miss Out!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          
          <p>We noticed you haven't responded to your quote yet. Your custom quote for ${data.packageName} is still waiting for you!</p>
          
          <div class="quote-box">
            <p style="margin: 0; color: #64748b;">Your Quote</p>
            <div class="price">${formattedAmount}</div>
            <p style="margin: 10px 0 0 0; color: #64748b;">Order #${data.orderId}</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.APP_URL}/orders/${data.orderId}" class="cta-button">View Quote</a>
          </p>
          
          <p>This quote expires in ${30 - data.daysOld} days. Don't wait - secure your spot today!</p>
          
          <p>Questions? Just reply to this email and we'll be happy to help.</p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(
    {
      to: data.to,
      subject: `Reminder: Your Quote is Waiting - Order #${data.orderId}`,
      html
    },
    'quote_reminder',
    data,
    data.orderId
  )
}

interface AdminReminderEmailData {
  awaitingQuote: number
  staleQuotes: number
  readyToStart: number
}

export async function sendAdminReminderEmail(data: AdminReminderEmailData): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .stat-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center; }
        .stat-value { font-size: 32px; font-weight: bold; }
        .urgent { color: #ef4444; }
        .warning { color: #f59e0b; }
        .success { color: #22c55e; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Daily Admin Summary</h1>
        
        <p>Here's your daily overview of pending items:</p>
        
        <div class="stat-box">
          <span>Orders Awaiting Quote</span>
          <span class="stat-value ${data.awaitingQuote > 5 ? 'urgent' : 'warning'}">${data.awaitingQuote}</span>
        </div>
        
        <div class="stat-box">
          <span>Stale Quotes (7+ days)</span>
          <span class="stat-value ${data.staleQuotes > 0 ? 'urgent' : 'success'}">${data.staleQuotes}</span>
        </div>
        
        <div class="stat-box">
          <span>Ready to Start</span>
          <span class="stat-value success">${data.readyToStart}</span>
        </div>
        
        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.APP_URL}/admin/orders" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px;">Go to Admin Panel</a>
        </p>
      </div>
    </body>
    </html>
  `

  // Send to admin email
  return sendEmail(
    {
      to: process.env.ADMIN_EMAIL || 'admin@elitesportsdj.com',
      subject: `Daily Summary: ${data.awaitingQuote} orders need attention`,
      html
    },
    'admin_reminder',
    data
  )
}
```

---

## Summary of Files to Modify/Create

### Modified Files

| File | Changes |
|------|---------|
| `/server/trpc/routers/admin.ts` | Add payment link to quote, bulk actions, analytics, email history, quote revisions |
| `/server/trpc/routers/orders.ts` | Ad
d quote tracking, acceptance, customer order editing |
| `/server/utils/email.ts` | Enhanced quote email, revision email, reminder emails |
| `/pages/admin/orders/index.vue` | Bulk selection, enhanced filters |
| `/pages/admin/orders/[id].vue` | Payment link option, file preview, email history |
| `/pages/admin/customers.vue` | Clickable rows, navigation to detail |
| `/pages/admin/dashboard.vue` | Analytics section, charts |
| `/pages/orders/[id].vue` | Quote acceptance, order editing |
| `/components/admin/OrderFilters.vue` | Additional filter options |

### New Files

| File | Purpose |
|------|---------|
| `/database/migrations/002_quote_tracking.sql` | Quote tracking schema |
| `/database/migrations/003_quote_revisions.sql` | Quote revision history |
| `/pages/admin/customers/[email].vue` | Customer detail page |
| `/pages/orders/[id]/pay.vue` | Customer payment page |
| `/components/ui/FilePreview.vue` | File preview component |
| `/components/admin/EmailHistory.vue` | Email history component |
| `/server/tasks/quote-reminders.ts` | Automated reminder logic |
| `/server/api/cron/reminders.post.ts` | Cron endpoint for reminders |

---

## Implementation Dependencies

The following diagram shows the recommended implementation order based on dependencies:

```
Phase 1 (Foundation)
├── Database Migrations (002, 003)
├── Enhanced Email Templates
└── File Preview Component

Phase 2 (Core Quote Flow)
├── Payment Integration
├── Quote Acceptance Tracking
└── Quote Revision Workflow

Phase 3 (Admin Efficiency)
├── Customer Order Management
├── Bulk Actions
├── Enhanced Filtering
└── Email History

Phase 4 (Customer Experience)
├── Customer Order Editing
├── Dashboard Analytics
└── Automated Reminders
```

---

## Testing Recommendations

### Unit Tests

Each new backend endpoint should have corresponding unit tests covering:

1. **Happy path scenarios** - Normal operation with valid inputs
2. **Authorization checks** - Verify admin-only endpoints reject non-admin users
3. **Input validation** - Test boundary conditions and invalid inputs
4. **Error handling** - Verify appropriate error messages and codes

### Integration Tests

1. **Quote flow end-to-end** - From submission through payment
2. **Email delivery** - Verify emails are logged and sent correctly
3. **Status transitions** - Validate all allowed and disallowed transitions
4. **Bulk operations** - Test with various order combinations

### Manual Testing Checklist

| Feature | Test Case |
|---------|-----------|
| Payment Integration | Submit quote with payment link, verify email, complete payment |
| Quote Acceptance | View quote as customer, accept, verify status change |
| Bulk Actions | Select multiple orders, apply status change, verify all updated |
| File Preview | Upload various file types, verify preview works for each |
| Customer Detail | Navigate from customers list, verify order history loads |
| Order Editing | Edit order as customer, verify admin notification |
| Analytics | Change date range, verify chart updates |
| Reminders | Trigger cron job, verify emails sent |

---

## Environment Variables Required

Add the following to `.env`:

```env
# Existing (ensure configured)
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# New
CRON_SECRET=your-secure-cron-secret
ADMIN_EMAIL=admin@elitesportsdj.com
```

---

## Conclusion

This technical implementation plan provides a comprehensive roadmap for enhancing the quote submission process and user management capabilities in the Hockey_app. Each section includes:

1. **Problem Statement** - Clear description of the issue
2. **Current State Analysis** - Understanding of existing implementation
3. **Technical Implementation** - Detailed code changes with file locations
4. **Integration Points** - How changes connect to existing systems

The implementation prioritizes integrating new features into existing files and systems, maintaining codebase cohesion while delivering significant improvements to both admin and customer experiences.

**Key Benefits After Implementation:**

- **Reduced friction** in the quote-to-payment flow
- **Improved admin productivity** with bulk actions and better filtering
- **Enhanced customer experience** with self-service capabilities
- **Better visibility** into business performance with analytics
- **Automated follow-up** reducing manual work

---

*Document prepared by Development Bot*  
*Date: January 1, 2026*
