import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { format, parseISO, isValid } from 'date-fns';
import { cancelMessage, deleteMessage } from '../api';

const STATUS_BADGE = {
  pending:   { label: '⏳ Pending',     cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/40' },
  sent:      { label: '✓ Sent',         cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40' },
  submitted: { label: '✓ Sent',         cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40' },
  delivered: { label: '✓✓ Delivered',   cls: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200 dark:border-teal-900/40' },
  read:      { label: '🔵 Read',        cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40' },
  failed:    { label: '❌ Failed',      cls: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/40' },
  cancelled: { label: '🚫 Cancelled',   cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700' },
};

const FILTERS = ['all', 'pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'];

function formatDate(val) {
  if (!val) return '—';
  try {
    const normalized = val.includes('T') ? val : val.replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  } catch {
    return val;
  }
}

export default function MessageTable({ messages, loading, onRefresh }) {
  const [filter,   setFilter]   = useState('all');
  const [actionId, setActionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page to 1 if messages count increases (indicating a new message was scheduled)
  const prevCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      setCurrentPage(1);
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  // Auto-refresh every 15 s when there are pending messages
  useEffect(() => {
    const hasPending = messages.some(m => m.status === 'pending');
    if (!hasPending) return;
    const t = setInterval(onRefresh, 15_000);
    return () => clearInterval(t);
  }, [messages, onRefresh]);

  // Sort messages: newest first (highest ID or timestamp first, so new schedules always appear at the top)
  const sortedMessages = [...messages].sort((a, b) => {
    if (typeof a.id === 'string' && typeof b.id === 'string') {
      return b.id.localeCompare(a.id);
    }
    return b.id - a.id;
  });

  const filtered = filter === 'all'
    ? sortedMessages
    : sortedMessages.filter(m => {
        if (filter === 'sent') return m.status === 'sent' || m.status === 'submitted';
        return m.status === filter;
      });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Reset to first page if filter or page size changes in a way that exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filter, pageSize, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMessages = filtered.slice(startIndex, endIndex);

  const counts = FILTERS.reduce((acc, f) => {
    if (f === 'all') acc[f] = messages.length;
    else if (f === 'sent') acc[f] = messages.filter(m => m.status === 'sent' || m.status === 'submitted').length;
    else acc[f] = messages.filter(m => m.status === f).length;
    return acc;
  }, {});

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this scheduled message?')) return;
    setActionId(id);
    try {
      await cancelMessage(id);
      toast.success('Message cancelled.');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this record?')) return;
    setActionId(id);
    try {
      await deleteMessage(id);
      toast.success('Record deleted.');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-wa-dpanel rounded-2xl shadow-sm border border-slate-200 dark:border-wa-dbdr overflow-hidden transition-colors duration-200">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-wa-dbdr flex items-center justify-between flex-wrap gap-3 bg-slate-50/50 dark:bg-[#111b21]/30">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-wa-dtext">Scheduled Messages</h2>
          <p className="text-xs text-gray-400 dark:text-wa-dmuted mt-0.5">{messages.length} total</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-wa-teal dark:text-wa-green flex items-center gap-1 disabled:opacity-50"
        >
          {loading
            ? <span className="w-3.5 h-3.5 border-2 border-wa-teal hover:underline  dark:border-wa-green border-t-transparent rounded-full animate-spin" />
            : <span className="text-base leading-none rotate-90">🗘</span>
          }
          Refresh
        </button>
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-wa-dbdr px-2 gap-1 pt-2 bg-slate-50/20 dark:bg-transparent">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setCurrentPage(1);
            }}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-t-lg capitalize transition-colors
              ${filter === f ? 'bg-wa-teal text-white' : 'text-gray-500 hover:text-gray-700 dark:text-wa-dmuted dark:hover:text-wa-dtext hover:bg-slate-50 dark:hover:bg-wa-dsurf/30'}`}
          >
            {f === 'all' ? 'All' : (STATUS_BADGE[f]?.label || f)}
            {counts[f] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${filter === f ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-wa-dsurf text-gray-700 dark:text-wa-dmuted'}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-wa-dmuted gap-2">
          <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p className="text-sm">No {filter === 'all' ? '' : filter} messages.</p>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-wa-dsurf/50 text-left text-xs font-semibold text-gray-600 dark:text-wa-dmuted uppercase tracking-wide border-b border-slate-200 dark:border-wa-dbdr">
                <th className="px-5 py-3 whitespace-nowrap">Recipient</th>
                <th className="px-5 py-3">Message</th>
                <th className="px-5 py-3 whitespace-nowrap">Scheduled At</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-wa-dbdr/50">
              {paginatedMessages.map(msg => {
                const badge  = STATUS_BADGE[msg.status] || STATUS_BADGE.pending;
                const isBusy = actionId === msg.id;

                return (
                  <tr key={msg.id} className="hover:bg-slate-50/60 dark:hover:bg-wa-dsurf/20 transition-colors">
                    {/* Recipient */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700 dark:text-wa-dtext">
                      {msg.recipient_name ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{msg.recipient_name}</span>
                          <span className="font-mono text-[11px] text-gray-400 dark:text-wa-dmuted">
                            +{msg.phone}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">+{msg.phone}</span>
                          <span className="text-[11px] text-gray-400 dark:text-wa-dmuted">
                            No contact name
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Message + error */}
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <p className="truncate text-gray-700 dark:text-wa-dtext" title={msg.message}>
                        {msg.message}
                      </p>
                      {msg.error && (
                        <p className="text-[11px] text-red-500 truncate mt-0.5" title={msg.error}>
                          ⚠ {msg.error}
                        </p>
                      )}
                    </td>

                    {/* Scheduled at */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 dark:text-wa-dmuted text-xs">
                      {formatDate(msg.scheduled_at)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {msg.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(msg.id)}
                            disabled={isBusy}
                            className="text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 font-medium disabled:opacity-50"
                          >
                            {isBusy ? '…' : 'Cancel'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(msg.id)}
                          disabled={isBusy}
                          className="text-xs text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
                        >
                          {isBusy ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination Controls ─────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-150 dark:border-wa-dbdr flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50 dark:bg-wa-dsurf/10">
          {/* Page size select & current items info */}
          <div className="flex items-center flex-wrap justify-center sm:justify-start gap-2.5 text-xs text-gray-500 dark:text-wa-dmuted">
            <span className="hidden sm:inline">Show:</span>
            <select
              id="messages-page-size-select"
              name="pageSize"
              aria-label="Select rows per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-wa-dsurf border border-gray-200 dark:border-wa-dbdr rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-wa-teal/30 text-gray-700 dark:text-wa-dtext"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
            <span className="hidden sm:inline">|</span>
            <span>
              Showing {Math.min(startIndex + 1, totalItems)}–{Math.min(endIndex, totalItems)} of {totalItems}<span className="hidden sm:inline"> messages</span>
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-wa-dbdr text-xs font-semibold text-gray-600 dark:text-wa-dmuted bg-white dark:bg-wa-dsurf hover:bg-gray-50 dark:hover:bg-wa-dbdr/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              « <span className="hidden sm:inline">First</span>
            </button>

            {/* Prev Page */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-wa-dbdr text-xs font-semibold text-gray-600 dark:text-wa-dmuted bg-white dark:bg-wa-dsurf hover:bg-gray-50 dark:hover:bg-wa-dbdr/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              ‹ <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page info */}
            <span className="text-xs font-medium text-gray-700 dark:text-wa-dtext px-2">
              Page {currentPage} of {totalPages}
            </span>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-wa-dbdr text-xs font-semibold text-gray-600 dark:text-wa-dmuted bg-white dark:bg-wa-dsurf hover:bg-gray-50 dark:hover:bg-wa-dbdr/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span> ›
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-wa-dbdr text-xs font-semibold text-gray-600 dark:text-wa-dmuted bg-white dark:bg-wa-dsurf hover:bg-gray-50 dark:hover:bg-wa-dbdr/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <span className="hidden sm:inline">Last</span> »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
