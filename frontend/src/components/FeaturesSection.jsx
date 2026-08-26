import React from 'react';

const FEATURES = [
  {
    icon: '⏱️',
    title: 'Precision Time Scheduling',
    description: 'Set custom delivery date, time, and recurrence options. Ensure messages reach contacts right when they matter most.',
    badge: 'Core Feature'
  },
  {
    icon: '📇',
    title: 'Google Contacts Sync',
    description: 'Connect your Google account to automatically search and pick saved contacts without manual copy-pasting numbers.',
    badge: 'One-Click Sync'
  },
  {
    icon: '📊',
    title: 'Bulk CSV Broadcasts',
    description: 'Upload mass recipient lists via CSV or Excel sheets for campaigns, client updates, or event reminders.',
    badge: 'Mass Broadcast'
  },
  {
    icon: '🤖',
    title: 'Smart Auto-Responder',
    description: 'Trigger instant automated replies based on keywords and customer queries when offline or busy.',
    badge: 'Automation'
  },
  {
    icon: '🔒',
    title: 'End-to-End Privacy',
    description: 'Your messages and tokens are stored locally on your device with high-grade local encryption. Zero server snooping.',
    badge: '100% Private'
  },
  {
    icon: '📈',
    title: 'Live Queue & Delivery Status',
    description: 'Track scheduled, sent, pending, and failed messages with detailed logs and instant error resolution tips.',
    badge: 'Real-time'
  }
];

export default function FeaturesSection({ onGetStarted }) {
  return (
    <section id="features" className="py-12 sm:py-16 relative">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20 mb-3">
            <span>✨ Packed With Power</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Everything You Need To Automate <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-wa-teal to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-wa-green">WhatsApp Communication</span>
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-wa-dmuted leading-relaxed">
            Eliminate repetitive texting. Schedule important birthday wishes, payment reminders, marketing updates, and customer support follow-ups effortlessly.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-wa-dpanel rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-wa-dbdr shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
            >
              {/* Radial gradient background effect on hover */}
              <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-wa-dsurf flex items-center justify-center text-2xl border border-slate-200/60 dark:border-wa-dbdr group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-wa-dbdr/60 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                <button onClick={onGetStarted} className="flex items-center gap-1 focus:outline-none">
                  <span>Explore in app</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
