import React, { useState } from 'react';

export default function PricingSection({ onGetStarted }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  return (
    <section id="pricing" className="py-12 sm:py-16 relative">
      {/* Background glow */}
      <div className="absolute left-1/2 -translate-x-1/2 top-10 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-2 sm:px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20 mb-3">
            <span>🏷️ Simple & Transparent Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Flexible Plans for <span className="bg-gradient-to-r from-wa-teal to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-wa-green">Every Growth Stage</span>
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-wa-dmuted">
            Start completely <strong>FREE</strong> for your first 50 scheduled messages. Upgrade anytime for unlimited broadcasts, AI auto-replies, and team tools.
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 inline-flex items-center bg-slate-200/80 dark:bg-wa-dsurf p-1.5 rounded-full border border-slate-300/50 dark:border-wa-dbdr shadow-inner">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-wa-teal text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-wa-teal text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Yearly Billing</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500 text-white animate-pulse">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Card 1: Free Starter Plan */}
          <div className="bg-white dark:bg-wa-dpanel rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-wa-dbdr shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                  ⚡ 1st Time Free
                </span>
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Free Starter</h3>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted mt-1">
                Perfect for individuals testing out automated message scheduling.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
                  <span className="text-sm font-medium text-slate-500 dark:text-wa-dmuted">/ forever free</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  No credit card required
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-wa-dtext border-t border-slate-100 dark:border-wa-dbdr/60 pt-5">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>50 Messages</strong> / Month</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>1 Connected WhatsApp Account</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Google Contacts Instant Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Basic Media & Image Attachments</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Local Data Encryption & Privacy</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 line-through">
                  <span>×</span>
                  <span>Bulk CSV Broadcast Import</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 line-through">
                  <span>×</span>
                  <span>Smart AI Auto-responder</span>
                </div>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 dark:bg-wa-dsurf text-slate-800 dark:text-wa-dtext hover:bg-slate-200 dark:hover:bg-wa-dbdr border border-slate-300/60 dark:border-wa-dbdr transition-all duration-200 focus:outline-none"
            >
              Get Started Free
            </button>
          </div>

          {/* Card 2: Pro Plan (POPULAR) */}
          <div className="bg-gradient-to-b from-white to-emerald-50/30 dark:from-wa-dpanel dark:to-wa-dsurf/40 rounded-2xl p-6 sm:p-8 border-2 border-emerald-500 dark:border-emerald-400 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative group scale-[1.02]">
            {/* Most Popular Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-wa-teal to-emerald-500 text-white shadow-md">
              🔥 Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ⚡ Business Booster
                </span>
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pro Scheduler</h3>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted mt-1">
                Ideal for business owners, marketers & active automated communicators.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {billingCycle === 'monthly' ? '$12' : '$9'}
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-wa-dmuted">/ month</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  {billingCycle === 'yearly' ? 'Billed annually ($108/yr)' : 'Cancel anytime risk-free'}
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-wa-dtext border-t border-slate-200/80 dark:border-wa-dbdr pt-5">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>UNLIMITED</strong> Scheduled Messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Up to 3 Connected WhatsApp Accounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Bulk CSV & Excel</strong> Broadcast Import</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Google Contacts Auto-sync & Tags</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Smart Auto-responder Bot Triggers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Priority High-speed Message Queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Detailed Analytics & Delivery Reports</span>
                </div>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-wa-teal to-emerald-500 text-white hover:opacity-95 shadow-md shadow-emerald-500/20 transition-all duration-200 focus:outline-none"
            >
              Start 14-Day Free Trial
            </button>
          </div>

          {/* Card 3: Enterprise Plan */}
          <div className="bg-white dark:bg-wa-dpanel rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-wa-dbdr shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  ⚡ Custom Scale
                </span>
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Business / Agency</h3>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted mt-1">
                For high-volume teams requiring API integrations and dedicated support.
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {billingCycle === 'monthly' ? '$39' : '$29'}
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-wa-dmuted">/ month</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-wa-dmuted mt-1 font-semibold">
                  {billingCycle === 'yearly' ? 'Billed annually ($348/yr)' : 'Full business suite'}
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-wa-dtext border-t border-slate-100 dark:border-wa-dbdr/60 pt-5">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Everything in Pro</strong> + Unlimited Accounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Developer REST API & Webhooks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Custom AI Model Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Team Multi-user Workspaces</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Dedicated 24/7 Priority Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>SLA Guarantee 99.9% Uptime</span>
                </div>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-900 dark:bg-wa-dsurf text-white hover:bg-slate-800 dark:hover:bg-wa-dbdr transition-all duration-200 focus:outline-none"
            >
              Contact Sales / Try Free
            </button>
          </div>

        </div>

        {/* Feature comparison guarantee footer */}
        <div className="mt-12 p-4 sm:p-6 bg-slate-100/70 dark:bg-wa-dsurf/60 rounded-2xl border border-slate-200 dark:border-wa-dbdr/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">100% Risk-Free Guarantee</h4>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted">No lock-in contracts. Switch plans or cancel anytime with a single click.</p>
            </div>
          </div>
          <button
            onClick={onGetStarted}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow transition-colors shrink-0"
          >
            Claim Free Plan →
          </button>
        </div>
      </div>
    </section>
  );
}
