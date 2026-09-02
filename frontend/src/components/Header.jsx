import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { logout, updateProfileName } from '../api';
import { useTheme } from '../ThemeContext';
import FeedbackModal from './FeedbackModal';
import AvatarSelectorModal, { PRESET_AVATARS, COLOR_OPTIONS } from './AvatarSelectorModal';
import { navigateTo } from '../utils/navigation';

const STATUS_CONFIG = {
  connected:    { label: 'Connected',     bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500',  pulse: false },
  qr_ready:     { label: 'Awaiting Auth', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-400', pulse: true  },
  connecting:   { label: 'Connecting',    bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-400',   pulse: true  },
  disconnected: { label: 'Disconnected',  bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500',    pulse: false },
};

const WA_ICON = (
  <img src="/wp-sheduler_logo.png" alt="WhatsApp Logo" className="w-full h-full object-cover rounded-[7px]" />
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

// Hamburger icon for mobile menu
const HamburgerIcon = ({ isOpen }) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    {isOpen ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    )}
  </svg>
);

export default function Header({ status, profile, onLogout, isSyncing, activeView, onNavigate, onGetStarted, authUser, onOpenAuthModal, onAuthLogout }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [syncTimerExceeded, setSyncTimerExceeded] = React.useState(false);
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.name || '');
  const [showFeedback, setShowFeedback] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Avatar state persistence
  const [avatarConfig, setAvatarConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('wa_profile_avatar');
      return saved ? JSON.parse(saved) : { type: 'initial', colorId: 'emerald' };
    } catch {
      return { type: 'initial', colorId: 'emerald' };
    }
  });
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleSaveAvatar = (newConfig) => {
    setAvatarConfig(newConfig);
    try {
      localStorage.setItem('wa_profile_avatar', JSON.stringify(newConfig));
      toast.success('Avatar updated successfully!');
    } catch (err) {
      console.error('Failed to save avatar', err);
    }
  };

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

  const renderAvatarGraphic = (sizeClass = "w-8 h-8", textClass = "text-sm") => {
    if (avatarConfig.type === 'custom' && avatarConfig.value) {
      return (
        <img
          src={avatarConfig.value}
          alt="Avatar"
          className={`${sizeClass} rounded-full object-cover shadow-sm border border-white/20`}
        />
      );
    }
    if (avatarConfig.type === 'preset' && avatarConfig.presetId) {
      const presetObj = PRESET_AVATARS.find(p => p.id === avatarConfig.presetId) || PRESET_AVATARS[0];
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden shadow-sm border border-white/20 bg-slate-800`}>
          {presetObj.svg}
        </div>
      );
    }
    const colorObj = COLOR_OPTIONS.find(c => c.id === avatarConfig.colorId) || COLOR_OPTIONS[0];
    return (
      <div className={`${sizeClass} rounded-full ${colorObj.bg} flex-shrink-0 flex items-center justify-center text-white font-extrabold ${textClass} shadow-sm border border-white/20`}>
        {avatarLetter}
      </div>
    );
  };

  const handleLogout = async () => {
    if (!window.confirm('Disconnect WhatsApp and clear the session?')) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Disconnected from WhatsApp.');
      onLogout?.();
      onAuthLogout?.();
    } catch (err) {
      toast.error('Logout failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoggingOut(false);
    }
  };

  const handleNavClick = (view, sectionId) => {
    if (onNavigate) {
      onNavigate(view, sectionId);
    } else {
      navigateTo('/');
      if (sectionId) {
        setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  const isAppView = activeView === 'app';

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-40 bg-wa-dark/85 dark:bg-wa-dpanel/85 backdrop-blur-md border-b border-black/20 dark:border-wa-dbdr/60 shadow-lg transition-all duration-200">
      <div className={`container mx-auto px-4 py-3 ${isAppView ? 'max-w-5xl' : 'max-w-8xl'} flex items-center justify-between gap-3 transition-all duration-200`}>

        {/* ── Logo + title (Clickable link back to Home) ──────────────── */}
        <button
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-90 active:scale-98 transition-all text-left outline-none border-0 ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none select-none group"
          title="Click to return to Home Page"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shadow-sm overflow-hidden group-hover:scale-105 transition-transform shrink-0">
            {WA_ICON}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-slate-100 leading-tight tracking-tight group-hover:text-emerald-200 transition-colors">
                WA Scheduler
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-medium select-none">
                🔒 End-to-End Encrypted
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-green-300 dark:text-wa-dmuted leading-tight mt-0.5 flex items-center gap-1">
              <span>WA Message Scheduler</span>
            </p>
          </div>
        </button>

        {/* ── Landing Navigation Links (Desktop view) ──── */}
        {!isAppView && (
          <nav className="hidden lg:flex items-center gap-1 sm:gap-2 text-xs font-semibold text-emerald-100 dark:text-wa-dmuted">
            <button
              onClick={() => handleNavClick('landing')}
              className="px-3 py-1.5 rounded-lg bg-white/15 text-white font-bold dark:bg-wa-dsurf dark:text-wa-dtext transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('landing', 'features')}
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 dark:hover:text-wa-dtext transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('landing', 'how-it-works')}
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 dark:hover:text-wa-dtext transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick('landing', 'pricing')}
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 dark:hover:text-wa-dtext transition-colors flex items-center gap-1"
            >
              <span>Pricing</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-white uppercase">
                Free
              </span>
            </button>
          </nav>
        )}

        {/* ── Connected Profile Card (Clickable workspace entrance) ─────────── */}
        {isConnected && (
          <div
            onClick={(e) => {
              if (editing) return;
              if (!isAppView) onGetStarted();
            }}
            className={`hidden lg:flex items-center gap-2.5 bg-white/10 dark:bg-wa-dsurf border border-white/15 dark:border-wa-dbdr rounded-xl px-3 py-1.5 min-w-0 flex-1 max-w-[260px] transition-all duration-200 group select-none ${
              !isAppView ? 'cursor-pointer hover:bg-white/20 dark:hover:bg-wa-dbdr/80 hover:border-emerald-400/50 hover:shadow-md' : 'cursor-default'
            }`}
            title={!isAppView ? "Go to Messaging Workspace" : "Connected WhatsApp Profile"}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowAvatarModal(true);
              }}
              className="relative group/avatar cursor-pointer shrink-0"
              title="Click to customize avatar (Photo, 8 Avatars, Color)"
            >
              {renderAvatarGraphic("w-8 h-8", "text-sm")}
              <div className="absolute -bottom-1 -right-1 bg-slate-900/90 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white/30 shadow-md group-hover/avatar:scale-110 transition-transform">
                📷
              </div>
            </div>
            <div className="min-w-0 flex-1 flex items-center gap-1.5">
              {editing ? (
                <div className="flex items-center gap-1 w-full min-w-0" onClick={(e) => e.stopPropagation()}>
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
                    <p className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-emerald-200 transition-colors truncate leading-tight">
                      {displayName || 'Connected User'}
                    </p>
                    {showPhoneSubtitle ? (
                      <p className="text-[10px] sm:text-[11px] text-green-300 dark:text-wa-dmuted leading-tight font-mono truncate">
                        +{cleanPhone}
                      </p>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-green-300 dark:text-green-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        online
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(true);
                      setEditedName(displayName || '');
                    }}
                    className="p-1 text-slate-300 hover:text-slate-100 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0 text-xs"
                    title="Edit profile name"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
            {!isAppView && !editing && (
              <span className="text-emerald-400 dark:text-emerald-300 text-xs font-extrabold opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ml-0.5 shrink-0 hidden">
                →
              </span>
            )}
          </div>
        )}

        {/* ── Desktop Action Controls ───────────── */}
        <div className="hidden lg:flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* User Account Login/Badge */}
          {authUser ? (
            <div className="flex items-center gap-2 bg-white/10 dark:bg-wa-dsurf border border-white/20 dark:border-wa-dbdr rounded-xl px-3 py-1 text-xs text-slate-100 shadow-xs">
              <span className="w-6 h-6 rounded-full bg-emerald-500/25 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-400/40">
                {authUser.name ? authUser.name.charAt(0).toUpperCase() : '👤'}
              </span>
              <div className="flex flex-col min-w-0 max-w-[120px]">
                <span className="font-bold text-white truncate leading-tight">{authUser.name}</span>
                <span className="text-[10px] text-emerald-300/80 truncate leading-tight">{authUser.email}</span>
              </div>
              <button
                type="button"
                onClick={onAuthLogout}
                className="ml-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-red-300 hover:text-white bg-red-500/20 hover:bg-red-500/40 transition-colors shrink-0"
                title="Sign Out of Account"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-emerald-50 border border-slate-200 shadow-sm transition-all duration-200 flex items-center gap-1.5 active:scale-95"
            >
              <span>🔑</span>
              <span>Sign In / Register</span>
            </button>
          )}

          {!isAppView && !isConnected && (
            <button
              onClick={onGetStarted}
              className="px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white bg-white dark:bg-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500 border border-slate-200 dark:border-emerald-500/30 shadow-sm transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-0.5 flex items-center gap-1"
            >
              <span>Get Started</span>
              <span className="text-emerald-600 dark:text-emerald-200 font-black">→</span>
            </button>
          )}

          {isConnected && isSyncing && !syncTimerExceeded && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/25 text-blue-200 border border-blue-400/30 animate-pulse">
              <span className="w-2.5 h-2.5 border-2 border-blue-200 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>Syncing…</span>
            </span>
          )}

          <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
            <span>{cfg.label}</span>
          </span>

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-1.5 rounded-full text-slate-200/70 hover:text-slate-100 hover:bg-white/10 dark:hover:bg-wa-dsurf transition-colors"
            title={dark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

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

        {/* ── Mobile 3-Line Hamburger Button ──────────────────────── */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-200 hover:text-white bg-white/10 dark:bg-wa-dsurf transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <HamburgerIcon isOpen={mobileMenuOpen} />
        </button>

      </div>

      {/* ── Mobile Hamburger Dropdown Menu Panel ───────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-wa-dark/95 dark:bg-wa-dpanel/95 backdrop-blur-xl border-b border-black/20 dark:border-wa-dbdr px-4 py-4 space-y-3 shadow-2xl transition-all">
          {!isAppView && (
            <div className="flex flex-col gap-1 text-xs font-semibold text-emerald-100 dark:text-wa-dmuted pb-3 border-b border-white/10 dark:border-wa-dbdr/60">
              <button
                onClick={() => { handleNavClick('landing'); setMobileMenuOpen(false); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-wa-dsurf text-white font-bold"
              >
                Home
              </button>
              <button
                onClick={() => { handleNavClick('landing', 'features'); setMobileMenuOpen(false); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-wa-dsurf"
              >
                Features
              </button>
              <button
                onClick={() => { handleNavClick('landing', 'how-it-works'); setMobileMenuOpen(false); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-wa-dsurf"
              >
                How It Works
              </button>
              <button
                onClick={() => { handleNavClick('landing', 'pricing'); setMobileMenuOpen(false); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-wa-dsurf flex items-center justify-between"
              >
                <span>Pricing</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white uppercase">Free</span>
              </button>
            </div>
          )}

          {/* Mobile Actions: CTA + Status + Theme Toggle */}
          <div className="flex flex-col gap-2.5 pt-1">
            {!isAppView && (
              <button
                onClick={() => { onGetStarted(); setMobileMenuOpen(false); }}
                className="w-full py-2.5 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white bg-white dark:bg-emerald-600 hover:bg-emerald-50 shadow-md flex items-center justify-center gap-1.5"
              >
                <span>{isConnected ? 'Go to Messaging Workspace' : 'Get Started Free'}</span>
                <span>→</span>
              </button>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
                <span>{cfg.label}</span>
              </span>

              <button
                onClick={() => { toggle(); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 dark:bg-wa-dsurf text-white"
              >
                {dark ? <SunIcon /> : <MoonIcon />}
                <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>

            {isConnected && (
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                disabled={loggingOut}
                className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 py-2 rounded-xl font-medium"
              >
                <LogoutIcon />
                <span>Disconnect Session</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Profile Strip (When connected) ────────────────────── */}
      {isConnected && (
        <div
          onClick={() => {
            if (editing) return;
            if (!isAppView) onGetStarted();
          }}
          className={`lg:hidden bg-black/20 dark:bg-wa-dsurf/60 px-4 py-1.5 flex items-center gap-2 border-t border-black/10 dark:border-wa-dbdr ${
            !isAppView ? 'cursor-pointer hover:bg-black/30 active:bg-black/40' : ''
          }`}
          title={!isAppView ? "Tap to open Messaging Workspace" : "Connected WhatsApp Profile"}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowAvatarModal(true);
            }}
            className="relative cursor-pointer shrink-0"
            title="Tap to customize avatar"
          >
            {renderAvatarGraphic("w-6 h-6", "text-xs")}
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            {editing ? (
              <div className="flex items-center gap-1 w-full min-w-0" onClick={(e) => e.stopPropagation()}>
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
                <span className="text-xs font-semibold text-emerald-200 dark:text-wa-dmuted truncate">
                  {displayName || 'Connected User'}{showPhoneSubtitle ? ` · +${cleanPhone}` : ''}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(true);
                    setEditedName(displayName || '');
                  }}
                  className="text-[10px] text-slate-300 opacity-60 hover:opacity-100 shrink-0"
                  title="Edit profile name"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
          {!isAppView && !editing && (
            <span className="text-emerald-400 text-xs font-bold shrink-0 ml-auto">
              Open Workspace →
            </span>
          )}
          {isAppView && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-green-300 dark:text-green-400 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              online
            </span>
          )}
        </div>
      )}
    </header>

    {/* Floating Feedback & Support Button */}
    <div className="fixed bottom-6 right-6 z-[99] group">
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
    {showAvatarModal && (
      <AvatarSelectorModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentAvatar={avatarConfig}
        onSave={handleSaveAvatar}
        userName={displayName}
      />
    )}
  </>
  );
}
