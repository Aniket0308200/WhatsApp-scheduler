import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { logout } from '../api';
import { useTheme } from '../ThemeContext';

const STATUS_CONFIG = {
  connected:    { label: 'Connected',     bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500',  pulse: false },
  qr_ready:     { label: 'Awaiting Auth', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-400', pulse: true  },
  connecting:   { label: 'Connecting',    bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-400',   pulse: true  },
  disconnected: { label: 'Disconnected',  bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500',    pulse: false },
};

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Sun icon for light mode
const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="5"/>
    <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

// Moon icon for dark mode
const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

// Logout icon for disconnect button
const LogoutIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function Header({ status, profile, onLogout, isSyncing }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const { dark, toggle } = useTheme();
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;
  const isConnected = status === 'connected';

  // Determine display name — prefer name, fallback to +phone
  const displayPhone = profile?.phone || null;
  const cleanPhone = displayPhone ? displayPhone.replace(/\D/g, '') : '';
  const displayName  = profile?.name && profile.name !== 'Unknown' && profile.name !== null
    ? profile.name
    : displayPhone ? `+${cleanPhone}` : null;
  const avatarLetter = displayName ? displayName.replace('+','').trim().charAt(0).toUpperCase() : '?';

  const showPhoneSubtitle = displayPhone && displayName.replace(/\D/g, '') !== cleanPhone;

  const handleLogout = async () => {
    if (!window.confirm('Disconnect WhatsApp and clear the session?')) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Disconnected from WhatsApp.');
      onLogout?.();
    } catch (err) {
      toast.error('Logout failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-wa-dark dark:bg-wa-dpanel border-b border-black/20 dark:border-wa-dbdr shadow-md transition-colors duration-200">
      <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between gap-3">

        {/* ── Logo + title ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-wa-green flex items-center justify-center shadow-sm">
            {WA_ICON}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-slate-100 leading-tight tracking-tight">WA Scheduler</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-medium select-none">
                🔒 End-to-End Encrypted
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-green-300 dark:text-wa-dmuted leading-tight mt-0.5">
              WhatsApp Message Scheduler
            </p>
            {/* Show below the subtitle on mobile */}
            <div className="sm:hidden mt-1">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-medium select-none">
                🔒 End-to-End Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* ── Connected profile pill (desktop) ─────────────────────────── */}
        {isConnected && displayName && (
          <div className="hidden sm:flex items-center gap-2.5 bg-white/10 dark:bg-wa-dsurf border border-white/10 dark:border-wa-dbdr rounded-xl px-3 py-1.5 min-w-0 flex-1 max-w-[260px]">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-wa-green flex-shrink-0 flex items-center justify-center text-slate-100 font-bold text-sm shadow-sm">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
                {displayName}
              </p>
              {showPhoneSubtitle && (
                <p className="text-[11px] text-green-300 dark:text-wa-dmuted leading-tight font-mono">
                  +{cleanPhone}
                </p>
              )}
            </div>
            {/* Online indicator */}
            <div className="flex-shrink-0 ml-auto">
              <span className="flex items-center gap-1 text-[10px] text-green-300 dark:text-green-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                online
              </span>
            </div>
          </div>
        )}

        {/* ── Right side: status + theme toggle + disconnect ────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Syncing Indicator */}
          {isConnected && isSyncing && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/25 text-blue-200 border border-blue-400/30 animate-pulse">
              <span className="w-2.5 h-2.5 border-2 border-blue-200 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="hidden sm:inline">Syncing Contacts…</span>
              <span className="inline sm:hidden">Syncing…</span>
            </span>
          )}

          {/* Status badge */}
          <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{cfg.label}</span>
          </span>

          {/* Dark/Light mode toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-1.5 rounded-full text-slate-200/70 hover:text-slate-100 hover:bg-white/10 dark:hover:bg-wa-dsurf transition-colors"
            title={dark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Disconnect */}
          {isConnected && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 dark:bg-wa-dsurf dark:hover:bg-wa-dbdr px-2.5 py-1.5 rounded-full font-medium text-slate-100 disabled:opacity-50 transition-colors"
              title="Disconnect Session"
            >
              {loggingOut ? (
                '…'
              ) : (
                <>
                  <LogoutIcon />
                  <span className="hidden sm:inline ml-0.5">Disconnect</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile profile strip ─────────────────────────────────────────── */}
      {isConnected && displayName && (
        <div className="sm:hidden bg-black/20 dark:bg-wa-dsurf/60 px-4 py-1.5 flex items-center gap-2 border-t border-black/10 dark:border-wa-dbdr">
          <div className="w-5 h-5 rounded-full bg-wa-green flex items-center justify-center text-slate-100 font-bold text-[10px] flex-shrink-0">
            {avatarLetter}
          </div>
          <span className="text-xs text-green-200 dark:text-wa-dmuted truncate">
            {displayName}{showPhoneSubtitle ? ` · +${cleanPhone}` : ''}
          </span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-green-300 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            online
          </span>
        </div>
      )}
    </header>
  );
}
