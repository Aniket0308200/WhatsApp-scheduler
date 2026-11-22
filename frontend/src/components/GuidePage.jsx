import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * WhatsApp Scheduler — Enhanced Comprehensive User Guide & Documentation Page
 * Features:
 * - Glassy glassmorphic background cards over custom wallpaper
 * - Interactive UI mockups (Tab switching for Connect, Folders, Time offsets, Pricing)
 * - Deep, step-by-step documentation covering full app lifecycle
 * - 100% WhatsApp Scheduler authentic theme (Light & Dark mode compatible)
 * - Mobile responsive layout
 */
export default function GuidePage() {
  // ── Interactive State for Mockups ──
  const [connectTab, setConnectTab] = useState('qr'); // 'qr' | 'phone'
  const [selectedTimeOffset, setSelectedTimeOffset] = useState('+15 Mins');
  const [selectedFolder, setSelectedFolder] = useState('image'); // 'image' | 'video' | 'sticker' | 'poll'
  const [selectedPlanTab, setSelectedPlanTab] = useState('pro'); // 'starter' | 'pro'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [pairingPhoneInput, setPairingPhoneInput] = useState('9876543210');
  const [hasRequestedCode, setHasRequestedCode] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-wa-dtext transition-colors duration-200 pb-24">
      {/* ── Top Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-6 sm:p-10 mb-8 sm:mb-12 shadow-2xl border border-emerald-500/30">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3.5 border border-white/10 shadow-xs">
            <span>📖</span>
            <span>Comprehensive Product Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            WhatsApp Scheduler Master Guide
          </h1>
          <p className="mt-3 text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
            A complete walkthrough of the entire WhatsApp Scheduler web application — from linking your WhatsApp account and syncing multi-source contacts, to scheduling rich media messages, live status tracking, and managing your subscription.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-bold text-xs sm:text-sm shadow-lg hover:bg-emerald-50 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🚀</span>
              <span>Launch Web Scheduler</span>
            </Link>
            <a
              href="#step-tour"
              onClick={(e) => { e.preventDefault(); scrollToSection('step-tour'); }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer border border-white/10"
            >
              <span>Explore Steps</span>
              <span>↓</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Quick Sticky Table of Contents Pills ───────────────────────────── */}
      <div
        className="sticky top-20 z-30 bg-white/70 dark:bg-[rgba(17,27,33,0.75)] backdrop-blur-[2px] mb-10 border border-white/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] rounded-[15px]"
        style={{ borderRadius: '15px', padding: '20px 20px 15px 20px' }}
      >
        <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-2 px-1">
          {[
            { id: 'step-tour', label: '🧭 App Tour & Overview' },
            { id: 'step-1', label: '1. Sign In & Profile' },
            { id: 'step-2', label: '2. Connect WhatsApp' },
            { id: 'step-3', label: '3. Contacts, Groups & Status' },
            { id: 'step-4', label: '4. Compose & Timezone' },
            { id: 'step-5', label: '5. Media, GIFs & Polls' },
            { id: 'step-6', label: '6. Tracking & Rescheduling' },
            { id: 'step-7', label: '7. Subscriptions & UPI' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/90 dark:bg-wa-dpanel/90 text-slate-700 dark:text-wa-dtext border border-slate-200/80 dark:border-wa-dbdr/80 hover:border-wa-teal dark:hover:border-wa-green hover:text-wa-teal dark:hover:text-wa-green shadow-2xs transition-all cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12 sm:space-y-16">
        {/* ── TOUR: DASHBOARD & WORKSPACE OVERVIEW ─────────────────────────── */}
        <section id="step-tour" className="scroll-mt-36">
          <div className="p-5 sm:p-8 rounded-3xl bg-white/60 dark:bg-[rgba(32,44,51,0.55)] backdrop-blur-[2px] border border-white/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Text */}
              <div className="lg:col-span-5 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                  App Tour · User Interface
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Meet the WhatsApp Scheduler Workspace
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                  When you open the web application, everything you need is organized on a unified, real-time dashboard without complex sub-menus.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-wa-dtext">Top Header Bar</h4>
                      <p className="text-xs text-slate-500 dark:text-wa-dmuted">Displays your active WhatsApp status, connected phone number, current subscription tier, and quick quota tracker.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-wa-dtext">WhatsApp Connection Panel</h4>
                      <p className="text-xs text-slate-500 dark:text-wa-dmuted">The secure gateway to link your personal WhatsApp via dynamic QR Code scan or 8-digit Phone Pairing code.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-wa-dtext">Schedule a Message Card</h4>
                      <p className="text-xs text-slate-500 dark:text-wa-dmuted">The main control studio: choose multiple recipients, format message text, attach rich media or polls, and pick exact date/time.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-wa-dtext">Live Scheduled Messages Table</h4>
                      <p className="text-xs text-slate-500 dark:text-wa-dmuted">Real-time status tracking with color-coded badges, 1-click in-form rescheduling, cancel, and deletion actions.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Mockup */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-slate-50/90 dark:bg-wa-dsurf/80 border border-slate-200/90 dark:border-wa-dbdr shadow-inner p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-wa-dbdr/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🟢</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext">WA Scheduler · Live Dashboard Tour</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold">
                      All Systems Operational
                    </span>
                  </div>

                  {/* Header Mockup */}
                  <div className="p-3 rounded-xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-wa-green text-white flex items-center justify-center text-xs font-bold">WA</div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext block">WA Scheduler</span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">🔒 End-to-End Encrypted</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        ● Connected: +91 98765...
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                        👑 Pro Plan
                      </span>
                    </div>
                  </div>

                  {/* Workspace Grid Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr space-y-1 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Input Studio</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Schedule a Message Form</p>
                      <p className="text-[11px] text-slate-500">Recipients, Media files, Polls, Time offsets</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr space-y-1 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Live Output</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Message History & Status</p>
                      <p className="text-[11px] text-slate-500">Pending, Processing, Delivered, Reschedule</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 1: AUTHENTICATION ───────────────────────────────────────── */}
        <section id="step-1" className="scroll-mt-36">
          <div className="p-5 sm:p-8 rounded-3xl bg-white/60 dark:bg-[rgba(32,44,51,0.55)] backdrop-blur-[2px] border border-white/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Instructions */}
              <div className="lg:col-span-5 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                  Step 01 · Authentication
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Sign In or Create Your Account
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                  Before scheduling messages, log in to your account. This ensures your scheduled tasks, synced phone contacts, and subscription quota are securely tied to your profile.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>1-Tap Google Sign-In:</strong> Click "Continue with Google" for instant authentication. Your Google profile name and avatar are synced automatically.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>Email & Password:</strong> Or register with your personal or business email address with encrypted credentials.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>Personal Avatar Selector:</strong> Customize your user avatar by selecting from animated presets or uploading your own photo from your device.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>Multi-Device Isolation:</strong> Your database documents are protected by strict session isolation — your scheduled messages are visible exclusively to your logged-in account.</span>
                  </li>
                </ul>

                <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-wa-dsurf/80 border border-teal-200 dark:border-teal-800/40 text-xs text-teal-900 dark:text-emerald-200 flex items-center gap-2.5 shadow-2xs">
                  <span className="text-lg">💡</span>
                  <span><strong>Automatic Session Recovery:</strong> Even if you close the browser tab or reboot your PC, your login session persists seamlessly.</span>
                </div>
              </div>

              {/* Right UI Mockup */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="w-3 h-3 rounded-full bg-green-400" />
                      <span className="ml-2 text-xs font-semibold text-slate-400 dark:text-wa-dmuted">Interactive Sign In Preview</span>
                    </div>
                    <span className="text-xs font-bold text-wa-teal dark:text-wa-green">AES-256 Protected</span>
                  </div>

                  <div className="max-w-sm mx-auto space-y-3 py-2">
                    <button className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs font-bold text-slate-700 dark:text-wa-dtext flex items-center justify-center gap-2 shadow-2xs hover:bg-slate-100 dark:hover:bg-wa-dbdr/50 transition-colors cursor-pointer">
                      <span className="text-base">🌐</span>
                      <span>Continue with Google</span>
                    </button>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-wa-dmuted">
                      <div className="flex-1 border-t border-slate-200 dark:border-wa-dbdr" />
                      <span>OR CONTINUE WITH EMAIL</span>
                      <div className="flex-1 border-t border-slate-200 dark:border-wa-dbdr" />
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                        <input
                          type="text"
                          disabled
                          value="aniket@wascheduler.site"
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs text-slate-700 dark:text-wa-dtext font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Password</label>
                        <input
                          type="password"
                          disabled
                          value="••••••••••••"
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs text-slate-700 dark:text-wa-dtext"
                        />
                      </div>
                    </div>

                    <button className="w-full py-2.5 rounded-xl bg-wa-green hover:bg-wa-teal text-white font-bold text-xs shadow-xs transition-colors cursor-pointer">
                      Sign In to Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 2: CONNECT WHATSAPP (INTERACTIVE TABS) ──────────────────── */}
        <section id="step-2" className="scroll-mt-36">
          <div className="p-5 sm:p-8 rounded-3xl bg-white/60 dark:bg-[rgba(32,44,51,0.55)] backdrop-blur-[2px] border border-white/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Instructions */}
              <div className="lg:col-span-5 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                  Step 02 · WhatsApp Connection
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Connect WhatsApp via QR or Pairing Code
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                  Our Baileys WebSocket multi-device engine links directly to your WhatsApp account — no expensive Meta Business API or developer setup required.
                </p>

                <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-wa-dsurf/70 border border-slate-200 dark:border-wa-dbdr space-y-1.5">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <span>📷</span>
                      <span>Method 1: Scan QR Code (Fastest)</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-wa-dmuted leading-relaxed">
                      1. Open WhatsApp on your mobile phone.<br />
                      2. Tap <strong>Settings</strong> (iOS) or <strong>Three Dots ⋮</strong> (Android) → <strong>Linked Devices</strong>.<br />
                      3. Tap <strong>Link a Device</strong> and point your camera at the QR code displayed on the screen.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-wa-dsurf/70 border border-slate-200 dark:border-wa-dbdr space-y-1.5">
                    <h4 className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                      <span>📱</span>
                      <span>Method 2: 8-Digit Pairing Code (No Camera)</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-wa-dmuted leading-relaxed">
                      1. Click the "Phone Number" tab in the connection card.<br />
                      2. Enter your phone number with your country code (+91, +1, etc.).<br />
                      3. Click <strong>Get Pairing Code</strong> → WhatsApp on your phone will display a notification.<br />
                      4. Tap the notification and enter the 8-digit code shown on screen!
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-wa-dsurf/80 border border-teal-200 dark:border-teal-800/40 text-xs text-teal-900 dark:text-emerald-200 flex items-center gap-2.5 shadow-2xs">
                  <span className="text-lg">⚡</span>
                  <span><strong>Auto-Reconnect Resilience:</strong> If your phone loses battery or Wi-Fi, the scheduler automatically recovers the session in the background within 8 seconds!</span>
                </div>
              </div>

              {/* Right UI Mockup (Clickable Tabs!) */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Interactive Connection Simulator</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                      Ready to Link
                    </span>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-wa-dsurf rounded-xl max-w-xs">
                    <button
                      type="button"
                      onClick={() => setConnectTab('qr')}
                      className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${connectTab === 'qr'
                          ? 'bg-white dark:bg-wa-dpanel text-emerald-700 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-500 dark:text-wa-dmuted hover:text-slate-900'
                        }`}
                    >
                      📷 QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setConnectTab('phone')}
                      className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${connectTab === 'phone'
                          ? 'bg-white dark:bg-wa-dpanel text-emerald-700 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-500 dark:text-wa-dmuted hover:text-slate-900'
                        }`}
                    >
                      📱 Phone Number
                    </button>
                  </div>

                  {/* QR Code Tab View */}
                  {connectTab === 'qr' ? (
                    <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-xl bg-slate-50 dark:bg-wa-dsurf/50 border border-slate-200/80 dark:border-wa-dbdr/60 animate-fade-in">
                      <div className="w-36 h-36 rounded-xl bg-white dark:bg-black/40 border-2 border-emerald-500/60 p-2 flex flex-col items-center justify-center shrink-0 shadow-xs relative">
                        <div className="w-full h-full border border-dashed border-emerald-400/80 rounded-lg flex flex-col items-center justify-center text-center p-1 bg-emerald-50/20">
                          <span className="text-3xl animate-pulse">📷</span>
                          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 mt-1">DYNAMIC QR CODE</span>
                          <span className="text-[8px] text-slate-400">Refreshes Every 20s</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-center sm:text-left">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Scan with your WhatsApp camera</h4>
                        <p className="text-[11px] text-slate-500 dark:text-wa-dmuted leading-relaxed">
                          WhatsApp Settings → Linked Devices → Link a Device. Scan this code to connect your account securely in seconds.
                        </p>
                        <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md">
                          <span>✓</span>
                          <span>Auto-loads profile name & picture</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Phone Number Pairing Code Tab View */
                    <div className="p-5 rounded-xl bg-slate-50 dark:bg-wa-dsurf/50 border border-slate-200/80 dark:border-wa-dbdr/60 space-y-3.5 animate-fade-in">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Enter WhatsApp Phone Number
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-2 rounded-lg bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr text-xs font-bold text-slate-700 dark:text-wa-dtext">
                            🇮🇳 +91
                          </span>
                          <input
                            type="text"
                            value={pairingPhoneInput}
                            onChange={(e) => setPairingPhoneInput(e.target.value)}
                            placeholder="Enter 10-digit number"
                            className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr text-xs font-mono font-bold text-slate-800 dark:text-wa-dtext"
                          />
                          <button
                            type="button"
                            onClick={() => setHasRequestedCode(true)}
                            className="px-4 py-2 rounded-lg bg-wa-teal hover:bg-wa-teal/90 text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Get Code
                          </button>
                        </div>
                      </div>

                      {hasRequestedCode ? (
                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                          <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
                            8-Digit Pairing Code Generated:
                          </span>
                          <div className="flex items-center justify-center gap-2 py-1 font-mono text-base font-extrabold tracking-widest text-emerald-700 dark:text-emerald-300 bg-white dark:bg-wa-dpanel rounded-lg border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                            <span>W3K9</span>
                            <span>-</span>
                            <span>7PX2</span>
                          </div>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 text-center">
                            Tap the notification received on your phone and type this code!
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 dark:text-wa-dmuted">
                          Click "Get Code" to generate your 8-digit device linking code without scanning.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 3: CONTACTS, GROUPS & STATUS ────────────────────────────── */}
        <section id="step-3" className="scroll-mt-36">
          <div className="p-5 sm:p-8 rounded-3xl bg-white/60 dark:bg-[rgba(32,44,51,0.55)] backdrop-blur-[2px] border border-white/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Instructions */}
              <div className="lg:col-span-5 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                  Step 03 · Contacts & Recipients
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Sync Contacts, Groups & Status Broadcast
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                  WhatsApp Scheduler gives you complete flexibility to target one or dozens of recipients at once with zero duplicate typing.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>Auto-Sync WhatsApp Chats:</strong> As soon as WhatsApp connects, your recent chat list and phone contacts are indexed for instant search.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>Google Contacts Sync:</strong> Connect your Google account to automatically import all your saved Gmail / Android contacts with names.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>CSV & vCard (VCF) Import:</strong> Have a marketing or customer list? Click "Import Contacts" to bulk-import CSV or phonebook .vcf files with automatic column detection.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>WhatsApp Groups (`@g.us`):</strong> Search for any group name to schedule announcements directly to the group.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>WhatsApp Status Broadcast:</strong> Select <code>status@broadcast</code> to schedule stories / status updates for your followers!</span>
                  </li>
                </ul>
              </div>

              {/* Right UI Mockup */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-2.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-wa-dtext">
                      Recipients (Multi-Chip Selection Studio)
                    </label>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer">
                      📥 Import Contacts (CSV / VCF)
                    </span>
                  </div>

                  {/* Chips Container */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr flex flex-wrap items-center gap-1.5 min-h-[50px]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 text-xs font-medium border border-emerald-300/60 dark:border-emerald-800/60">
                      <span>👤</span>
                      <span>Aniket Chouhan (+91 98765...)</span>
                      <span className="text-emerald-500 font-bold ml-0.5">✕</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-900 dark:text-teal-200 text-xs font-medium border border-teal-300/60 dark:border-teal-800/60">
                      <span>👥</span>
                      <span>VIP Clients Group</span>
                      <span className="text-teal-500 font-bold ml-0.5">✕</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 text-xs font-medium border border-purple-300/60 dark:border-purple-800/60">
                      <span>📢</span>
                      <span>WhatsApp Status</span>
                      <span className="text-purple-500 font-bold ml-0.5">✕</span>
                    </span>
                  </div>

                  {/* Dropdown Simulation */}
                  <div className="p-3 rounded-xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr space-y-1.5 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Synced Search Results Preview
                    </span>
                    <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">👤</span>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-wa-dtext">Rahul Sharma</span>
                          <span className="text-slate-400 text-[10px] ml-2">+91 94250 12345</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600">WhatsApp Contact</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 4: COMPOSE & TIMEZONE ───────────────────────────────────── */}
        <section id="step-4" className="scroll-mt-36">
          <div className="p-5 sm:p-8 rounded-3xl bg-white/60 dark:bg-[rgba(32,44,51,0.55)] backdrop-blur-[2px] border border-white/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Instructions */}
              <div className="lg:col-span-5 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                  Step 04 · Compose & Schedule
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Format Message & Timezone Precision
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                  Compose professional messages with native WhatsApp formatting, dynamic name variables, and precise timezone scheduling.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>Markdown Formatting:</strong> Use <code>*bold*</code>, <code>_italic_</code>, <code>~strikethrough~</code>, and <code>```monospace```</code>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>Smart Name Variables:</strong> Insert <code>&#123;Name&#125;</code> or <code>&#123;FirstName&#125;</code> — when sending to multiple people, each person receives their real name automatically!</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>Timezone Conversion:</strong> Select any world timezone (IST, UTC, EST, PST, Dubai, etc.). The server converts it to UTC and dispatches at the exact wall-clock second.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">✓</span>
                    <span><strong>1-Click Quick Time Offsets:</strong> Click <code>+15 Mins</code>, <code>+30 Mins</code>, <code>+1 Hour</code>, or <code>Tomorrow 9:00 AM</code> to skip manual date entry!</span>
                  </li>
                </ul>
              </div>

              {/* Right UI Mockup */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-wa-dtext">
                        Message Composer
                      </label>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-wa-dsurf font-bold text-slate-700 dark:text-wa-dtext">*B*</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-wa-dsurf italic text-slate-700 dark:text-wa-dtext">_I_</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-wa-dsurf line-through text-slate-700 dark:text-wa-dtext">~S~</span>
                        <span className="text-base cursor-pointer">😊</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs text-slate-800 dark:text-wa-dtext font-sans leading-relaxed">
                      Hello *&#123;FirstName&#125;*! 👋<br />
                      This is a scheduled reminder for our upcoming call at *3:00 PM*. Please review the attached invoice before we connect. 🚀
                    </div>
                  </div>

                  {/* Offset Chips Interactive Preview */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-wa-dbdr/50 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-wa-dtext">
                        Schedule Date & Time
                      </label>
                      <span className="text-[10px] text-emerald-600 font-bold">Selected: {selectedTimeOffset}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {['+15 Mins', '+30 Mins', '+1 Hour', 'Tomorrow 9:00 AM', 'Tomorrow 6:00 PM'].map((offset) => (
                        <button
                          key={offset}
                          type="button"
                          onClick={() => setSelectedTimeOffset(offset)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${selectedTimeOffset === offset
                              ? 'bg-wa-teal text-white border-wa-teal shadow-xs'
                              : 'bg-slate-100 dark:bg-wa-dsurf text-slate-600 dark:text-wa-dmuted border-slate-200 dark:border-wa-dbdr hover:bg-slate-200'
                            }`}
                        >
                          {offset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 5: MEDIA, GIFS, EDITOR & POLLS (INTERACTIVE FOLDERS) ───── */}
        <section id="step-5" className="scroll-mt-36">
          <div className="p-5 sm:p-8 rounded-3xl bg-white/60 dark:bg-[rgba(32,44,51,0.55)] backdrop-blur-[2px] border border-white/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Instructions */}
              <div className="lg:col-span-5 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                  Step 05 · Rich Media, Editor & Polls
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Photos, Videos, PDFs, Stickers, GIFs & Polls
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                  Support for every single native WhatsApp attachment type with built-in folder previews, in-browser photo editing, and proxy protection.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">🎨</span>
                    <span><strong>Pro Photo Editor:</strong> Crop photos, add text, draw arrows, insert shapes, or blur private numbers before sending!</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">🎥</span>
                    <span><strong>Videos & Voice Notes:</strong> Deliver MP4 videos or recorded voice audios (MP3/OGG) that play inline.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">📄</span>
                    <span><strong>Documents & PDFs:</strong> Delivered as authentic documents (uncompressed full quality).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">🏷️</span>
                    <span><strong>Native 512×512 WebP Stickers:</strong> Any image is automatically converted to WhatsApp's official sticker format.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">🎞️</span>
                    <span><strong>Animated Giphy GIFs (Proxy Protected):</strong> Live search across millions of GIFs. Our server proxy eliminates Indian ISP connection resets!</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-wa-green font-bold text-base mt-[-2px]">📊</span>
                    <span><strong>Interactive WhatsApp Polls:</strong> Set a question with 2 to 12 choices and toggle single or multiple vote rules.</span>
                  </li>
                </ul>
              </div>

              {/* Right UI Mockup (Clickable Folders Preview) */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span>📁</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Interactive Attachment Gallery Simulator</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Click Folders to Preview</span>
                  </div>

                  {/* Folder Cards (Clickable!) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'image', icon: '📷', label: 'Images', sub: '1 photo' },
                      { id: 'video', icon: '🎥', label: 'Videos', sub: '1 video' },
                      { id: 'sticker', icon: '🎞️', label: 'GIFs/Stickers', sub: '2 items' },
                      { id: 'poll', icon: '📊', label: 'Poll', sub: 'Active' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFolder(f.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${selectedFolder === f.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-wa-dsurf border-slate-200 dark:border-wa-dbdr hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-wa-dtext">
                          <span>{f.icon}</span>
                          <span>{f.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{f.sub}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Folder Preview Box */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs space-y-2">
                    {selectedFolder === 'image' && (
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-2xl border border-emerald-300 dark:border-emerald-800">
                          📷
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-wa-dtext truncate">project_banner_october.jpg</p>
                          <span className="text-[10px] text-slate-400">1.2 MB · High Resolution</span>
                          <span className="inline-block ml-2 text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                            🎨 Pro Photo Editor Ready
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedFolder === 'video' && (
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-2xl border border-teal-300 dark:border-teal-800">
                          🎥
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-wa-dtext truncate">software_walkthrough.mp4</p>
                          <span className="text-[10px] text-slate-400">8.4 MB · 1080p MP4 Autoplay</span>
                        </div>
                      </div>
                    )}
                    {selectedFolder === 'sticker' && (
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-pink-100 dark:bg-pink-950 flex items-center justify-center text-2xl border border-pink-300 dark:border-pink-800">
                          🏷️
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-wa-dtext truncate">celebration_sticker.webp</p>
                          <span className="text-[10px] text-slate-400">512×512 WebP · Native WhatsApp Sticker</span>
                        </div>
                      </div>
                    )}
                    {selectedFolder === 'poll' && (
                      <div className="space-y-1.5">
                        <p className="font-bold text-slate-800 dark:text-wa-dtext">📊 Poll Question: "Which demo slot works best?"</p>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-wa-dpanel text-[11px] border border-slate-200 dark:border-wa-dbdr flex items-center justify-between">
                          <span>🔘 Friday at 11:00 AM</span>
                          <span className="text-slate-400">Option 1</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-wa-dpanel text-[11px] border border-slate-200 dark:border-wa-dbdr flex items-center justify-between">
                          <span>🔘 Saturday at 3:00 PM</span>
                          <span className="text-slate-400">Option 2</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 6: TRACKING & RESCHEDULING ─────────────────────────────── */}
        <section id="step-6" className="scroll-mt-36">
          <div className="p-5 sm:p-8 rounded-3xl bg-white/60 dark:bg-[rgba(32,44,51,0.55)] backdrop-blur-[2px] border border-white/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Instructions */}
              <div className="lg:col-span-5 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                  Step 06 · Tracking & Rescheduling
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Real-time Status Tracking & In-Form Rescheduling
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                  Every scheduled message is monitored in real-time. If you ever set an incorrect time or want to change the text or attachment, you can reschedule it in one tap.
                </p>

                <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr space-y-1">
                    <span className="font-bold text-slate-800 dark:text-wa-dtext">Status Badges Breakdown:</span>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-wa-dmuted">
                      <li>🟡 <strong>Pending:</strong> Queued and waiting for the target time.</li>
                      <li>🔵 <strong>Processing:</strong> Currently transmitting via WebSocket.</li>
                      <li>🟢 <strong>Sent:</strong> Delivered successfully to WhatsApp recipient.</li>
                      <li>🔴 <strong>Failed:</strong> Failed delivery with exact reason and 1-click retry.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 space-y-1.5">
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <span>✏️</span>
                      <span>How In-Form Rescheduling Works:</span>
                    </h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      1. Click <strong>✏️ Reschedule</strong> on any pending or failed message in the table.<br />
                      2. The page smoothly scrolls up to the Schedule Form with an alert banner: <code>Rescheduling Message</code>.<br />
                      3. All recipients, text, attachments, and dates are prefilled.<br />
                      4. Edit anything you need, then click <strong>📅 Reschedule Message</strong> (or <strong>✕ Cancel</strong> to keep original).
                    </p>
                  </div>
                </div>
              </div>

              {/* Right UI Mockup */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-2.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Live Message Table Simulator</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">Adaptive 4s Polling</span>
                  </div>

                  <div className="space-y-2">
                    {/* Pending Message with Actions */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">+91 98765 43210</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                            🟡 Pending
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-wa-dmuted truncate max-w-xs">
                          "Meeting reminder with the team tomorrow..."
                        </p>
                        <span className="text-[10px] text-slate-400">📅 Tomorrow at 10:00 AM IST</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300/60 dark:border-emerald-800/60 flex items-center gap-1 shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer">
                          <span>✏️</span>
                          <span>Reschedule</span>
                        </button>
                        <button className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Sent Message */}
                    <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-wa-dsurf/60 border border-slate-200/70 dark:border-wa-dbdr/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-90">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Marketing Team (Group)</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                            🟢 Sent
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-wa-dmuted truncate max-w-xs">
                          "Quarterly review presentation attached..."
                        </p>
                        <span className="text-[10px] text-slate-400">Delivered today at 9:00 AM IST</span>
                      </div>

                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1">
                        ✓ Delivered
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 7: SUBSCRIPTIONS & UPI (INTERACTIVE PLAN SELECTOR) ──────── */}
        <section id="step-7" className="scroll-mt-36">
          <div className="p-5 sm:p-8 rounded-3xl bg-white/60 dark:bg-[rgba(32,44,51,0.55)] backdrop-blur-[2px] border border-white/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Instructions */}
              <div className="lg:col-span-5 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                  Step 07 · Subscriptions & UPI Payments
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Transparent Plans & Instant UPI QR Activation
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                  Upgrade your plan to unlock higher limits, bulk group broadcasts, and priority server dispatch.
                </p>

                <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr space-y-1">
                    <span className="font-bold text-slate-800 dark:text-wa-dtext">Plans Overview:</span>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-wa-dmuted">
                      <li>🆓 <strong>Free Tier:</strong> ₹0 · Basic message quota for testing.</li>
                      <li>🚀 <strong>Starter Plan:</strong> ₹199 / Month (or ₹1,999 / Year) · High quota & media.</li>
                      <li>👑 <strong>Pro Plan:</strong> ₹499 / Month (or ₹4,999 / Year) · <strong>Unlimited Messages</strong>, Groups, and VIP dispatch.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-50 dark:bg-wa-dsurf border border-teal-200 dark:border-teal-800/40 space-y-1">
                    <span className="font-bold text-teal-900 dark:text-emerald-200">How Direct UPI Payment Works:</span>
                    <p className="text-xs text-teal-800 dark:text-emerald-300 leading-relaxed">
                      1. Scan the dynamic UPI QR with GPay, PhonePe, Paytm, or CRED.<br />
                      2. Complete the payment and copy the 12-digit UTR transaction ID.<br />
                      3. Enter the UTR in the box and click submit — your plan activates upon instant verification!
                    </p>
                  </div>
                </div>
              </div>

              {/* Right UI Mockup (Interactive Plan / Billing Switcher!) */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-2.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Interactive Upgrade Studio</span>
                    {/* Monthly / Yearly Toggle */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-wa-dsurf rounded-lg text-[10px]">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${billingCycle === 'monthly' ? 'bg-white dark:bg-wa-dpanel text-emerald-700 dark:text-emerald-300 shadow-2xs' : 'text-slate-400'
                          }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${billingCycle === 'yearly' ? 'bg-white dark:bg-wa-dpanel text-emerald-700 dark:text-emerald-300 shadow-2xs' : 'text-slate-400'
                          }`}
                      >
                        Yearly (-17%)
                      </button>
                    </div>
                  </div>

                  {/* Plan Cards Toggle */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedPlanTab('starter')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${selectedPlanTab === 'starter'
                          ? 'bg-slate-100 dark:bg-wa-dsurf border-slate-400 dark:border-wa-dtext shadow-xs'
                          : 'bg-slate-50 dark:bg-wa-dsurf/50 border-slate-200 dark:border-wa-dbdr'
                        }`}
                    >
                      <span className="font-bold block text-xs text-slate-900 dark:text-white">Starter Plan</span>
                      <span className="text-[10px] text-slate-400">
                        {billingCycle === 'yearly' ? '₹1,999 / Year' : '₹199 / Month'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlanTab('pro')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${selectedPlanTab === 'pro'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-wa-dsurf/50 border-slate-200 dark:border-wa-dbdr'
                        }`}
                    >
                      <span className="font-bold block text-xs text-emerald-900 dark:text-emerald-200">👑 Pro Plan</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {billingCycle === 'yearly' ? '₹4,999 / Year · Unlimited' : '₹499 / Month · Unlimited'}
                      </span>
                    </button>
                  </div>

                  {/* Dynamic QR Box according to plan */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200/80 dark:border-wa-dbdr/60">
                    <div className="w-28 h-28 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-wa-dbdr p-2 flex flex-col items-center justify-center shrink-0 text-center shadow-2xs">
                      <span className="text-3xl">📱</span>
                      <span className="text-[9px] font-bold text-emerald-600 mt-1">UPI QR CODE</span>
                      <span className="text-[9px] font-mono text-slate-500 font-bold">
                        {selectedPlanTab === 'starter'
                          ? billingCycle === 'yearly' ? '₹1,999' : '₹199'
                          : billingCycle === 'yearly' ? '₹4,999' : '₹499'}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                      <div className="text-xs font-bold text-slate-800 dark:text-wa-dtext">
                        Scan with GPay / PhonePe / Paytm / BHIM
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Enter 12-Digit UTR Transaction ID
                        </label>
                        <input
                          type="text"
                          disabled
                          value="329482910384"
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-wa-dpanel border border-slate-300 dark:border-wa-dbdr text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                      <button className="w-full py-2 rounded-lg bg-wa-green hover:bg-wa-teal text-white font-bold text-xs shadow-xs transition-colors cursor-pointer">
                        Verify & Activate {selectedPlanTab === 'pro' ? 'Pro' : 'Starter'} Plan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Bottom Help & Support Banner ───────────────────────────────────── */}
      <div className="mt-16 sm:mt-20 p-6 sm:p-8 rounded-3xl bg-white/60 dark:bg-[rgba(32,44,51,0.55)] backdrop-blur-[2px] border border-white/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-center max-w-3xl mx-auto">
        <span className="text-3xl block mb-2">💬</span>
        <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
          Still have questions or need assistance?
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted max-w-lg mx-auto">
          Our dedicated priority support team is always ready to assist you with WhatsApp linking, contact import, or payment approvals.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:support@wascheduler.site?subject=WhatsApp%20Scheduler%20Support%20Inquiry"
            className="px-5 py-2.5 rounded-xl bg-wa-teal hover:bg-wa-teal/90 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            Email Support (support@wascheduler.site)
          </a>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-white dark:bg-wa-dsurf border border-slate-300 dark:border-wa-dbdr text-slate-700 dark:text-wa-dtext font-semibold text-xs sm:text-sm shadow-2xs hover:bg-slate-50 dark:hover:bg-wa-dbdr/50 transition-all cursor-pointer"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
