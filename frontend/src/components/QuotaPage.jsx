import React from 'react';
import QuotaDashboard from './QuotaDashboard';

export default function QuotaPage({ quota, onRefresh, loading, onNavigate, authUser, onOpenAuthModal }) {
  const currentPlan = quota?.plan || 'free';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Top Navigation Bar / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('app')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-white/80 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr px-3 py-1.5 rounded-xl shadow-xs transition-all hover:-translate-x-0.5"
          >
            <span>←</span>
            <span>Back to Scheduler</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">/</span>

          <span className="text-xs font-semibold text-slate-500 dark:text-wa-dmuted">
            Monthly Quota & Limits
          </span>
        </div>

        <button
          onClick={() => onNavigate('landing', 'pricing')}
          className="self-start sm:self-auto text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1"
        >
          <span>View All Plans & Pricing</span>
          <span>→</span>
        </button>
      </div>

      {/* Main Quota Dashboard Card */}
      <QuotaDashboard
        quota={quota}
        loading={loading}
        onUpgrade={() => onNavigate('landing', 'pricing')}
        onRefresh={onRefresh}
      />

      {/* Plan Details & Comparison Card */}
      <div className="bg-white dark:bg-wa-dpanel rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-wa-dbdr shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-wa-dbdr/60">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Available Plan Tiers & Limits
            </h3>
            <p className="text-xs text-slate-500 dark:text-wa-dmuted mt-0.5">
              Need higher scheduling volume or media attachments? Upgrade anytime.
            </p>
          </div>
          <button
            onClick={() => onNavigate('landing', 'pricing')}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-wa-dsurf hover:bg-slate-200 dark:hover:bg-wa-dbdr text-slate-800 dark:text-wa-dtext border border-slate-300/60 dark:border-wa-dbdr transition-all self-start sm:self-auto"
          >
            Compare Features
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Tier */}
          <div className={`rounded-2xl p-5 border transition-all ${
            currentPlan === 'free'
              ? 'border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-wa-dbdr bg-slate-50/50 dark:bg-wa-dsurf/40'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Free Plan
              </span>
              {currentPlan === 'free' && (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full uppercase">
                  Current Active
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white my-2">$0</div>
            <ul className="text-xs space-y-2 text-slate-600 dark:text-wa-dmuted mb-4">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>50 Scheduled Messages</strong> / month</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Up to 5 contacts at once</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Up to 2 groups at once</span>
              </li>
            </ul>
          </div>

          {/* Starter Tier */}
          <div className={`rounded-2xl p-5 border transition-all ${
            currentPlan === 'starter'
              ? 'border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-wa-dbdr bg-slate-50/50 dark:bg-wa-dsurf/40'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                Starter Plan
              </span>
              {currentPlan === 'starter' && (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full uppercase">
                  Current Active
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white my-2">$2 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
            <ul className="text-xs space-y-2 text-slate-600 dark:text-wa-dmuted mb-4">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>250 Scheduled Messages</strong> / month</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Recurring daily/weekly schedules</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Images & Audio media support</span>
              </li>
            </ul>
            <button
              onClick={() => onNavigate('landing', 'pricing')}
              className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
            >
              Upgrade to Starter
            </button>
          </div>

          {/* Pro Tier */}
          <div className={`rounded-2xl p-5 border transition-all ${
            currentPlan === 'pro'
              ? 'border-2 border-amber-500 bg-amber-50/20 dark:bg-amber-950/20'
              : 'border-slate-200 dark:border-wa-dbdr bg-slate-50/50 dark:bg-wa-dsurf/40'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                Pro Plan
              </span>
              {currentPlan === 'pro' && (
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full uppercase">
                  Current Active
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white my-2">$5 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
            <ul className="text-xs space-y-2 text-slate-600 dark:text-wa-dmuted mb-4">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>1,000 Scheduled Messages</strong> / month</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Mass CSV bulk broadcasts</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Priority queue & instant delivery</span>
              </li>
            </ul>
            <button
              onClick={() => onNavigate('landing', 'pricing')}
              className="w-full py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-all shadow-xs"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
