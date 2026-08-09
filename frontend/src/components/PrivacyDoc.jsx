import React from 'react';
import { navigateTo } from '../utils/navigation';

export default function PrivacyDoc() {
  return (
    <div className="w-full bg-white dark:bg-wa-dpanel rounded-2xl shadow-sm border border-slate-200 dark:border-wa-dbdr p-6 sm:p-8 transition-colors duration-200 max-w-3xl mx-auto my-6 text-slate-800 dark:text-wa-dtext">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-wa-dbdr pb-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Privacy Policy</h2>
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
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">1. Introduction</h3>
          <p>
            Welcome to <strong>WA Scheduler</strong>. We respect your privacy and are committed to protecting any information processed through this application. 
            Because this application operates locally under your own deployment, you retain control of your data. This Privacy Policy details how we interact with, retrieve, and store your information.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">2. Google API Services & OAuth Consent</h3>
          <p>
            WA Scheduler offers an optional integration to import and synchronize your Google Contacts. 
            To do this, we use Google OAuth authentication to request access to your Google Contacts via the Google People API (specifically the 
            <code>https://www.googleapis.com/auth/contacts.readonly</code> scope).
          </p>
          <div className="bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr/60 rounded-xl p-4 mt-2 space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">How we use Google User Data:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 dark:text-wa-dmuted">
              <li><strong>Contact Sync:</strong> We fetch your contacts list (names and phone numbers) to populate your contact suggestions, making it easier to select recipients when scheduling messages.</li>
              <li><strong>Local Storage only:</strong> All imported contact information is saved inside your local instance database (MongoDB/SQLite).</li>
              <li><strong>No Data Transfer or Sharing:</strong> Your contact data is <strong>never</strong> sent to our servers, shared with third parties, or used for advertising. It remains entirely on your own hosted database.</li>
            </ul>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-wa-dmuted">
            Our application's use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-wa-teal hover:underline font-medium">Google API Services User Data Policy</a>, including the Limited Use requirements.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">3. WhatsApp Data & Messaging</h3>
          <p>
            The scheduling feature utilizes an open-source WhatsApp integration library (Baileys) to connect directly with your mobile WhatsApp account via QR Code or Pairing Code. 
            All message payloads, scheduled delivery times, and chat session tokens are encrypted and handled within your local environment. Messages are delivered directly from your session to WhatsApp servers; we do not intercept or review your message contents.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">4. Data Security</h3>
          <p>
            We implement standard security practices (encryption of sensitive session data, local database access rules) to secure your scheduled tasks and credentials. 
            However, because this application runs on your host server, maintaining host security and environment variable configurations is your responsibility.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">5. Data Deletion & Revocation</h3>
          <p>
            You can revoke Google Contacts sync or delete your WhatsApp session data at any time by clicking "Disconnect" inside the application. 
            This action completely wipes the locally stored session credentials and synchronized contact details. You can also revoke Google OAuth permissions at any time via your Google Account Security settings page.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">6. Changes to this Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. We encourage users to check this page periodically for any updates or modifications.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">7. Contact Information</h3>
          <p>
            If you have any questions or concerns regarding this Privacy Policy, please contact the administrator of your local WA Scheduler deployment instance.
          </p>
        </section>
      </div>
    </div>
  );
}
