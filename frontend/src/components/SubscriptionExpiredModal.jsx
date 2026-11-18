import React from 'react';

export default function SubscriptionExpiredModal({ isOpen, onClose, onRenew, quota }) {
  if (!isOpen) return null;

  const prevPlan = quota?.previousPlan || quota?.plan || 'Starter';
  const planName = prevPlan.charAt(0).toUpperCase() + prevPlan.slice(1);

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-wa-dpanel text-slate-900 dark:text-wa-dtext rounded-2xl sm:rounded-3xl shadow-2xl border border-amber-500/40 dark:border-amber-500/30 overflow-hidden relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Strip */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">⚠️</span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Subscription Expired</h3>
              <p className="text-xs text-amber-100 font-medium">Plan validity completed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold transition-colors"
            title="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 sm:gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl sm:text-2xl shrink-0">
              ⏳
            </div>
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold text-slate-900 dark:text-white block text-sm mb-0.5">
                Your {planName} Plan Has Expired
              </span>
              <span className="text-slate-600 dark:text-wa-dmuted">
                Your subscription billing cycle has concluded. Your account has temporarily reverted to the <strong>Free Tier (50 msgs/month)</strong>.
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Included with plan renewal:
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>250 to Unlimited High-Speed Scheduled Messages</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Full Media Support (Images, Videos, Documents & Voice Audio)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Bulk Broadcasting to Multiple Contacts & Groups</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Priority Delivery Engine & VIP Dedicated Support</span>
            </div>
          </div>

          {/* Pricing Highlight Pill */}
          <div className="bg-slate-100 dark:bg-wa-dsurf rounded-2xl p-3.5 flex items-center justify-between border border-slate-200 dark:border-wa-dbdr text-xs">
            <div>
              <span className="text-slate-500 dark:text-wa-dmuted block text-[11px]">Recommended Renewal</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {planName} Plan (Monthly or Yearly Offer)
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Instant Activation
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onRenew}
              className="flex-1 py-3 px-5 rounded-2xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>⚡ Renew / Upgrade Plan Now</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl font-semibold text-xs text-slate-600 dark:text-wa-dmuted hover:bg-slate-100 dark:hover:bg-wa-dsurf transition-colors"
            >
              Continue on Free (50 msgs)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
