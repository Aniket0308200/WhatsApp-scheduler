import React from 'react';

export default function HeroSection() {
  return (
    <div className="w-full bg-white/95 dark:bg-wa-dpanel/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 dark:border-wa-dbdr p-6 sm:p-8 transition-all duration-300 relative overflow-hidden group hover:shadow-xl">
      {/* Background radial highlight */}
      <div className="absolute -right-24 -top-24 w-64 h-64 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -left-24 -bottom-24 w-64 h-64 rounded-full bg-wa-teal/10 dark:bg-wa-teal/5 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
        
        {/* Left Side: Information */}
        <div className="md:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Product Overview
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            WhatsApp <span className="bg-gradient-to-r from-wa-teal to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-wa-green">Message Scheduler</span>
          </h2>
          
          <p className="text-sm sm:text-base text-slate-600 dark:text-wa-dmuted leading-relaxed">
            Schedule your WhatsApp messages, organize automated delivery, and seamlessly sync your Google Contacts to select recipients effortlessly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-wa-dtext">
              <span className="text-emerald-500 shrink-0">✔</span>
              <span>Automated Message Queuing</span>
            </div>
            <div className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-wa-dtext">
              <span className="text-emerald-500 shrink-0">✔</span>
              <span>Google Contacts Syncing</span>
            </div>
            <div className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-wa-dtext">
              <span className="text-emerald-500 shrink-0">✔</span>
              <span>Secure Local Data Storage</span>
            </div>
            <div className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-wa-dtext">
              <span className="text-emerald-500 shrink-0">✔</span>
              <span>Real-time Connection Status</span>
            </div>
          </div>
        </div>

        {/* Right Side: Mock UI Visual */}
        <div className="md:col-span-5 flex justify-center">
          <div className="w-full max-w-[280px] bg-slate-50 dark:bg-wa-dsurf rounded-xl border border-slate-200 dark:border-wa-dbdr/80 p-4 shadow-sm relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
            {/* Mock Chat Header */}
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-wa-dbdr/60">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                JD
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext truncate">John Doe</span>
                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-semibold border border-emerald-200/50 dark:border-emerald-500/20">
                    Google Contact
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-wa-dmuted font-mono truncate block">+1 (555) 019-2834</span>
              </div>
            </div>

            {/* Mock Message Bubbles */}
            <div className="space-y-3">
              <div className="bg-white dark:bg-wa-dpanel/80 rounded-lg p-2.5 max-w-[90%] border border-slate-100 dark:border-wa-dbdr/40 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <p className="text-[11px] text-slate-700 dark:text-wa-dtext leading-normal">
                  Hi John! Just sending the automated follow-up check-in.
                </p>
                <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400 dark:text-wa-dmuted">
                  <span>10:30 AM</span>
                  <span className="text-emerald-500">✓✓</span>
                </div>
              </div>

              {/* Scheduled Queue Status Badge */}
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20 animate-pulse">
                  <span className="text-xs">📅</span>
                  <span>Scheduled Delivery Queued</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
