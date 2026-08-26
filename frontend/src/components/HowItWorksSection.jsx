import React from 'react';

const STEPS = [
  {
    step: '01',
    title: 'Scan QR Code to Connect',
    description: 'Open WhatsApp on your mobile phone, navigate to Linked Devices, and scan the QR code to pair instant local API access.',
    icon: '📱',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    step: '02',
    title: 'Choose Recipients & Compose',
    description: 'Select contacts directly from your synced Google Contacts, enter mobile numbers, or upload a bulk CSV broadcast list.',
    icon: '✍️',
    color: 'from-teal-600 to-emerald-400'
  },
  {
    step: '03',
    title: 'Set Time & Auto-Deliver',
    description: 'Pick your preferred date, time, and frequency. Sit back while the app dispatches queued messages automatically on schedule.',
    icon: '🚀',
    color: 'from-emerald-400 to-wa-green'
  }
];

export default function HowItWorksSection({ onGetStarted }) {
  return (
    <section id="how-it-works" className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-12 sm:py-16 bg-slate-50/40 dark:bg-wa-dsurf/30 backdrop-blur-[2px] border-y border-slate-200/60 dark:border-wa-dbdr/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20 mb-3 backdrop-blur-sm">
            <span>⚡ 3 Easy Steps</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How WhatsApp Scheduler <span className="bg-gradient-to-r from-wa-teal to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-wa-green">Works</span>
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-wa-dmuted">
            Get up and running in under 2 minutes. No technical expertise or complex API setup needed.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">

          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-emerald-500/20 via-wa-teal/40 to-emerald-500/20 -translate-y-6 z-0" />

          {STEPS.map((stepItem, idx) => (
            <div
              key={idx}
              className="bg-white/80 dark:bg-[#0e1519] backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-wa-dbdr shadow-md hover:shadow-xl transition-all duration-300 relative z-10 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stepItem.color} text-white flex items-center justify-center font-black text-lg shadow-md group-hover:scale-110 transition-transform`}>
                    {stepItem.step}
                  </span>
                  <span className="text-3xl">{stepItem.icon}</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {stepItem.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                  {stepItem.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-wa-dbdr/60 flex items-center justify-between text-xs text-slate-400 dark:text-wa-dmuted">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Step {idx + 1} of 3</span>
                <span>Fast Setup</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="mt-12 text-center">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-wa-teal to-emerald-500 dark:from-emerald-500 dark:to-wa-teal hover:from-emerald-600 hover:to-wa-teal shadow-lg shadow-emerald-500/25 dark:shadow-emerald-500/30 border border-emerald-400/20 dark:border-emerald-400/40 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 focus:outline-none tracking-wider"
          >
            <span>Start Step 1: Connect WhatsApp Now</span>
            <span>→</span>
          </button>
        </div>

      </div>
    </section>
  );
}
