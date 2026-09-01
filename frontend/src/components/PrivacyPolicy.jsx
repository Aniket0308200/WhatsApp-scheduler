import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white dark:bg-wa-dpanel rounded-2xl shadow-sm border border-slate-200 dark:border-wa-dbdr p-6 sm:p-10 transition-colors duration-200 max-w-4xl mx-auto my-6 text-slate-800 dark:text-wa-dtext">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-wa-dbdr pb-5 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500 dark:text-wa-dmuted mt-1">
            Official Privacy Policy for <strong>WhatsApp Scheduler (WA Scheduler)</strong>
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-xs font-semibold px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-wa-dsurf dark:text-emerald-400 dark:hover:bg-wa-dbdr transition-colors border border-emerald-200 dark:border-emerald-800/40 focus:outline-none flex items-center gap-1.5 shadow-sm"
        >
          ← Back to Home
        </button>
      </div>

      <div className="space-y-6 text-sm leading-relaxed font-sans">
        <div className="flex flex-wrap items-center justify-between bg-slate-50 dark:bg-wa-dsurf/50 p-4 rounded-xl border border-slate-200/80 dark:border-wa-dbdr text-xs text-slate-600 dark:text-wa-dmuted gap-2">
          <span><strong>Effective Date:</strong> August 9, 2026</span>
          <span><strong>Application URL:</strong> <a href="https://www.wascheduler.site" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700">https://www.wascheduler.site</a></span>
        </div>

        {/* 1. Introduction */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">1. Introduction</h2>
          <p>
            Welcome to <strong>WhatsApp Scheduler (WA Scheduler)</strong> accessible at <a href="https://www.wascheduler.site" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">https://www.wascheduler.site</a>.
            We respect your privacy and are deeply committed to protecting any personal data processed through our application.
            This Privacy Policy explains how information (including Google account details, contact list data, and scheduled message contents) is collected, used, stored, and protected when you use our service.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">2. Information We Collect</h2>
          <p>
            WA Scheduler collects only the essential data required to perform scheduled message automation and contact selection:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-wa-dmuted text-xs sm:text-sm">
            <li>
              <strong>Google Account & Profile Data:</strong> When you connect your Google Account via Google OAuth, we receive basic authentication details such as your full name, email address, and profile picture URL to verify your identity.
            </li>
            <li>
              <strong>Google Contacts Data:</strong> With your explicit consent via the <code>https://www.googleapis.com/auth/contacts.readonly</code> scope, we retrieve your saved contacts (names and phone numbers) to populate recipient auto-suggestions in your scheduler dashboard.
            </li>
            <li>
              <strong>WhatsApp Scheduled Message Data:</strong> Recipient phone numbers, scheduled date/time, message contents, and delivery status logs required for automated message dispatch.
            </li>
            <li>
              <strong>Technical & Session Data:</strong> Authentication tokens, QR connection session identifiers, and local session preferences.
            </li>
          </ul>
        </section>

        {/* 3. How We Use Your Information */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">3. How We Use Your Information & Data Protection Guarantee</h2>
          <p>
            Your information is used strictly for core functionality within WhatsApp Scheduler:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-700 dark:text-wa-dmuted text-xs sm:text-sm">
            <li>To display recipient suggestions when you schedule messages to your Google Contacts.</li>
            <li>To queue, trigger, and deliver automated WhatsApp messages according to your specified schedules.</li>
            <li>To authenticate your user session and secure your dashboard settings.</li>
          </ul>
          
          <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4.5 my-3 space-y-2">
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
              <span>🛡️</span> Zero Data Selling & Third-Party Sharing Promise
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
              We <strong>NEVER sell, rent, trade, or transfer</strong> your personal data, Google account info, or contact list to any third parties, data brokers, or advertising networks. Your data is never used for targeting, marketing, profiling, or machine learning model training.
            </p>
          </div>
        </section>

        {/* 4. Google API Services User Data Policy Compliance */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">4. Compliance with Google API Services User Data Policy</h2>
          <p>
            WhatsApp Scheduler's use and transfer of information received from Google APIs to any other app will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-semibold underline hover:text-emerald-700"
            >
              Google API Services User Data Policy
            </a>
            , including the <strong>Limited Use</strong> requirements.
          </p>
          <div className="bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr rounded-xl p-4 space-y-2 text-xs">
            <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Key Limited Use Directives:</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-wa-dmuted">
              <li>We request only the minimum required scope (<code>contacts.readonly</code>) necessary to auto-suggest contacts.</li>
              <li>Google user data is processed solely to provide user-facing features displayed directly inside the WA Scheduler dashboard.</li>
              <li>No human reads your imported Google user data unless required for security investigations or explicitly authorized by you for troubleshooting support.</li>
            </ul>
          </div>
        </section>

        {/* 5. Data Security & Storage */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">5. Data Security & Encryption</h2>
          <p>
            We implement industry-standard administrative, physical, and technical safeguards to secure your data. Sensitive session data and Google OAuth credentials are encrypted in transit via SSL/TLS (HTTPS) and stored securely within restricted database environments. All message scheduling actions are executed directly from your connected WhatsApp instance.
          </p>
        </section>

        {/* 6. Data Deletion & OAuth Revocation */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">6. Data Control, Revocation & Deletion</h2>
          <p>
            You maintain full control over your connected accounts and stored data:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-wa-dmuted text-xs sm:text-sm">
            <li><strong>In-App Disconnect:</strong> You can disconnect your Google Account or WhatsApp session at any time directly inside the app header or settings panel, which immediately purges active tokens and cached contact lists.</li>
            <li><strong>Google Account Permissions:</strong> You can revoke WA Scheduler's access to your Google Account at any time by visiting your{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 underline"
              >
                Google Security Account Permissions
              </a>.
            </li>
            <li><strong>Data Deletion Requests:</strong> You can request a complete deletion of all associated scheduled messages and profile data by contacting our support team.</li>
          </ul>
        </section>

        {/* 7. Changes to Privacy Policy */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">7. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy periodically to reflect technological, legal, or operational updates. Any updates will be posted directly on this page with an updated "Effective Date". We encourage users to review this page regularly.
          </p>
        </section>

        {/* 8. Contact Information */}
        <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-wa-dbdr">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">8. Contact Us & Support</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please reach out to us at:
          </p>
          <div className="bg-slate-100/70 dark:bg-wa-dsurf p-4 rounded-xl border border-slate-200 dark:border-wa-dbdr font-mono text-xs sm:text-sm text-slate-800 dark:text-wa-dtext space-y-1">
            <p><strong>App Name:</strong> WhatsApp Scheduler (WA Scheduler)</p>
            <p><strong>Official Site:</strong> <a href="https://www.wascheduler.site" className="text-emerald-600 dark:text-emerald-400 hover:underline">https://www.wascheduler.site</a></p>
            <p><strong>Privacy & Support Email:</strong> <a href="mailto:support@wascheduler.site" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">support@wascheduler.site</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
