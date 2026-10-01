import React from 'react';

/**
 * Clean SVG Icons to replace emojis & prevent box characters
 */
const ChartBarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4", spinning = false }) => (
  <svg
    className={`${className} ${spinning ? 'animate-spin' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const SendIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const ClockCheckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const LightningIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const AlertTriangleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const InfoCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

export default function QuotaDashboard({ quota, onUpgrade, onRefresh, loading = false }) {
  if (!quota) {
    return (
      <div className="bg-white dark:bg-wa-dpanel rounded-2xl p-6 border border-slate-200 dark:border-wa-dbdr animate-pulse">
        <div className="h-5 bg-slate-200 dark:bg-wa-dsurf rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-slate-200 dark:bg-wa-dsurf rounded w-full mb-3"></div>
        <div className="h-4 bg-slate-200 dark:bg-wa-dsurf rounded w-1/2"></div>
      </div>
    );
  }

  const {
    plan = 'free',
    planName = 'Free Plan',
    monthlyLimit = 50,
    used = 0,
    remaining = 50,
    percentUsed = 0,
    resetsOnFormatted = 'Next Month',
    monthName = 'This Month',
    breakdown = {}
  } = quota;

  const isLimitReached = remaining <= 0;
  const isNearLimit = remaining > 0 && remaining <= 10;

  // Plan badge styling
  const planBadge = {
    free: {
      label: 'Free Tier',
      cls: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700',
    },
    starter: {
      label: 'Starter Tier',
      cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    },
    pro: {
      label: 'Pro Tier',
      cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    }
  }[plan] || {
    label: planName,
    cls: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300',
  };

  // Progress bar color based on percentage
  const progressGradient = percentUsed >= 90
    ? 'bg-gradient-to-r from-rose-500 to-red-600'
    : percentUsed >= 70
    ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
    : 'bg-gradient-to-r from-emerald-500 to-teal-500';

  return (
    <div className="bg-white dark:bg-wa-dpanel rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-wa-dbdr shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden">
      {/* Decorative top accent gradient line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          isLimitReached
            ? 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500'
            : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
        }`}
      />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-wa-dbdr/60">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
            <ChartBarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
                Monthly Scheduling Quota
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${planBadge.cls}`}>
                {planBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-wa-dmuted mt-0.5">
              Current cycle: <span className="font-semibold text-slate-700 dark:text-slate-300">{monthName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh quota status"
              className="p-2.5 rounded-xl text-slate-500 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-wa-dsurf border border-slate-200/80 dark:border-wa-dbdr transition-all"
            >
              <RefreshIcon className="w-4 h-4" spinning={loading} />
            </button>
          )}

          {plan !== 'pro' && onUpgrade && (
            <button
              onClick={onUpgrade}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm hover:shadow transition-all"
            >
              <LightningIcon className="w-4 h-4" />
              <span>Upgrade Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-5">
        {/* Metric 1: Used */}
        <div className="bg-slate-50/80 dark:bg-wa-dsurf/60 rounded-xl p-4 border border-slate-200/60 dark:border-wa-dbdr/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-wa-dmuted">
              Messages Used
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {used}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-wa-dmuted">
                / {monthlyLimit}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-wa-dmuted">
              {percentUsed}% capacity utilized
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <SendIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Remaining */}
        <div className="bg-slate-50/80 dark:bg-wa-dsurf/60 rounded-xl p-4 border border-slate-200/60 dark:border-wa-dbdr/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-wa-dmuted">
              Messages Left
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  isLimitReached
                    ? 'text-rose-600 dark:text-rose-400'
                    : isNearLimit
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {remaining}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-wa-dmuted">
                available
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-wa-dmuted">
              {isLimitReached ? 'Monthly quota finished' : 'Ready to schedule'}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isLimitReached ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            <ClockCheckIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Reset Date */}
        <div className="bg-slate-50/80 dark:bg-wa-dsurf/60 rounded-xl p-4 border border-slate-200/60 dark:border-wa-dbdr/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-wa-dmuted">
              Next Reset Date
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {resetsOnFormatted}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-wa-dmuted">
              Auto-renews at 00:00 UTC
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-wa-dmuted mb-2">
          <span>Monthly Allowance Usage</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{percentUsed}%</span>
        </div>
        <div className="h-3.5 w-full bg-slate-100 dark:bg-wa-dsurf rounded-full overflow-hidden p-0.5 border border-slate-200/70 dark:border-wa-dbdr">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${progressGradient}`}
            style={{ width: `${Math.min(100, Math.max(used > 0 ? 3 : 0, percentUsed))}%` }}
          />
        </div>
      </div>

      {/* Breakdown Chips */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-wa-dbdr/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 dark:text-wa-dmuted font-medium text-[11px]">Active breakdown:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {breakdown.pending || 0} Pending
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {breakdown.sent || 0} Sent
          </span>
          {(breakdown.failed || 0) > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {breakdown.failed} Failed
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-500 dark:text-wa-dmuted">
          Free plan allows up to 50 schedules / month
        </span>
      </div>

      {/* Quota Exhausted Notice */}
      {isLimitReached && (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-800 dark:text-rose-300">
          <div className="flex items-start sm:items-center gap-3 text-xs">
            <AlertTriangleIcon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="font-bold">Monthly Quota Exhausted ({monthlyLimit}/{monthlyLimit})</p>
              <p className="text-rose-700 dark:text-rose-400 text-[11px] mt-0.5">
                You have reached your 50 scheduled messages limit for this month. Quota will auto-renew on {resetsOnFormatted}.
              </p>
            </div>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-sm transition-all"
            >
              Upgrade for 250+ Messages →
            </button>
          )}
        </div>
      )}

      {/* Near Limit Notice */}
      {isNearLimit && !isLimitReached && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <InfoCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>You have only <strong>{remaining} message(s)</strong> left in your monthly allowance.</span>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
