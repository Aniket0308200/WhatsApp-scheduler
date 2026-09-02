import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { fetchStatus, fetchMessages } from './api';
import ConnectionPanel from './components/ConnectionPanel';
import SchedulerForm from './components/SchedulerForm';
import MessageTable from './components/MessageTable';
import Header from './components/Header';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import toast from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';

const POLL_INTERVAL = 4_000;
const MSG_POLL_INTERVAL = 20_000;

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [waStatus, setWaStatus] = useState('connecting');
  const [qr, setQr] = useState(null);
  const [pairingCode, setPairingCode] = useState(null);
  const [profile, setProfile] = useState({ name: null, phone: null });
  const [isSyncing, setIsSyncing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [activeView, setActiveView] = useState('landing'); // 'landing' | 'app'
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('wa_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await fetchStatus();
      setWaStatus(data.status);
      setQr(data.qr);
      setPairingCode(data.pairingCode);
      setProfile(data.profile || { name: null, phone: null });
      setIsSyncing(Boolean(data.isSyncing));
    } catch {
      setWaStatus('disconnected');
      setIsSyncing(false);
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    setLoadingMsgs(true);
    try { setMessages(await fetchMessages()); }
    catch { /* stale ok */ }
    finally { setLoadingMsgs(false); }
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
        setActiveView('app');
        toast.success(`Welcome, ${userObj.name}! (Verified by Google)`);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Failed to parse Google login redirect:', err);
      }
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    refreshMessages();
    const t1 = setInterval(refreshStatus, POLL_INTERVAL);
    const t2 = setInterval(refreshMessages, MSG_POLL_INTERVAL);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [refreshStatus, refreshMessages]);

  const isConnected = waStatus === 'connected';

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

  const handleAuthLogout = () => {
    localStorage.removeItem('wa_auth_user');
    localStorage.removeItem('wa_auth_token');
    setAuthUser(null);
    setActiveView('landing');
    toast.success('Signed out of account.');
  };

  const isPolicyOrTerms = location.pathname === '/privacy-policy' || location.pathname === '/terms-of-service';

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
                  />
                ) : (
                  <div className="space-y-6">
                    {!isConnected && (
                      <ConnectionPanel
                        status={waStatus}
                        qr={qr}
                        pairingCode={pairingCode}
                        onRefresh={refreshStatus}
                        onAuthLogout={handleAuthLogout}
                      />
                    )}

                    <SchedulerForm isConnected={isConnected} onScheduled={refreshMessages} isSyncing={isSyncing} />

                    <MessageTable messages={messages} loading={loadingMsgs} onRefresh={refreshMessages} />
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
          navigate('/');
          setActiveView('app');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
