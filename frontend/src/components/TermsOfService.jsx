import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white dark:bg-wa-dpanel rounded-2xl shadow-sm border border-slate-200 dark:border-wa-dbdr p-6 sm:p-10 transition-colors duration-200 max-w-4xl mx-auto my-6 text-slate-800 dark:text-wa-dtext">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-wa-dbdr pb-5 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-500 dark:text-wa-dmuted mt-1">
            Terms and Conditions of Use for <strong>WhatsApp Scheduler (WA Scheduler)</strong>
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
          <span><strong>Official Website:</strong> <a href="https://www.wascheduler.site" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700">https://www.wascheduler.site</a></span>
        </div>

        {/* 1. Acceptance of Terms */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing, creating an account, or utilizing <strong>WhatsApp Scheduler (WA Scheduler)</strong> available at{' '}
            <a href="https://www.wascheduler.site" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">https://www.wascheduler.site</a>{' '}
            (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you must not use or access this application.
          </p>
        </section>

        {/* 2. Description of Service */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">2. Description of Service</h2>
          <p>
            WhatsApp Scheduler provides users with tools to schedule and automate message delivery to WhatsApp contacts, manage recurring notifications, and integrate Google Contacts for easy recipient selection.
          </p>
        </section>

        {/* 3. User Conduct & Acceptable Use Policy */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">3. User Responsibilities & Acceptable Use</h2>
          <p>
            You agree to use WhatsApp Scheduler in full compliance with all applicable local, national, and international laws. Specifically, you agree NOT to:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-700 dark:text-wa-dmuted text-xs sm:text-sm">
            <li>Send bulk unsolicited commercial messages (spam) or illegal mass advertising.</li>
            <li>Harass, stalk, abuse, threaten, or violate the privacy of any third party.</li>
            <li>Distribute fraudulent content, malware, phishing links, or computer viruses.</li>
            <li>Use automated scheduling for prohibited or deceptive practices.</li>
          </ul>
        </section>

        {/* 4. WhatsApp & Third-Party Service Disclaimer */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">4. WhatsApp Service Disclaimer & Risk Acknowledgement</h2>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-amber-900 dark:text-amber-300 text-xs sm:text-sm flex items-center gap-2">
              <span>⚠️</span> Important Notice Regarding WhatsApp Policies:
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              WhatsApp, Inc. enforces strict terms regarding automated messages. By using WA Scheduler, you acknowledge that connecting third-party automation tools carries inherent risks of WhatsApp account restriction, suspension, or permanent ban. The operators and developers of <strong>WhatsApp Scheduler</strong> are not affiliated with WhatsApp Inc. and accept <strong>zero liability</strong> for any account actions taken by WhatsApp Inc.
            </p>
          </div>
        </section>

        {/* 5. Google API Services */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">5. Google API Services Compliance</h2>
          <p>
            When authenticating via Google OAuth to synchronize contacts, you agree to adhere to Google's Terms of Service and API policies. Your Google user data is handled in strict compliance with our{' '}
            <a onClick={() => navigate('/privacy-policy')} className="text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </section>

        {/* 6. Disclaimers of Warranties */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">6. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
        </section>

        {/* 7. Limitation of Liability */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">7. Limitation of Liability</h2>
          <p>
            IN NO EVENT SHALL WHATSAPP SCHEDULER, ITS OPERATORS, OR DEVELOPERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR SPECIAL DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
          </p>
        </section>

        {/* 8. Contact Information */}
        <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-wa-dbdr">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">8. Contact Information</h2>
          <p>
            If you have any questions regarding these Terms of Service, please contact us at:
          </p>
          <div className="bg-slate-100/70 dark:bg-wa-dsurf p-4 rounded-xl border border-slate-200 dark:border-wa-dbdr font-mono text-xs sm:text-sm text-slate-800 dark:text-wa-dtext space-y-1">
            <p><strong>App Name:</strong> WhatsApp Scheduler (WA Scheduler)</p>
            <p><strong>Official Site:</strong> <a href="https://www.wascheduler.site" className="text-emerald-600 dark:text-emerald-400 hover:underline">https://www.wascheduler.site</a></p>
            <p><strong>Support Email:</strong> <a href="mailto:support@wascheduler.site" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">support@wascheduler.site</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
