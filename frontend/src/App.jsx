import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { fetchStatus, fetchMessages, fetchUserQuota, sendUserHeartbeat } from './api';
import ConnectionPanel from './components/ConnectionPanel';
import SchedulerForm from './components/SchedulerForm';
import MessageTable from './components/MessageTable';
import QuotaPage from './components/QuotaPage';
import Header from './components/Header';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import toast from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import PaymentModal from './components/PaymentModal';
import AdminPanel from './components/AdminPanel';

const POLL_INTERVAL_DISCONNECTED = 6_000;  // fast poll when waiting for QR/connection
const POLL_INTERVAL_CONNECTED    = 30_000; // slow poll when already connected (stable)

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [waStatus, setWaStatus] = useState('connecting');
  const waStatusRef = useRef('connecting'); // keeps latest status accessible inside polling closures
  const [qr, setQr] = useState(null);
  const [pairingCode, setPairingCode] = useState(null);
  const [profile, setProfile] = useState({ name: null, phone: null });
  const [isSyncing, setIsSyncing] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const cached = localStorage.getItem('wa_cached_messages');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [activeView, setActiveView] = useState(() => {
    try {
      const saved = localStorage.getItem('wa_auth_user');
      return saved ? 'app' : 'landing';
    } catch {
      return 'landing';
    }
  }); // 'landing' | 'app'
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('wa_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState('starter');
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState(() => {
    try {
      return localStorage.getItem('wa_pending_upgrade_plan');
    } catch {
      return null;
    }
  });
  const [quota, setQuota] = useState(() => {
    try {
      const cached = localStorage.getItem('wa_cached_quota');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loadingQuota, setLoadingQuota] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await fetchStatus();
      setWaStatus(data.status);
      waStatusRef.current = data.status; // keep ref in sync for polling interval
      setQr(data.qr);
      setPairingCode(data.pairingCode);
      setProfile(data.profile || { name: null, phone: null });
      setIsSyncing(Boolean(data.isSyncing));
    } catch {
      setWaStatus('disconnected');
      waStatusRef.current = 'disconnected';
      setIsSyncing(false);
    }
  }, []);

  const refreshQuota = useCallback(async () => {
    if (document.hidden) return;
    setLoadingQuota(true);
    try {
      const q = await fetchUserQuota();
      if (q) {
        setQuota(q);
        try { localStorage.setItem('wa_cached_quota', JSON.stringify(q)); } catch {}
      }
    } catch (err) {
      console.warn('Failed to load quota (using cached):', err);
    } finally {
      setLoadingQuota(false);
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    if (document.hidden) return;
    setLoadingMsgs(true);
    try {
      const msgs = await fetchMessages();
      if (Array.isArray(msgs)) {
        setMessages(msgs);
        try { localStorage.setItem('wa_cached_messages', JSON.stringify(msgs)); } catch {}
      }
    } catch {
      /* stale cached ok */
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    // Handle redirect parameters from Google OAuth login
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    if (token && userParam) {
      try {
        const userObj = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('wa_auth_user', JSON.stringify(userObj));
        localStorage.setItem('wa_auth_token', token);
        setAuthUser(userObj);

        let pending = null;
        try {
          pending = localStorage.getItem('wa_pending_upgrade_plan');
          localStorage.removeItem('wa_pending_upgrade_plan');
        } catch (e) {}

        if (pending) {
          setSelectedUpgradePlan(pending);
          setShowPaymentModal(true);
          toast.success(`Welcome, ${userObj.name}! Continuing to ${pending === 'pro' ? 'Pro' : 'Starter'} plan checkout…`);
        } else {
          setActiveView('app');
          toast.success(`Welcome, ${userObj.name}! (Verified by Google)`);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Failed to parse Google login redirect:', err);
      }
    }
  }, []);

  // Status Polling: Adaptive frequency (slow when connected, faster when awaiting pairing/QR)
  useEffect(() => {
    const isAdminOrStatic = location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/privacy-policy') ||
      location.pathname.startsWith('/terms-of-service');

    if (isAdminOrStatic) return;

    refreshStatus();

    let statusTimer = null;
    let isCancelled = false;

    const scheduleStatusPoll = () => {
      const interval = (waStatusRef.current === 'connected') ? POLL_INTERVAL_CONNECTED : POLL_INTERVAL_DISCONNECTED;

      statusTimer = setTimeout(async () => {
        if (isCancelled) return;
        if (!document.hidden) {
          await refreshStatus();
        }
        if (!isCancelled) scheduleStatusPoll();
      }, interval);
    };

    scheduleStatusPoll();

    return () => {
      isCancelled = true;
      if (statusTimer) clearTimeout(statusTimer);
    };
  }, [refreshStatus, location.pathname]);

  // Initial fetch of messages and quota on login or navigating to app
  useEffect(() => {
    const isAdminOrStatic = location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/privacy-policy') ||
      location.pathname.startsWith('/terms-of-service');

    if (!isAdminOrStatic && (authUser || activeView !== 'landing')) {
      refreshMessages();
      refreshQuota();
    }
  }, [authUser, activeView, location.pathname, refreshMessages, refreshQuota]);

  // Adaptive background polling ONLY if there are pending messages
  useEffect(() => {
    const isAdminOrStatic = location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/privacy-policy') ||
      location.pathname.startsWith('/terms-of-service');

    if (isAdminOrStatic || !authUser) return;

    const hasPending = messages.some(m => m.status === 'pending');
    if (!hasPending) return;

    // Only check every 25s if there is actually a pending message waiting to be sent
    const pendingTimer = setInterval(() => {
      if (!document.hidden) {
        refreshMessages();
      }
    }, 25_000);

    return () => clearInterval(pendingTimer);
  }, [messages, authUser, location.pathname, refreshMessages]);

  // Tab visibility change: silently refresh once when user switches back to this tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshStatus();
        const isAdminOrStatic = location.pathname.startsWith('/admin') ||
          location.pathname.startsWith('/privacy-policy') ||
          location.pathname.startsWith('/terms-of-service');
        if (!isAdminOrStatic && authUser) {
          refreshMessages();
          refreshQuota();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshStatus, refreshMessages, refreshQuota, authUser, location.pathname]);

  const isConnected = waStatus === 'connected';
  const isLinked = Boolean(profile?.phone);
  const isReconnecting = waStatus === 'connecting' && isLinked;

  const handleNavigate = (view, sectionId) => {
    navigate('/');
    setActiveView(view);
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    if (!authUser) {
      setShowAuthModal(true);
      return;
    }
    navigate('/');
    setActiveView('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpgradePlan = (planKey = 'starter') => {
    const targetPlan = planKey === 'pro' ? 'pro' : 'starter';
    if (!authUser) {
      // 1. Authentication & Routing Guard
      try {
        localStorage.setItem('wa_pending_upgrade_plan', targetPlan);
      } catch (e) {}
      setPendingUpgradePlan(targetPlan);
      setShowAuthModal(true);
      toast('Please sign in or create an account to upgrade your plan.', { icon: '🔒' });
      return;
    }

    setSelectedUpgradePlan(targetPlan);
    setShowPaymentModal(true);
  };

  // Live user presence heartbeat (only when authenticated and tab is active)
  useEffect(() => {
    if (!authUser) return;
    const token = localStorage.getItem('wa_auth_token');
    if (token) sendUserHeartbeat(token);

    const hb = setInterval(() => {
      if (!document.hidden) {
        const curToken = localStorage.getItem('wa_auth_token');
        if (curToken) sendUserHeartbeat(curToken);
      }
    }, 60_000);
    return () => clearInterval(hb);
  }, [authUser]);

  const handleAuthLogout = () => {
    localStorage.removeItem('wa_auth_user');
    localStorage.removeItem('wa_auth_token');
    localStorage.removeItem('wa_pending_upgrade_plan');
    localStorage.removeItem('wa_cached_messages');
    localStorage.removeItem('wa_cached_quota');
    localStorage.removeItem('wa_cached_contacts');
    setAuthUser(null);
    setMessages([]);
    setQuota(null);
    setActiveView('landing');
    toast.success('Signed out of account.');
  };

  const isPolicyOrTerms = location.pathname === '/privacy-policy' || location.pathname === '/terms-of-service';
  const isAdminPath = location.pathname.startsWith('/admin');

  if (isAdminPath) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/*" element={<AdminPanel />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#f1f1f1] dark:bg-[#0b141a] transition-colors duration-200 font-sans">
      {/* Background Wallpaper Doodle with overlay opacity */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.12] dark:opacity-[0.06] wp-custom-bg" />

      <div className="relative z-10 flex-col flex-1 flex">
        <Header
          status={waStatus}
          profile={profile}
          onLogout={refreshStatus}
          isSyncing={isSyncing}
          activeView={activeView}
          onNavigate={handleNavigate}
          onGetStarted={handleGetStarted}
          authUser={authUser}
          onOpenAuthModal={() => setShowAuthModal(true)}
          onAuthLogout={handleAuthLogout}
          onUpgradePlan={handleUpgradePlan}
          quota={quota}
        />

        {/* Spacer to push content below fixed header */}
        <div className={`flex-shrink-0 transition-all duration-150 ${waStatus === 'connected' && (profile?.name || profile?.phone) ? 'h-[96px] sm:h-[60px]' : 'h-[60px]'}`} />

        <main className={`flex-1 container mx-auto ${isPolicyOrTerms ? 'px-4 max-w-4xl' : activeView === 'landing' ? 'px-2 sm:px-4 max-w-6xl' : 'px-4 max-w-5xl'} py-6 mt-5 sm:mt-0 transition-all duration-200`}>
          <Routes>
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route
              path="*"
              element={
                activeView === 'landing' ? (
                  <LandingPage
                    onGetStarted={handleGetStarted}
                    isConnected={isConnected}
                    waStatus={waStatus}
                    profile={profile}
                    onUpgradePlan={handleUpgradePlan}
                    currentPlan={quota?.plan || 'free'}
                    authUser={authUser}
                  />
                ) : activeView === 'quota' ? (
                  <QuotaPage
                    quota={quota}
                    loading={loadingQuota}
                    onRefresh={refreshQuota}
                    onNavigate={handleNavigate}
                    authUser={authUser}
                    onOpenAuthModal={() => setShowAuthModal(true)}
                    onUpgradePlan={handleUpgradePlan}
                  />
                ) : (
                  <div className="space-y-6">
                    {!isConnected && !isReconnecting && (
                      <ConnectionPanel
                        status={waStatus}
                        qr={qr}
                        pairingCode={pairingCode}
                        onRefresh={refreshStatus}
                        onAuthLogout={handleAuthLogout}
                      />
                    )}

                    {isReconnecting && (
                      <div className="flex items-center gap-3 p-4 bg-teal-50/70 dark:bg-wa-dsurf border border-teal-200 dark:border-teal-800/40 rounded-2xl text-xs sm:text-sm text-teal-800 dark:text-emerald-200 shadow-xs animate-pulse">
                        <span className="w-4 h-4 border-2 border-wa-teal border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <span>Connecting to WhatsApp for <strong>+{profile.phone}</strong>… Your session and scheduled messages are safe.</span>
                      </div>
                    )}

                    <SchedulerForm
                      isConnected={isConnected}
                      isReconnecting={isReconnecting}
                      onScheduled={() => {
                        refreshMessages();
                        refreshQuota();
                      }}
                      isSyncing={isSyncing}
                      quota={quota}
                      onViewQuota={() => setActiveView('quota')}
                    />

                    <MessageTable
                      messages={messages}
                      loading={loadingMsgs}
                      onRefresh={() => {
                        refreshMessages();
                        refreshQuota();
                      }}
                      plan={quota?.plan || 'free'}
                      onViewQuota={() => setActiveView('quota')}
                    />
                  </div>
                )
              }
            />
          </Routes>
        </main>

        <footer className="w-full text-center text-xs py-5 mt-auto border-t border-black/20 dark:border-wa-dbdr bg-wa-dark dark:bg-wa-dpanel transition-colors duration-200 z-10">
          <div className="container mx-auto px-4 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4 text-emerald-100 dark:text-wa-dmuted font-medium">
            <div className="flex flex-col items-center md:items-start gap-1">
              <span className="text-slate-100 dark:text-wa-dtext">© {new Date().getFullYear()} WA Scheduler. All rights reserved.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-emerald-200/90 dark:text-wa-dmuted text-[11px] font-semibold">
              <button onClick={() => handleNavigate('landing')} className="hover:text-white dark:hover:text-wa-dtext transition-colors focus:outline-none">Home</button>
              <span className="opacity-40">|</span>
              <button onClick={() => handleNavigate('landing', 'features')} className="hover:text-white dark:hover:text-wa-dtext transition-colors focus:outline-none">Features</button>
              <span className="opacity-40">|</span>
              <button onClick={() => handleNavigate('landing', 'pricing')} className="hover:text-white dark:hover:text-wa-dtext transition-colors focus:outline-none">Pricing</button>
              <span className="opacity-40">|</span>
              <button onClick={() => handleNavigate('landing', 'contact')} className="hover:text-white dark:hover:text-wa-dtext transition-colors focus:outline-none">Contact Us</button>
              <span className="opacity-40">|</span>
              <Link to="/privacy-policy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white dark:hover:text-wa-dtext transition-colors focus:outline-none">Privacy Policy</Link>
              <span className="opacity-40">|</span>
              <Link to="/terms-of-service" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white dark:hover:text-wa-dtext transition-colors focus:outline-none">Terms of Service</Link>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] bg-white/10 dark:bg-wa-dsurf px-3 py-1.5 rounded-full border border-white/10 dark:border-wa-dbdr/50">
              <span className="text-emerald-300">🔒</span>
              <span className="text-slate-100 dark:text-wa-dtext">Local Encryption & End-to-End Secure Delivery</span>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setAuthUser(user);
          setShowAuthModal(false);

          let target = pendingUpgradePlan;
          try {
            if (!target) target = localStorage.getItem('wa_pending_upgrade_plan');
            localStorage.removeItem('wa_pending_upgrade_plan');
          } catch (e) {}
          setPendingUpgradePlan(null);

          if (target) {
            setSelectedUpgradePlan(target);
            setShowPaymentModal(true);
            toast.success(`Signed in! Continuing to ${target === 'pro' ? 'Pro' : 'Starter'} plan upgrade…`);
          } else {
            navigate('/');
            setActiveView('app');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        initialPlan={selectedUpgradePlan}
        authUser={authUser}
        connectedPhone={profile?.phone}
        currentPlan={quota?.plan || 'free'}
        onSuccess={() => {
          refreshQuota();
        }}
      />
    </div>
  );
}
