import React, { useState } from 'react';

export default function PricingSection({ onGetStarted }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  return (
    <section id="pricing" className="py-12 sm:py-16 relative">
      {/* Background radial glow */}
      <div className="absolute left-1/2 -translate-x-1/2 top-10 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20 mb-3 backdrop-blur-sm">
            <span>🏷️ Transparent Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Flexible Plans for <span className="bg-gradient-to-r from-wa-teal via-emerald-500 to-teal-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-wa-green">Every Automation Need</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-wa-dmuted">
            Start completely <strong>FREE</strong> with no credit card required. Upgrade anytime for higher volume queues, media attachments, and pro automation tools.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-7 inline-flex items-center bg-slate-200/80 dark:bg-wa-dsurf p-1.5 rounded-full border border-slate-300/60 dark:border-wa-dbdr shadow-inner">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Yearly Billing</span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-emerald-500 text-white animate-pulse">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

          {/* ── CARD 1: Free Plan ── */}
          <div className="bg-white dark:bg-wa-dpanel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-wa-dbdr shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  Basic
                </span>
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Free Plan</h3>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted mt-1">
                Perfect for individuals getting started with WhatsApp message scheduling.
              </p>

              {/* Price */}
              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-wa-dmuted">/ month</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  100% Free forever · No card required
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-3 text-xs text-slate-700 dark:text-wa-dtext border-t border-slate-100 dark:border-wa-dbdr/60 pt-5">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span><strong>50 Scheduled Messages</strong> / month</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Send to up to <strong>5 Contacts</strong> at once</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Send to up to <strong>2 Groups</strong> at once</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Text & Emojis support</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Connect 1 Google Account</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Basic Delivery Status</span>
                </div>

                {/* Excluded Features */}
                <div className="flex items-start gap-2.5 text-slate-400 dark:text-slate-600 line-through">
                  <span className="text-slate-300 dark:text-slate-700 font-bold shrink-0">✕</span>
                  <span>Images, Audio & Stickers support</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-400 dark:text-slate-600 line-through">
                  <span className="text-slate-300 dark:text-slate-700 font-bold shrink-0">✕</span>
                  <span>Recurring Schedules (Daily/Weekly)</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-400 dark:text-slate-600 line-through">
                  <span className="text-slate-300 dark:text-slate-700 font-bold shrink-0">✕</span>
                  <span>Smart Name Variables ({`{Name}`})</span>
                </div>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 dark:bg-wa-dsurf text-slate-800 dark:text-wa-dtext hover:bg-slate-200 dark:hover:bg-wa-dbdr border border-slate-300/60 dark:border-wa-dbdr transition-all duration-200 focus:outline-none"
            >
              Get Started Free
            </button>
          </div>

          {/* ── CARD 2: Starter Plan ($2 / month) - HIGHLIGHTED POPULAR ── */}
          <div className="bg-gradient-to-b from-white via-emerald-50/40 to-emerald-100/30 dark:from-wa-dpanel dark:via-wa-dsurf/80 dark:to-emerald-950/30 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 dark:border-emerald-400 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 flex flex-col justify-between relative group md:-translate-y-2">
            
            {/* Glowing Most Popular Tag */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-wa-teal via-emerald-500 to-teal-400 text-white shadow-lg flex items-center gap-1">
              <span>🔥</span>
              <span>Most Popular</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Most Popular
                </span>
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Starter Plan</h3>
              <p className="text-xs text-slate-600 dark:text-wa-dmuted mt-1">
                Ideal for active users needing media support & recurring schedules.
              </p>

              {/* Price */}
              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {billingCycle === 'monthly' ? '$2' : '$1.50'}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-wa-dmuted">/ month</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  {billingCycle === 'yearly' ? 'Billed annually ($18/yr)' : 'Cancel anytime · Risk-free'}
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-3 text-xs text-slate-800 dark:text-wa-dtext border-t border-emerald-200/80 dark:border-wa-dbdr pt-5">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span><strong>250 Scheduled Messages</strong> / month</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Send to up to <strong>20 Contacts</strong> at once</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Send to up to <strong>10 Groups</strong> at once</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Images, Audio & Stickers support</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Recurring Schedules (Daily / Weekly repeats)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Smart Name Variables (e.g., {`{Name}`} personalization)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Location & Contact Card Sharing</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Connect up to 2 Google Accounts</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Detailed Delivery & Failure Reports</span>
                </div>

                {/* Excluded Feature */}
                <div className="flex items-start gap-2.5 text-slate-400 dark:text-slate-600 line-through">
                  <span className="text-slate-300 dark:text-slate-700 font-bold shrink-0">✕</span>
                  <span>Video, Documents & PDF attachments</span>
                </div>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-wa-teal to-emerald-500 hover:from-emerald-600 hover:to-wa-teal text-white shadow-lg shadow-emerald-500/25 active:scale-98 transition-all duration-200 focus:outline-none"
            >
              Upgrade to Starter
            </button>
          </div>

          {/* ── CARD 3: Pro Plan ($5 / month) ── */}
          <div className="bg-white dark:bg-wa-dpanel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-wa-dbdr shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Ultimate Power
                </span>
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pro Plan</h3>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted mt-1">
                For power users, businesses & agencies requiring full automation.
              </p>

              {/* Price */}
              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {billingCycle === 'monthly' ? '$5' : '$3.75'}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-wa-dmuted">/ month</span>
                </div>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">
                  {billingCycle === 'yearly' ? 'Billed annually ($45/yr)' : 'Full pro suite access'}
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-3 text-xs text-slate-700 dark:text-wa-dtext border-t border-slate-100 dark:border-wa-dbdr/60 pt-5">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span><strong>Unlimited Scheduled Messages</strong></span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span><strong>Unlimited Contacts & Groups</strong> selection</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Video, Documents, PDF & Folder attachments</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Auto WhatsApp Status Scheduling</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>WhatsApp Poll Scheduling</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Timezone-Based Smart Scheduling</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Connect up to 5 Google Accounts</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span>Priority Delivery Queue & Advanced Analytics</span>
                </div>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 dark:bg-wa-dsurf text-white hover:bg-slate-800 dark:hover:bg-wa-dbdr border border-slate-800 dark:border-wa-dbdr transition-all duration-200 focus:outline-none"
            >
              Get Pro Access
            </button>
          </div>

        </div>

        {/* Feature guarantee footer strip */}
        <div className="mt-12 p-5 sm:p-6 bg-slate-100/70 dark:bg-wa-dsurf/60 rounded-2xl border border-slate-200 dark:border-wa-dbdr/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">100% Privacy & Encrypted Local Delivery</h4>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted">No lock-in contracts. Switch or cancel your subscription anytime with 1-click.</p>
            </div>
          </div>
          <button
            onClick={onGetStarted}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors shrink-0"
          >
            Claim Free Plan →
          </button>
        </div>
      </div>
    </section>
  );
}
