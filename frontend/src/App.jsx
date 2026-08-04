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
  const [messages,    setMessages]    = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await fetchStatus();
      setWaStatus(data.status);
      setQr(data.qr);
      setPairingCode(data.pairingCode);
      setProfile(data.profile || { name: null, phone: null });
    } catch {
      setWaStatus('disconnected');
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#f4f6f8] dark:bg-wa-dbg transition-colors duration-200">
      {/* Background Wallpaper Doodle with overlay opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.25] dark:opacity-[0.18] wp-light-bg dark:wp-dark-bg" />

      <div className="relative z-10 flex-col flex-1 flex">
        <Header status={waStatus} profile={profile} onLogout={refreshStatus} />

        <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-6">
          {!isConnected && (
            <ConnectionPanel
              status={waStatus}
              qr={qr}
              pairingCode={pairingCode}
              onRefresh={refreshStatus}
            />
          )}

          <SchedulerForm isConnected={isConnected} onScheduled={refreshMessages} />

          <MessageTable messages={messages} loading={loadingMsgs} onRefresh={refreshMessages} />
        </main>

        <footer className="text-center text-xs text-gray-400 dark:text-wa-dmuted py-4 border-t border-slate-200/80 dark:border-wa-dbdr bg-white/40 dark:bg-transparent backdrop-blur-xs">
          WA Scheduler — messages sent locally via Baileys
        </footer>
      </div>
    </div>
  );
}
