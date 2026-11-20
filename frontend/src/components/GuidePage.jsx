import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * WhatsApp Scheduler — Comprehensive User Guide & Documentation Page
 * Pure CSS/Tailwind UI mockups matching authentic WA Scheduler brand theme.
 */
export default function GuidePage() {
  const [activeTab, setActiveTab] = useState('all');

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-wa-dtext transition-colors duration-200 pb-20">
      {/* ── Top Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-6 sm:p-10 mb-8 sm:mb-12 shadow-xl border border-emerald-500/20">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>📖</span>
            <span>Official User Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            WhatsApp Scheduler Guide
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
            Learn how to effortlessly link your WhatsApp account, sync your personal and group contacts, schedule rich media messages, and manage your subscription.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-950 font-bold text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition-all cursor-pointer"
            >
              <span>🚀</span>
              <span>Open Web Scheduler App</span>
            </Link>
            <a
              href="#step-1"
              onClick={(e) => { e.preventDefault(); scrollToSection('step-1'); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <span>↓</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Quick Sticky Table of Contents Pills ───────────────────────────── */}
      <div className="sticky top-20 z-20 bg-slate-50/90 dark:bg-wa-dbg/90 backdrop-blur-md py-2.5 mb-8 border-y border-slate-200/70 dark:border-wa-dbdr/60">
        <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1">
          {[
            { id: 'step-1', label: '1. Sign In / Account' },
            { id: 'step-2', label: '2. Connect WhatsApp' },
            { id: 'step-3', label: '3. Contacts & Groups' },
            { id: 'step-4', label: '4. Compose & Timezone' },
            { id: 'step-5', label: '5. Media, GIFs & Polls' },
            { id: 'step-6', label: '6. Tracking & Reschedule' },
            { id: 'step-7', label: '7. Pricing & UPI Upgrade' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-wa-dpanel text-slate-700 dark:text-wa-dtext border border-slate-200/80 dark:border-wa-dbdr/70 hover:border-wa-teal dark:hover:border-wa-green hover:text-wa-teal dark:hover:text-wa-green shadow-2xs transition-all cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12 sm:space-y-16">
        {/* ── STEP 1: ACCOUNT SETUP ────────────────────────────────────────── */}
        <section id="step-1" className="scroll-mt-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Instructions */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                Step 01 · Authentication
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Sign In or Create Your Account
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                Before scheduling messages, create a secure profile so your scheduled tasks, synced contacts, and quota are saved securely.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>Google 1-Tap Login:</strong> Click "Sign in with Google" to securely log in in 2 seconds without entering a password.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>Email & Password:</strong> Or enter your email and set a password to register manually.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>Data Privacy:</strong> Your login generates a secure private session token. No other user can see your messages or contacts.</span>
                </li>
              </ul>
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-wa-dsurf border border-teal-200 dark:border-teal-800/40 text-xs text-teal-900 dark:text-emerald-200 flex items-center gap-2">
                <span>💡</span>
                <span><strong>Pro Tip:</strong> Google Login automatically pulls your profile avatar for quick personalization.</span>
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
                    <span className="ml-2 text-xs font-semibold text-slate-400 dark:text-wa-dmuted">Sign In Modal Mockup</span>
                  </div>
                  <span className="text-xs font-bold text-wa-teal dark:text-wa-green">End-to-End Encrypted</span>
                </div>

                <div className="max-w-sm mx-auto space-y-3 py-2">
                  <button className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs font-bold text-slate-700 dark:text-wa-dtext flex items-center justify-center gap-2 shadow-2xs">
                    <span className="text-base">🌐</span>
                    <span>Continue with Google</span>
                  </button>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-wa-dmuted">
                    <div className="flex-1 border-t border-slate-200 dark:border-wa-dbdr" />
                    <span>OR EMAIL</span>
                    <div className="flex-1 border-t border-slate-200 dark:border-wa-dbdr" />
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      disabled
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs text-slate-400"
                    />
                    <input
                      type="password"
                      disabled
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs text-slate-400"
                    />
                  </div>

                  <button className="w-full py-2.5 rounded-xl bg-wa-green text-white font-bold text-xs shadow-xs">
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 2: CONNECT WHATSAPP ────────────────────────────────────── */}
        <section id="step-2" className="scroll-mt-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Instructions */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                Step 02 · WhatsApp Connection
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Connect Your WhatsApp Account
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                Connect your WhatsApp via Baileys multi-device engine so the scheduler can deliver your messages directly from your personal phone number.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">1.</span>
                  <span><strong>QR Code Method:</strong> Open WhatsApp on your phone → Settings / Three Dots → <strong>Linked Devices</strong> → <strong>Link a Device</strong> → Scan the QR code shown on screen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">2.</span>
                  <span><strong>Phone Pairing Code (No Camera Needed):</strong> Click the "Phone Number" tab, enter your phone number with country code, and tap the notification on your phone to enter the 8-digit code!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">3.</span>
                  <span><strong>Session Persistence:</strong> Once connected, your session stays linked 24/7 in background even when your browser or phone screen is closed.</span>
                </li>
              </ul>
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-wa-dsurf border border-teal-200 dark:border-teal-800/40 text-xs text-teal-900 dark:text-emerald-200 flex items-center gap-2">
                <span>🔒</span>
                <span><strong>Security Note:</strong> All WhatsApp authentication keys are encrypted using AES-256. No third party can read your chats.</span>
              </div>
            </div>

            {/* Right UI Mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Connect WhatsApp</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    Ready to Scan
                  </span>
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-wa-dsurf rounded-xl max-w-xs">
                  <span className="flex-1 py-1 text-center text-xs font-bold bg-white dark:bg-wa-dpanel text-emerald-700 dark:text-emerald-400 rounded-lg shadow-2xs">
                    📷 QR Code
                  </span>
                  <span className="flex-1 py-1 text-center text-xs font-medium text-slate-500 dark:text-wa-dmuted">
                    📱 Phone Number
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-wa-dsurf/50 border border-slate-200/80 dark:border-wa-dbdr/60">
                  <div className="w-32 h-32 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-wa-dbdr p-2 flex items-center justify-center shrink-0 shadow-xs">
                    <div className="w-full h-full border-2 border-dashed border-emerald-500/60 rounded-lg flex flex-col items-center justify-center text-center">
                      <span className="text-2xl">📱</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1">SCAN QR</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Point your WhatsApp camera here</h4>
                    <p className="text-[11px] text-slate-500 dark:text-wa-dmuted leading-relaxed">
                      1. Open WhatsApp on your phone<br />
                      2. Tap Linked Devices → Link a device<br />
                      3. Scan this QR code to authenticate instantly.
                    </p>
                    <span className="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      ⚡ Automatically syncs chats upon connection
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 3: CONTACTS & GROUPS ────────────────────────────────────── */}
        <section id="step-3" className="scroll-mt-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Instructions */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                Step 03 · Contacts & Recipients
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Select Personal Contacts, Groups, or Status
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                Add one or multiple recipients to your scheduled message. The app supports individual contacts, WhatsApp Groups, and WhatsApp Status broadcast.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>Auto-Search Directory:</strong> Start typing any contact name or digits; matching contacts from your phonebook drop down automatically.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>WhatsApp Groups (`@g.us`):</strong> Target your family, team, or project groups directly by name.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>WhatsApp Status Broadcast:</strong> Select "WhatsApp Status" to schedule your story updates ahead of time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>CSV & VCF File Import:</strong> Have an existing client list? Click "Import Contacts" to batch-import contacts from Excel/CSV or vCard files.</span>
                </li>
              </ul>
            </div>

            {/* Right UI Mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-2.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-wa-dtext">
                    Recipients (Multi-Chip Selection)
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer">
                    📥 Import Contacts
                  </span>
                </div>

                {/* Chips Container */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr flex flex-wrap items-center gap-1.5 min-h-[46px]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 text-xs font-medium border border-emerald-300/60 dark:border-emerald-800/60">
                    <span>👤</span>
                    <span>Aniket Chouhan (+91 98765...)</span>
                    <span className="text-emerald-500 hover:text-emerald-700 font-bold ml-0.5">✕</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-900 dark:text-teal-200 text-xs font-medium border border-teal-300/60 dark:border-teal-800/60">
                    <span>👥</span>
                    <span>Product Core Team</span>
                    <span className="text-teal-500 hover:text-teal-700 font-bold ml-0.5">✕</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 text-xs font-medium border border-purple-300/60 dark:border-purple-800/60">
                    <span>📢</span>
                    <span>WhatsApp Status</span>
                    <span className="text-purple-500 hover:text-purple-700 font-bold ml-0.5">✕</span>
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/30 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span>⚡ 3 recipients selected (1 personal, 1 group, 1 status broadcast)</span>
                  <span className="font-bold">Quota: Safe</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 4: MESSAGE & TIMEZONE ──────────────────────────────────── */}
        <section id="step-4" className="scroll-mt-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Instructions */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                Step 04 · Compose & Schedule
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Format Message & Pick Exact Date/Time
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                Compose your message with native WhatsApp text formatting, emojis, and schedule it with timezone precision.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>WhatsApp Markdown:</strong> Supports <code>*bold*</code>, <code>_italic_</code>, <code>~strikethrough~</code>, and <code>```monospace```</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>Smart Name Personalization:</strong> Insert <code>&#123;Name&#125;</code> or <code>&#123;FirstName&#125;</code> to dynamically greet each recipient by their saved contact name!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>Global Timezone Conversion:</strong> Choose your local timezone (e.g. Asia/Kolkata, UTC, US/Eastern) — the backend calculates exact delivery wall-clock time automatically.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">✓</span>
                  <span><strong>1-Click Quick Time Offsets:</strong> Tap <code>+15m</code>, <code>+30m</code>, <code>+1h</code>, or <code>Tomorrow 9:00 AM</code> to set the timer in one tap.</span>
                </li>
              </ul>
            </div>

            {/* Right UI Mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-3.5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-wa-dtext">
                      Message Content
                    </label>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-wa-dsurf font-bold text-slate-600 dark:text-wa-dtext">*B*</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-wa-dsurf italic text-slate-600 dark:text-wa-dtext">_I_</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-wa-dsurf line-through text-slate-600 dark:text-wa-dtext">~S~</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs text-slate-700 dark:text-wa-dtext font-sans leading-relaxed">
                    Hello *&#123;FirstName&#125;*! 👋<br />
                    Just a quick reminder regarding tomorrow's scheduled session. Looking forward to connecting! 🚀
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-wa-dbdr/50 pt-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-wa-dtext flex items-center justify-between">
                    <span>Schedule Date & Time</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Timezone: Asia/Kolkata (IST)</span>
                  </label>

                  {/* Offset Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {['+15 Mins', '+30 Mins', '+1 Hour', 'Tomorrow 9:00 AM', 'Tomorrow 6:00 PM'].map((offset, idx) => (
                      <span
                        key={offset}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${idx === 3 ? 'bg-wa-teal text-white border-wa-teal' : 'bg-slate-100 dark:bg-wa-dsurf text-slate-600 dark:text-wa-dmuted border-slate-200 dark:border-wa-dbdr'}`}
                      >
                        {offset}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 5: MEDIA, GIFS & POLLS ─────────────────────────────────── */}
        <section id="step-5" className="scroll-mt-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Instructions */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                Step 05 · Media Attachments & Polls
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Attach Photos, Videos, Documents, Stickers, GIFs & Polls
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                Supercharge your scheduled messages with all WhatsApp media types. Our built-in compression and proxy ensure flawless delivery.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">📷</span>
                  <span><strong>Photos & Image Editor:</strong> Upload JPG/PNG and use the built-in Pro photo editor to crop, draw arrows, add shapes, blur sensitive info, and insert text.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">🎥</span>
                  <span><strong>Videos & Voice Audio:</strong> Send MP4 videos or voice notes with native autoplay playback on the recipient's phone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">📄</span>
                  <span><strong>Documents & PDFs:</strong> Invoices, brochures, and contracts sent in their original uncompressed document quality.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">🏷️</span>
                  <span><strong>Native WhatsApp Stickers:</strong> Upload any image or choose from Giphy — automatically formatted as a 512×512 WebP sticker.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">🎞️</span>
                  <span><strong>Animated GIFs (Bypass ISP Block):</strong> Integrated Giphy search routed through our high-speed server proxy (0 connection reset).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">📊</span>
                  <span><strong>Interactive WhatsApp Polls:</strong> Set a poll question and up to 12 voting choices with single or multiple choice options!</span>
                </li>
              </ul>
            </div>

            {/* Right UI Mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span>📁</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Attached Media Gallery (Folders View)</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">4 items ready</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-wa-dtext">
                        <span>📷</span>
                        <span>Images</span>
                      </div>
                      <span className="text-[10px] text-slate-400">1 photo</span>
                    </div>
                    <span className="text-xs text-emerald-500 font-bold">✓</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-wa-dtext">
                        <span>🎞️</span>
                        <span>GIFs</span>
                      </div>
                      <span className="text-[10px] text-slate-400">1 animation</span>
                    </div>
                    <span className="text-xs text-emerald-500 font-bold">✓</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-wa-dtext">
                        <span>📄</span>
                        <span>Docs</span>
                      </div>
                      <span className="text-[10px] text-slate-400">1 PDF file</span>
                    </div>
                    <span className="text-xs text-emerald-500 font-bold">✓</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        <span>📊</span>
                        <span>Poll</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">3 choices</span>
                    </div>
                    <span className="text-xs text-emerald-500 font-bold">✓</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-wa-dmuted uppercase tracking-wider block">
                    Interactive Poll Preview
                  </span>
                  <p className="font-bold text-slate-800 dark:text-wa-dtext">"Which product demo time works best for you?"</p>
                  <div className="space-y-1 pt-1">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-wa-dpanel text-[11px] border border-slate-200 dark:border-wa-dbdr flex items-center justify-between">
                      <span>🔘 Friday at 11:00 AM</span>
                      <span className="text-slate-400">Option 1</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-wa-dpanel text-[11px] border border-slate-200 dark:border-wa-dbdr flex items-center justify-between">
                      <span>🔘 Saturday at 3:00 PM</span>
                      <span className="text-slate-400">Option 2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 6: TRACKING & RESCHEDULING ─────────────────────────────── */}
        <section id="step-6" className="scroll-mt-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Instructions */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                Step 06 · Tracking & In-Form Rescheduling
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Live Status & 1-Click Message Rescheduling
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                Review all your scheduled, processing, delivered, and cancelled messages in real-time. If you made a mistake in timing or content, reschedule it instantly.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">🟡</span>
                  <span><strong>Pending:</strong> Waiting for the scheduled time to arrive.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">🔵</span>
                  <span><strong>Processing:</strong> Currently transmitting through your WhatsApp connection.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">🟢</span>
                  <span><strong>Sent:</strong> Successfully delivered to the recipient with WhatsApp confirmation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-teal font-bold">✏️</span>
                  <span><strong>In-Form Rescheduling:</strong> Click <strong>✏️ Reschedule</strong> on any pending or failed message. The app smoothly scrolls to the schedule form, pre-fills all recipients, media, and text, and allows you to adjust the time or message before saving!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Cancel / Delete:</strong> Stop any pending message before it sends with a single click.</span>
                </li>
              </ul>
            </div>

            {/* Right UI Mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-2.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext">Scheduled Messages Table Mockup</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Live Real-time Updates</span>
                </div>

                <div className="space-y-2">
                  {/* Row 1 - Pending */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                      <button className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300/60 dark:border-emerald-800/60 flex items-center gap-1 shadow-2xs">
                        <span>✏️</span>
                        <span>Reschedule</span>
                      </button>
                      <button className="px-2 py-1 rounded-lg text-rose-600 hover:text-rose-700 text-xs font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Row 2 - Sent */}
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
        </section>

        {/* ── STEP 7: PRICING & UPI UPGRADE ───────────────────────────────── */}
        <section id="step-7" className="scroll-mt-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Instructions */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                Step 07 · Subscriptions & UPI Payments
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Choose a Plan & Instant UPI Activation
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed">
                Upgrade your monthly message quota and unlock unlimited media features with our transparent pricing and direct UPI QR payments.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-wa-dtext">
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">1.</span>
                  <span><strong>Select Your Plan:</strong> Choose <strong>Starter</strong> (₹199/month | ₹1,999/year) or <strong>Pro</strong> (₹499/month | ₹4,999/year with Unlimited messages).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">2.</span>
                  <span><strong>Scan Dynamic UPI QR:</strong> Use any payment app (Google Pay, PhonePe, Paytm, CRED, BHIM) to scan the generated QR code.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">3.</span>
                  <span><strong>Submit 12-digit UTR:</strong> Copy the transaction / UTR reference number from your payment app, paste it into the confirmation box, and submit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-wa-green font-bold">4.</span>
                  <span><strong>Instant Verification:</strong> Your plan and quota are activated upon verification, and a confirmation receipt is logged to your profile.</span>
                </li>
              </ul>
            </div>

            {/* Right UI Mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-wa-dbdr/50 pb-2.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext">UPI Payment & Upgrade Modal Mockup</span>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                    👑 Pro Plan Selected
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200/80 dark:border-wa-dbdr/60">
                  <div className="w-28 h-28 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-wa-dbdr p-2 flex flex-col items-center justify-center shrink-0 text-center shadow-2xs">
                    <span className="text-3xl">📱</span>
                    <span className="text-[9px] font-bold text-emerald-600 mt-1">UPI QR CODE</span>
                    <span className="text-[8px] text-slate-400 font-mono">₹499 / Month</span>
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                    <div className="text-xs font-bold text-slate-800 dark:text-wa-dtext">
                      Scan with any UPI App (GPay / PhonePe / Paytm)
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Enter 12-Digit UTR / Transaction ID
                      </label>
                      <input
                        type="text"
                        disabled
                        value="329482910384"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-wa-dpanel border border-slate-300 dark:border-wa-dbdr text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <button className="w-full py-2 rounded-lg bg-wa-green hover:bg-wa-teal text-white font-bold text-xs shadow-xs transition-colors cursor-pointer">
                      Verify & Activate Plan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-wa-dsurf text-slate-700 dark:text-wa-dtext">
                    <span className="font-bold block text-sm">Starter Plan</span>
                    <span className="text-[10px] text-slate-400">₹199 / Month · ₹1,999 / Year</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-800/60">
                    <span className="font-bold block text-sm">Pro Plan</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">₹499 / Month · Unlimited</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Bottom Help & Support Banner ───────────────────────────────────── */}
      <div className="mt-16 sm:mt-20 p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr text-center max-w-3xl mx-auto shadow-md">
        <span className="text-3xl block mb-2">💬</span>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          Still have questions or need assistance?
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted max-w-lg mx-auto">
          Our customer support team is always here to help you configure your WhatsApp connection or resolve any scheduling queries.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:aniketchouhan243@gmail.com?subject=WhatsApp%20Scheduler%20Support%20Inquiry"
            className="px-5 py-2.5 rounded-xl bg-wa-teal hover:bg-wa-teal/90 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
          >
            Email Support (aniketchouhan243@gmail.com)
          </a>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-white dark:bg-wa-dsurf border border-slate-300 dark:border-wa-dbdr text-slate-700 dark:text-wa-dtext font-semibold text-xs sm:text-sm shadow-2xs hover:bg-slate-50 dark:hover:bg-wa-dbdr/50 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
