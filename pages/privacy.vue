<template>
  <div class="min-h-screen bg-dark-primary px-4 py-16">
    <div class="container max-w-4xl">
      <!-- Header -->
      <div class="text-center mb-12 space-y-4">
        <h1 class="text-5xl md:text-6xl font-bold text-white leading-tight">
          Privacy <span class="gradient-text">Policy</span>
        </h1>
        <p class="text-lg text-slate-300">
          Last updated: December 8, 2025
        </p>
      </div>

      <!-- Content -->
      <div class="card p-8 md:p-10 space-y-8 text-slate-300">
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Introduction</h2>
          <p class="leading-relaxed">
            Elite Sports DJ Services ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Information We Collect</h2>
          <h3 class="text-xl font-semibold text-white mb-3">Personal Information</h3>
          <p class="leading-relaxed mb-4">
            We may collect personal information that you voluntarily provide to us when you:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Register for an account</li>
            <li>Request a quote or service</li>
            <li>Contact us through our website</li>
            <li>Subscribe to our newsletter</li>
          </ul>
          <p class="leading-relaxed mt-4">
            This information may include your name, email address, phone number, organization name, and event details.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
          <p class="leading-relaxed mb-4">
            We use the information we collect to:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Provide, operate, and maintain our services</li>
            <li>Process your service requests and manage your bookings</li>
            <li>Communicate with you about your inquiries and bookings</li>
            <li>Send you updates, marketing communications, and promotional materials</li>
            <li>Improve our website and services</li>
            <li>Respond to your comments and questions</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Information Sharing</h2>
          <p class="leading-relaxed">
            We do not sell, trade, or rent your personal information to third parties. We may share your information with:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4 mt-4">
            <li>Service providers who assist us in operating our website and conducting our business</li>
            <li>Law enforcement or government agencies when required by law</li>
            <li>Third parties in connection with a business transfer or merger</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Data Security</h2>
          <p class="leading-relaxed">
            We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Your Rights</h2>
          <p class="leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt-out of marketing communications</li>
            <li>Object to processing of your personal information</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Cookies and Tracking</h2>
          <p class="leading-relaxed">
            We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
          <p class="leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Contact Us</h2>
          <p class="leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us:
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
  title: 'Privacy Policy - Elite Sports DJ',
  description: 'Privacy Policy for Elite Sports DJ Services'
})

useHead({
  title: 'Privacy Policy - Elite Sports DJ Services',
  meta: [
    { name: 'description', content: 'Learn how Elite Sports DJ Services collects, uses, and protects your personal information.' }
  ]
})
</script>
