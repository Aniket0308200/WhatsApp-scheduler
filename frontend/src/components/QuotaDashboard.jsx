import React from 'react';

/**
 * QuotaDashboard
 * 
 * Displays the user's monthly message scheduling quota, usage progress,
 * remaining count, reset date, and upgrade options in a clean and modern card.
 */
export default function QuotaDashboard({ quota, onUpgrade, onRefresh, loading = false }) {
  if (!quota) {
    return (
      <div className="bg-white dark:bg-wa-dpanel rounded-2xl p-5 border border-slate-200 dark:border-wa-dbdr animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-wa-dsurf rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-slate-200 dark:bg-wa-dsurf rounded w-full mb-3"></div>
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
      label: '🌱 Free Tier',
      cls: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700',
    },
    starter: {
      label: '⚡ Starter Tier',
      cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    },
    pro: {
      label: '👑 Pro Tier',
      cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    }
  }[plan] || {
    label: `${planName}`,
    cls: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300',
  };

  // Progress bar color based on percentage
  const progressGradient = percentUsed >= 90
    ? 'bg-gradient-to-r from-rose-500 to-red-600'
    : percentUsed >= 70
    ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
    : 'bg-gradient-to-r from-emerald-500 to-teal-500';

  return (
    <div className="bg-white dark:bg-wa-dpanel rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-wa-dbdr shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden">
      {/* Decorative top accent gradient line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          isLimitReached
            ? 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500'
            : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
        }`}
      />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-wa-dbdr/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 border border-emerald-500/20 shadow-sm">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh quota status"
              className="p-2 rounded-xl text-slate-500 dark:text-wa-dmuted hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-wa-dsurf border border-transparent hover:border-slate-200 dark:hover:border-wa-dbdr transition-all"
            >
              <span className={`inline-block ${loading ? 'animate-spin' : ''}`}>🔄</span>
            </button>
          )}

          {plan !== 'pro' && onUpgrade && (
            <button
              onClick={onUpgrade}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm hover:shadow transition-all"
            >
              <span>⚡</span>
              <span>Upgrade Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        {/* Metric 1: Used */}
        <div className="bg-slate-50/80 dark:bg-wa-dsurf/60 rounded-xl p-3 sm:p-3.5 border border-slate-200/60 dark:border-wa-dbdr/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-wa-dmuted">
              Messages Used
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {used}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-wa-dmuted">
                / {monthlyLimit}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-wa-dmuted">
              {percentUsed}% capacity used
            </span>
          </div>
          <span className="text-2xl opacity-80">📨</span>
        </div>

        {/* Metric 2: Remaining */}
        <div className="bg-slate-50/80 dark:bg-wa-dsurf/60 rounded-xl p-3 sm:p-3.5 border border-slate-200/60 dark:border-wa-dbdr/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-wa-dmuted">
              Messages Left
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-xl sm:text-2xl font-black ${
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
            <span className="text-[11px] font-semibold text-slate-500 dark:text-wa-dmuted">
              {isLimitReached ? 'Quota finished' : 'Ready to schedule'}
            </span>
          </div>
          <span className="text-2xl opacity-80">{isLimitReached ? '🚫' : '⏳'}</span>
        </div>

        {/* Metric 3: Reset Date */}
        <div className="bg-slate-50/80 dark:bg-wa-dsurf/60 rounded-xl p-3 sm:p-3.5 border border-slate-200/60 dark:border-wa-dbdr/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-wa-dmuted">
              Next Reset Date
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {resetsOnFormatted}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-wa-dmuted">
              Auto-renews at 00:00 UTC
            </span>
          </div>
          <span className="text-2xl opacity-80">🗓️</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-wa-dmuted mb-1.5">
          <span>Monthly Allowance Usage</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{percentUsed}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-wa-dsurf rounded-full overflow-hidden p-0.5 border border-slate-200/70 dark:border-wa-dbdr">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${progressGradient}`}
            style={{ width: `${Math.min(100, Math.max(used > 0 ? 3 : 0, percentUsed))}%` }}
          />
        </div>
      </div>

      {/* Breakdown Chips */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-wa-dbdr/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 dark:text-wa-dmuted font-medium text-[11px]">Active breakdown:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold text-[11px]">
            ⏳ {breakdown.pending || 0} Pending
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-[11px]">
            ✓ {breakdown.sent || 0} Sent
          </span>
          {(breakdown.failed || 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold text-[11px]">
              ❌ {breakdown.failed} Failed
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-400 dark:text-wa-dmuted">
          Free plan allows up to 50 schedules / mo
        </span>
      </div>

      {/* Quota Exhausted Notice */}
      {isLimitReached && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-800 dark:text-rose-300">
          <div className="flex items-start sm:items-center gap-2.5 text-xs">
            <span className="text-base shrink-0">⚠️</span>
            <div>
              <p className="font-bold">Monthly Quota Exhausted ({monthlyLimit}/{monthlyLimit})</p>
              <p className="text-rose-700 dark:text-rose-400 text-[11px] mt-0.5">
                You have reached your 50 scheduled messages limit for this month. Quota resets on {resetsOnFormatted}.
              </p>
            </div>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-sm transition-all"
            >
              Upgrade for 250+ Messages →
            </button>
          )}
        </div>
      )}

      {/* Near Limit Notice */}
      {isNearLimit && !isLimitReached && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>You have only <strong>{remaining} message(s)</strong> left in your monthly allowance.</span>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
