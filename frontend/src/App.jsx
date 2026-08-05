import React, { useEffect, useState, useCallback } from 'react';
import { fetchStatus, fetchMessages } from './api';
import ConnectionPanel from './components/ConnectionPanel';
import SchedulerForm   from './components/SchedulerForm';
import MessageTable    from './components/MessageTable';
import Header          from './components/Header';

const POLL_INTERVAL     = 4_000;
const MSG_POLL_INTERVAL = 20_000;

export default function App() {
  const [waStatus,    setWaStatus]    = useState('connecting');
  const [qr,          setQr]          = useState(null);
  const [pairingCode, setPairingCode] = useState(null);
  const [profile,     setProfile]     = useState({ name: null, phone: null });
  const [isSyncing,   setIsSyncing]   = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

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
    refreshStatus();
    refreshMessages();
    const t1 = setInterval(refreshStatus,   POLL_INTERVAL);
    const t2 = setInterval(refreshMessages, MSG_POLL_INTERVAL);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [refreshStatus, refreshMessages]);

  const isConnected = waStatus === 'connected';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-[#0b141a] transition-colors duration-200">
      {/* Background Wallpaper Doodle with overlay opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.12] dark:opacity-[0.06] wp-custom-bg" />

      <div className="relative z-10 flex-col flex-1 flex">
        <Header status={waStatus} profile={profile} onLogout={refreshStatus} isSyncing={isSyncing} />

        <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-6">
          {!isConnected && (
            <ConnectionPanel
              status={waStatus}
              qr={qr}
              pairingCode={pairingCode}
              onRefresh={refreshStatus}
            />
          )}

          <SchedulerForm isConnected={isConnected} onScheduled={refreshMessages} isSyncing={isSyncing} />

          <MessageTable messages={messages} loading={loadingMsgs} onRefresh={refreshMessages} />
        </main>

        <footer className="w-full text-center text-xs py-5 mt-auto border-t border-slate-200/80 dark:border-wa-dbdr bg-white/50 dark:bg-wa-dpanel/30 backdrop-blur-md transition-colors">
          <div className="container mx-auto px-4 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 dark:text-wa-dmuted font-medium">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <span>© {new Date().getFullYear()} WA Scheduler. All rights reserved.</span>
              <span className="text-[10px] text-gray-400 dark:text-wa-dmuted font-normal">Sent locally via Baileys integration</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] bg-slate-100/85 dark:bg-wa-dsurf px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-wa-dbdr/50">
              <span className="text-emerald-500">🔒</span>
              <span>Local Encryption & End-to-End Secure Delivery</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
