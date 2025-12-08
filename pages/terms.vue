<template>
  <div class="min-h-screen bg-dark-primary px-4 py-16">
    <div class="container max-w-4xl">
      <!-- Header -->
      <div class="text-center mb-12 space-y-4">
        <h1 class="text-5xl md:text-6xl font-bold text-white leading-tight">
          Terms of <span class="gradient-text">Service</span>
        </h1>
        <p class="text-lg text-slate-300">
          Last updated: December 8, 2025
        </p>
      </div>

      <!-- Content -->
      <div class="card p-8 md:p-10 space-y-8 text-slate-300">
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Agreement to Terms</h2>
          <p class="leading-relaxed">
            By accessing or using Elite Sports DJ Services ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Service Description</h2>
          <p class="leading-relaxed">
            Elite Sports DJ Services provides professional DJ services, player introductions, event hosting, and related entertainment services for sports events. We offer various packages tailored to meet the needs of teams, leagues, and sports organizations.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Booking and Payment</h2>
          <h3 class="text-xl font-semibold text-white mb-3">Service Requests</h3>
          <p class="leading-relaxed mb-4">
            All service requests are subject to availability and confirmation. Submitting a quote request does not guarantee service availability or constitute a binding agreement.
          </p>
          
          <h3 class="text-xl font-semibold text-white mb-3">Payment Terms</h3>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>A deposit may be required to secure your booking</li>
            <li>Full payment is typically due before or on the day of the event</li>
            <li>Payment methods accepted include credit card, bank transfer, and other methods as agreed</li>
            <li>All prices are in USD unless otherwise specified</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Cancellation and Refund Policy</h2>
          <h3 class="text-xl font-semibold text-white mb-3">Client Cancellations</h3>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
            <li><strong class="text-white">30+ days before event:</strong> Full refund minus processing fees</li>
            <li><strong class="text-white">14-29 days before event:</strong> 50% refund</li>
            <li><strong class="text-white">Less than 14 days:</strong> No refund</li>
          </ul>
          
          <h3 class="text-xl font-semibold text-white mb-3">Service Provider Cancellations</h3>
          <p class="leading-relaxed">
            If we must cancel your event, you will receive a full refund. We will make every effort to provide a replacement DJ or reschedule your event.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Client Responsibilities</h2>
          <p class="leading-relaxed mb-4">
            As a client, you agree to:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Provide accurate event information and requirements</li>
            <li>Ensure venue access and appropriate setup space</li>
            <li>Provide power outlets and any special equipment as agreed</li>
            <li>Submit player names, song selections, and other materials by agreed deadlines</li>
            <li>Notify us of any changes to event details as soon as possible</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
          <p class="leading-relaxed">
            All content on this website, including text, graphics, logos, and software, is the property of Elite Sports DJ Services or its licensors and is protected by copyright and intellectual property laws. Music played at events is licensed through appropriate performing rights organizations.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
          <p class="leading-relaxed">
            Elite Sports DJ Services shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. Our total liability shall not exceed the amount paid for the specific service in question.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Force Majeure</h2>
          <p class="leading-relaxed">
            We shall not be liable for any failure to perform our obligations due to circumstances beyond our reasonable control, including but not limited to natural disasters, acts of God, war, terrorism, labor disputes, or government restrictions.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">User Accounts</h2>
          <p class="leading-relaxed">
            When you create an account, you are responsible for maintaining the security of your account and password. You are fully responsible for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Modifications to Service</h2>
          <p class="leading-relaxed">
            We reserve the right to modify or discontinue the Service at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Governing Law</h2>
          <p class="leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Elite Sports DJ Services operates, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
          <p class="leading-relaxed">
            We reserve the right to update these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Contact Information</h2>
          <p class="leading-relaxed">
            If you have any questions about these Terms, please contact us:
          </p>
          <div class="mt-4 space-y-2">
            <p><strong class="text-white">Email:</strong> info@elitesportsdj.com</p>
            <p><strong class="text-white">Phone:</strong> (555) 123-4567</p>
          </div>
        </section>

        <!-- Back to Home -->
        <div class="pt-8 border-t border-white/10">
          <UiButton to="/" variant="outline" class="mx-auto">
            <Icon name="mdi:arrow-left" class="w-5 h-5" />
            Back to Home
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Terms of Service - Elite Sports DJ',
  description: 'Terms of Service for Elite Sports DJ Services'
})

useHead({
  title: 'Terms of Service - Elite Sports DJ Services',
  meta: [
    { name: 'description', content: 'Read the terms and conditions for using Elite Sports DJ Services.' }
  ]
})
</script>
