import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { requestPairingCode } from '../api';

/**
 * ConnectionPanel
 *
 * Shows either:
 *  - A QR code image to scan (Desktop flow)
 *  - A "Connect via Phone Number" section for mobile/pairing-code flow
 */
export default function ConnectionPanel({ status, qr, pairingCode, onRefresh }) {
  const [tab, setTab]               = useState('qr');      // 'qr' | 'phone'
  const [phone, setPhone]           = useState('');
  const [requesting, setRequesting] = useState(false);
  const [localCode, setLocalCode]   = useState(null);
  const [countdown, setCountdown]   = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setLocalCode(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    if (status === 'connected') {
      setLocalCode(null);
      setCountdown(0);
    }
  }, [status]);

  useEffect(() => {
    if (pairingCode && !localCode && countdown === 0) {
      setCountdown(60); // Default countdown if retrieved from status polling on refresh
    }
  }, [pairingCode, localCode, countdown]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setLocalCode(null);
    setCountdown(0);
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 7 || cleaned.length > 15) {
      toast.error('Enter a valid phone number with country code (digits only).');
      return;
    }

    setRequesting(true);
    setLocalCode(null);
    setCountdown(0);
    try {
      const data = await requestPairingCode(cleaned);
      setLocalCode(data.code);
      setCountdown(120); // 120 seconds countdown
      toast.success('Pairing code generated!');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setRequesting(false);
    }
  };

  // Format pairing code as groups of 4 (e.g. "ABCD-EFGH")
  const displayCode = (code) => {
    if (!code) return null;
    const c = code.replace(/-/g, '');
    return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : code;
  };

  const activeCode = localCode || pairingCode;

  return (
    <div className="bg-white dark:bg-wa-dpanel rounded-2xl shadow-sm border border-slate-200 dark:border-wa-dbdr overflow-hidden transition-colors duration-200">
      {/* Panel header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-wa-dark to-wa-teal px-5 py-5 text-white">
        {/* Background Image overlay */}
        <div className="absolute inset-0 opacity-[0.15] wp-green-bg pointer-events-none mix-blend-overlay" />
        <div className="relative z-10">
          <h2 className="font-bold text-base md:text-lg">Connect WhatsApp</h2>
          <p className="text-xs text-green-100 mt-1">
            {status === 'connecting'
              ? 'Initialising WhatsApp client…'
              : status === 'qr_ready'
              ? 'Ready — scan the QR or use a pairing code below.'
              : 'Not connected — choose a method below.'}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-slate-200 dark:border-wa-dbdr">
        {[
          { key: 'qr',    label: '📷  QR Code',           sub: 'Scan with WhatsApp camera' },
          { key: 'phone', label: '📱  Phone Number',       sub: 'Get a pairing code' },
        ].map(({ key, label, sub }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex-1 py-3 px-3 sm:px-4 text-sm font-medium text-left transition-colors
              ${tab === key
                ? 'border-b-2 border-wa-teal text-wa-teal bg-teal-50/40 dark:bg-wa-dsurf/50'
                : 'text-gray-500 hover:text-gray-700 dark:text-wa-dmuted dark:hover:text-wa-dtext hover:bg-slate-50 dark:hover:bg-wa-dsurf/20'
              }`}
          >
            <span className="block text-xs sm:text-sm font-semibold">{label}</span>
            <span className="text-[10px] font-normal text-gray-400 dark:text-wa-dmuted hidden sm:block mt-0.5">{sub}</span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* ── QR Code Tab ─────────────────────────────────────────────────────── */}
        {tab === 'qr' && (
          <div className="flex flex-col items-center gap-4">
            {status === 'connecting' && (
              <div className="flex flex-col items-center gap-3 py-8 text-gray-500 dark:text-wa-dmuted">
                <div className="w-10 h-10 border-4 border-wa-teal border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Starting WhatsApp client…</p>
              </div>
            )}

            {status !== 'connecting' && !qr && (
              <div className="flex flex-col items-center gap-3 py-8 text-gray-400 dark:text-wa-dmuted">
                <svg className="w-12 h-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                </svg>
                <p className="text-sm text-gray-500 dark:text-wa-dmuted">Waiting for QR code…</p>
                <button
                  onClick={onRefresh}
                  className="text-xs text-wa-teal hover:underline"
                >
                  Refresh
                </button>
              </div>
            )}

            {qr && (
              <>
                <div className="p-3 bg-white border border-wa-teal/30 dark:border-wa-dbdr rounded-xl shadow-inner">
                  <img src={qr} alt="WhatsApp QR Code" className="w-52 h-52 sm:w-64 sm:h-64" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-wa-dtext">Scan with WhatsApp</p>
                  <p className="text-xs text-gray-400 dark:text-wa-dmuted">
                    Open WhatsApp → Linked Devices → Link a Device
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Phone Number Tab ─────────────────────────────────────────────── */}
        {tab === 'phone' && (
          <div className="max-w-sm mx-auto space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p className="font-semibold">How it works:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Enter your WhatsApp number with country code.</li>
                <li>Click "Get Pairing Code".</li>
                <li>In WhatsApp → Linked Devices → Link with phone number.</li>
                <li>Enter the 8-character code shown below.</li>
              </ol>
            </div>

            <form onSubmit={handleRequestCode} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-wa-dtext mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +918000000000"
                  className="w-full border border-gray-200 dark:border-wa-dbdr rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-wa-dsurf text-gray-900 dark:text-wa-dtext focus:outline-none focus:ring-2 focus:ring-wa-teal/40 focus:border-wa-teal"
                />
                <p className="text-xs text-gray-400 dark:text-wa-dmuted mt-1">Include country code, no + sign or spaces.</p>
              </div>

              <button
                type="submit"
                disabled={requesting}
                className="w-full bg-wa-teal hover:bg-wa-dark text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {requesting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {requesting ? 'Requesting…' : 'Get Pairing Code'}
              </button>
            </form>

            {/* Display the pairing code */}
            {activeCode && (
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-wa-dmuted mb-2">Enter this code in WhatsApp:</p>
                <div className="inline-flex items-center gap-1 bg-wa-light dark:bg-wa-dark/20 border border-wa-teal/30 dark:border-wa-dbdr rounded-xl px-4 py-2 sm:px-6 sm:py-3 max-w-full overflow-hidden">
                  <span className="text-lg sm:text-2xl font-bold tracking-[0.1em] sm:tracking-[0.25em] text-wa-dark dark:text-wa-green font-mono">
                    {displayCode(activeCode)}
                  </span>
                </div>
                {countdown > 0 ? (
                  <p className="text-xs text-gray-400 dark:text-wa-dmuted mt-2 flex items-center justify-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-wa-teal animate-pulse"></span>
                    Code expires in <span className="font-semibold text-wa-teal dark:text-wa-green">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                  </p>
                ) : (
                  <p className="text-xs text-rose-500 mt-2 font-medium">Code expired. Please request a new one.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
