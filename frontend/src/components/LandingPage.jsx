import React from 'react';
import FeaturesSection from './FeaturesSection';
import HowItWorksSection from './HowItWorksSection';
import PricingSection from './PricingSection';
import FaqSection from './FaqSection';

export default function LandingPage({ onGetStarted, isConnected, waStatus, profile }) {
  return (
    <div className="w-full space-y-12 sm:space-y-16 pb-12">
      
      {/* Hero Section */}
      <section className="relative sm:pt-10 overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto px-0 sm:px-4">
          
          {/* Glassmorphic Semi-Transparent Background Container (Light & Dark Theme Adaptive) */}
          <div className="relative bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-4 sm:p-10 shadow-xl dark:shadow-2xl overflow-hidden transition-colors">
            
            {/* Glowing Ambient Radial Graphics (Subtle Bottom Accents Only) */}
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-wa-teal/10 blur-3xl pointer-events-none rounded-full" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              
              {/* Left Content */}
              <div className="lg:col-span-7 text-center lg:text-left space-y-5 sm:space-y-6">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 shadow-sm backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span>Next-Gen WhatsApp Automation Platform</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                  Schedule WhatsApp Messages <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-wa-teal via-emerald-600 to-wa-green dark:from-emerald-400 dark:via-wa-teal dark:to-wa-green bg-clip-text text-transparent">
                    Smartly & Effortlessly
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Automate message queues, sync Google Contacts instantly, broadcast bulk marketing campaigns, and auto-respond to clients — all with 100% privacy and zero hassle.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <button
                    onClick={onGetStarted}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-sm sm:text-base text-white bg-gradient-to-r from-wa-teal via-emerald-500 to-emerald-600 dark:from-emerald-500 dark:via-wa-teal dark:to-emerald-600 hover:from-emerald-600 hover:to-wa-teal shadow-lg shadow-emerald-500/25 dark:shadow-emerald-500/30 border border-emerald-400/20 dark:border-emerald-400/40 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 focus:outline-none flex items-center justify-center gap-2 tracking-wider"
                  >
                    <span>{isConnected ? 'Go to Messaging Workspace' : 'Get Started Free (No Card Needed)'}</span>
                    <span>→</span>
                  </button>

                  <a
                    href="#how-it-works"
                    className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-sm text-slate-700 dark:text-white bg-white/80 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-white/20 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 text-center focus:outline-none backdrop-blur-md"
                  >
                    How It Works
                  </a>
                </div>

                {/* Guarantee badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-500 dark:text-slate-300 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                    <span>50 Free Messages / Month</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                    <span>Local Data Encryption</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                    <span>Google Contacts Ready</span>
                  </div>
                </div>

              </div>

              {/* Right Interactive Mockup Showcase */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[340px] sm:max-w-[380px] bg-white dark:bg-wa-dpanel/90 backdrop-blur-md rounded-3xl p-5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl relative overflow-hidden group transition-transform duration-300 hover:scale-[1.02]">
                  
                  {/* Mock Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-wa-teal to-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-md">
                        WA
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">WhatsApp Scheduler Pro</h4>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {isConnected ? `Connected as ${profile?.name || 'Session Active'}` : '● Ready to Connect'}
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30">
                      Live Demo
                    </span>
                  </div>

                  {/* Mock Queue Items */}
                  <div className="space-y-3 my-4">
                    {/* Item 1 */}
                    <div className="bg-slate-50 dark:bg-wa-dsurf/80 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-white">Alex Morgan (Client)</span>
                        <span className="text-[9px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-500/30">
                          Scheduled
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                        "Hi Alex! Your monthly invoice report has been generated..."
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-400 font-mono">
                        <span>⏰ Today at 5:00 PM</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Auto-Send Queued</span>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="bg-slate-50 dark:bg-wa-dsurf/80 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-white">Marketing VIP List</span>
                        <span className="text-[9px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-200 dark:border-blue-500/30">
                          Bulk CSV Broadcast
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                        "🎉 Special Festival Offer! Use code FEST25 for discount..."
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-400 font-mono">
                        <span>👥 140 Recipients</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">Completed ✓✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Launch Button inside mockup */}
                  <button
                    onClick={onGetStarted}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Scan QR & Try Now</span>
                    <span>⚡</span>
                  </button>

                </div>
              </div>

            </div>

            {/* Social Proof / Stats Bar */}
            <div className="mt-10 sm:mt-12 p-6 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-md grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative z-10">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">1000+</div>
                <div className="text-xs text-slate-500 dark:text-slate-300 mt-1 font-semibold">Messages Scheduled</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">99.9%</div>
                <div className="text-xs text-slate-500 dark:text-slate-300 mt-1 font-semibold">Delivery Success Rate</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">100%</div>
                <div className="text-xs text-slate-500 dark:text-slate-300 mt-1 font-semibold">Local & Encrypted Privacy</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400">4.9 ★★★★★</div>
                <div className="text-xs text-slate-500 dark:text-slate-300 mt-1 font-semibold">User Rating</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Features Grid */}
      <FeaturesSection onGetStarted={onGetStarted} />

      {/* Step by Step How It Works */}
      <HowItWorksSection onGetStarted={onGetStarted} />

      {/* Pricing Plans */}
      <PricingSection onGetStarted={onGetStarted} />

      {/* FAQs */}
      <FaqSection />

      {/* Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-2 sm:px-4">
        <div className="bg-gradient-to-r from-wa-dark via-wa-teal to-emerald-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Automate Your WhatsApp Messaging?
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Join thousands of professionals, freelancers, and businesses who save hours every week using WhatsApp Scheduler. Start free today!
            </p>
            <div className="pt-4">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 rounded-xl font-extrabold text-sm sm:text-base text-slate-900 bg-white hover:bg-emerald-50 shadow-xl transition-all duration-200 transform hover:scale-[1.03] focus:outline-none"
              >
                Launch App & Connect Free →
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
