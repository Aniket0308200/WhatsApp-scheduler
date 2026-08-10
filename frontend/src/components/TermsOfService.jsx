import React from 'react';
import { navigateTo } from '../utils/navigation';

export default function TermsOfService() {
  return (
    <div className="w-full bg-white dark:bg-wa-dpanel rounded-2xl shadow-sm border border-slate-200 dark:border-wa-dbdr p-6 sm:p-8 transition-colors duration-200 max-w-3xl mx-auto my-6 text-slate-800 dark:text-wa-dtext">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-wa-dbdr pb-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Terms of Service</h2>
        <button
          onClick={() => navigateTo('/')}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-wa-dsurf dark:hover:bg-wa-dbdr transition-colors text-slate-600 dark:text-wa-dtext focus:outline-none"
        >
          ← Back to App
        </button>
      </div>

      <div className="space-y-6 text-sm leading-relaxed font-sans">
        <p className="text-slate-500 dark:text-wa-dmuted text-xs">
          Last Updated: August 9, 2026
        </p>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h3>
          <p>
            By accessing or using <strong>WhatsApp Scheduler</strong> (the "Service"), you agree to be bound by these Terms of Service. 
            If you do not agree to all of these terms, please do not run, deploy, or interact with this application.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">2. Description of Service</h3>
          <p>
            WhatsApp Scheduler is an open-source, self-hosted automation dashboard that allows users to connect their WhatsApp account 
            and queue up messages to be sent at specific date/time slots. The Service also offers Google Contacts integration 
            to assist in finding recipient contact names and numbers.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">3. User Responsibility & Compliance</h3>
          <p>
            You are entirely responsible for the activity that occurs under your instance deployment. 
            You agree to use this Service only for lawful purposes. You specifically agree that you will not use this Service to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 dark:text-wa-dmuted">
            <li>Send unsolicited commercial messages, spam, or mass advertisements.</li>
            <li>Harass, abuse, or threaten individuals or violate their privacy.</li>
            <li>Distribute malware, virus scripts, or other harmful programming.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">4. WhatsApp Account Security & Bans</h3>
          <p className="font-medium text-slate-900 dark:text-white">
            ⚠️ IMPORTANT NOTICE REGARDING WHATSAPP POLICY:
          </p>
          <p>
            WhatsApp, Inc. enforces strict anti-spam guidelines and restricts accounts that automate messages or send bulk communication. 
            By using this application, you acknowledge that connecting your account to an automation service violates WhatsApp's Terms of Service and carries a risk of your WhatsApp account being permanently banned or suspended. 
            The creators and distributors of WhatsApp Scheduler accept <strong>zero responsibility</strong> for any account bans or suspensions resulting from your use of this software.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">5. Google API Services</h3>
          <p>
            When utilizing Google OAuth to import Google Contacts, you agree to comply with all applicable terms, privacy constraints, 
            and guidelines set by Google. Your Google data is handled strictly as described in our Privacy Policy.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">6. Disclaimers of Warranties</h3>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. 
            WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, TIMELY, OR ERROR-FREE, OR THAT MESSAGES WILL 
            ALWAYS DELIVER SUCCESSFULLY.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">7. Limitation of Liability</h3>
          <p>
            IN NO EVENT SHALL THE DEVELOPERS OR CONTRIBUTORS OF WHATSAPP SCHEDULER BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
            CONSEQUENTIAL, OR EXEMPLARY DAMAGES (INCLUDING BUT NOT LIMITED TO LOSS OF DATA, REVENUE, ACCOUNT SUSPENSION, OR SYSTEM DOWNTIME) 
            ARISING FROM YOUR USE OR INABILITY TO USE THE SERVICE.
          </p>
        </section>
      </div>
    </div>
  );
}
