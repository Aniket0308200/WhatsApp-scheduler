import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { logout, updateProfileName } from '../api';
import { useTheme } from '../ThemeContext';
import FeedbackModal from './FeedbackModal';

const STATUS_CONFIG = {
  connected:    { label: 'Connected',     bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500',  pulse: false },
  qr_ready:     { label: 'Awaiting Auth', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-400', pulse: true  },
  connecting:   { label: 'Connecting',    bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-400',   pulse: true  },
  disconnected: { label: 'Disconnected',  bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500',    pulse: false },
};

const WA_ICON = (
  <img src="/whatsapp_icon.png" alt="WhatsApp Logo" className="w-full h-full object-cover" />
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
  const [syncTimerExceeded, setSyncTimerExceeded] = React.useState(false);
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.name || '');
  const [showFeedback, setShowFeedback] = useState(false);

  React.useEffect(() => {
    setEditedName(profile?.name || '');
  }, [profile]);

  const handleSaveName = async () => {
    const clean = editedName.trim();
    if (!clean) {
      toast.error('Name cannot be empty.');
      return;
    }
    try {
      await updateProfileName(clean);
      toast.success('Profile name updated!');
      setEditing(false);
      onLogout?.();
    } catch (err) {
      toast.error('Failed to update name: ' + (err.response?.data?.error || err.message));
    }
  };
  
  React.useEffect(() => {
    if (status === 'connected' && isSyncing) {
      const t = setTimeout(() => {
        setSyncTimerExceeded(true);
      }, 15_000);
      return () => clearTimeout(t);
    } else {
      setSyncTimerExceeded(false);
    }
  }, [status, isSyncing]);

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
    <>
    <header className="fixed top-0 left-0 right-0 z-40 bg-wa-dark dark:bg-wa-dpanel border-b border-black/20 dark:border-wa-dbdr shadow-md transition-colors duration-200">
      <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between gap-3">

        {/* ── Logo + title ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-wa-green flex items-center justify-center shadow-sm overflow-hidden">
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
        {/* ── Connected profile pill (desktop) ─────────────────────────── */}
        {isConnected && (
          <div className="hidden sm:flex items-center gap-2.5 bg-white/10 dark:bg-wa-dsurf border border-white/10 dark:border-wa-dbdr rounded-xl px-3 py-1.5 min-w-0 flex-1 max-w-[260px]">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-wa-green flex-shrink-0 flex items-center justify-center text-slate-100 font-bold text-sm shadow-sm">
              {avatarLetter}
            </div>
            <div className="min-w-0 flex-1 flex items-center gap-1.5">
              {editing ? (
                <div className="flex items-center gap-1 w-full min-w-0">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full text-xs bg-slate-800 dark:bg-wa-dsurf border border-wa-teal rounded-md px-1.5 py-0.5 text-slate-100 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setEditing(false);
                    }}
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="text-green-400 hover:text-green-300 text-xs font-semibold px-1 shrink-0">✓</button>
                  <button onClick={() => setEditing(false)} className="text-red-400 hover:text-red-300 text-xs font-semibold px-1 shrink-0">✕</button>
                </div>
              ) : (
                <div className="min-w-0 flex-1 group/name flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
                      {displayName || 'No Name'}
                    </p>
                    {showPhoneSubtitle && (
                      <p className="text-[11px] text-green-300 dark:text-wa-dmuted leading-tight font-mono">
                        +{cleanPhone}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setEditing(true); setEditedName(displayName || ''); }}
                    className="p-1 text-slate-300 hover:text-slate-100 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0 text-xs"
                    title="Edit profile name"
                  >
                    ✏️
                  </button>
                </div>
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
          {isConnected && isSyncing && !syncTimerExceeded && (
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
      {isConnected && (
        <div className="sm:hidden bg-black/20 dark:bg-wa-dsurf/60 px-4 py-1.5 flex items-center gap-2 border-t border-black/10 dark:border-wa-dbdr">
          <div className="w-5 h-5 rounded-full bg-wa-green flex items-center justify-center text-slate-100 font-bold text-[10px] flex-shrink-0">
            {avatarLetter}
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            {editing ? (
              <div className="flex items-center gap-1 w-full min-w-0">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full text-xs bg-slate-800 dark:bg-wa-dsurf border border-wa-teal rounded-md px-1.5 py-0.5 text-slate-100 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-green-400 hover:text-green-300 text-xs font-semibold px-1 shrink-0 animate-fade-in">✓</button>
                <button onClick={() => setEditing(false)} className="text-red-400 hover:text-red-300 text-xs font-semibold px-1 shrink-0 animate-fade-in">✕</button>
              </div>
            ) : (
              <div className="min-w-0 flex-1 flex items-center gap-1.5 group/mobname">
                <span className="text-xs text-green-200 dark:text-wa-dmuted truncate">
                  {displayName || 'No Name'}{showPhoneSubtitle ? ` · +${cleanPhone}` : ''}
                </span>
                <button
                  onClick={() => { setEditing(true); setEditedName(displayName || ''); }}
                  className="text-[10px] text-slate-300 opacity-60 hover:opacity-100 shrink-0"
                  title="Edit profile name"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-green-300 dark:text-green-400 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            online
          </span>
        </div>
      )}
    </header>
    {/* Floating Feedback & Support Button */}
    <div className="fixed bottom-6 right-6 z-[99] group">
      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 mb-1 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-slate-950/90 dark:bg-wa-dpanel/95 backdrop-blur-sm text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl border border-slate-800 dark:border-wa-dbdr whitespace-nowrap">
        Feedback & Support Box
      </div>
      <button
        onClick={() => setShowFeedback(true)}
        className="w-14 h-14 rounded-full bg-wa-teal hover:bg-wa-teal/90 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-teal-400/20"
        aria-label="Feedback & Support"
      >
        <span className="text-2xl leading-none select-none">💬</span>
      </button>
    </div>
    {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
  </>
  );
}
