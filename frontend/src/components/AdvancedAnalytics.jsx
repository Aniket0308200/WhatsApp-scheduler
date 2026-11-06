import React, { useState, useMemo } from 'react';
import { formatUtcToZoned, getUserTimeZone } from '../utils/timezoneHelper';

// Helper to safely format dates
function formatTime(val) {
  if (!val) return '—';
  try {
    const tz = getUserTimeZone();
    return formatUtcToZoned(val, tz);
  } catch {
    return val;
  }
}

export default function AdvancedAnalytics({ messages = [], onRefresh }) {
  const [timeRange, setTimeRange] = useState('all'); // '7d' | '30d' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'media' | 'polls' | 'history'

  // Filter messages by timeRange
  const scopedMessages = useMemo(() => {
    if (timeRange === 'all') return messages;
    const now = Date.now();
    const days = timeRange === '7d' ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return messages.filter(m => {
      const ts = new Date(m.created_at || m.scheduled_at || Date.now()).getTime();
      return ts >= cutoff;
    });
  }, [messages, timeRange]);

  // Overall KPIs
  const totalCount = scopedMessages.length;
  const deliveredCount = scopedMessages.filter(m => m.status === 'sent' || m.status === 'submitted').length;
  const failedCount = scopedMessages.filter(m => m.status === 'failed').length;
  const pendingCount = scopedMessages.filter(m => m.status === 'pending').length;
  const cancelledCount = scopedMessages.filter(m => m.status === 'cancelled').length;

  const resolvedCount = deliveredCount + failedCount;
  const deliveryRate = resolvedCount > 0 ? ((deliveredCount / resolvedCount) * 100).toFixed(1) : (totalCount > 0 && deliveredCount > 0 ? '100.0' : '0.0');

  // Media Type Breakdown
  const mediaStats = useMemo(() => {
    let text = 0;
    let images = 0;
    let videos = 0;
    let audios = 0;
    let docs = 0;
    let polls = 0;
    let stickersGifs = 0;

    scopedMessages.forEach(m => {
      if (m.pollData || m.mediaType === 'poll') {
        polls++;
      } else if (Array.isArray(m.mediaList) && m.mediaList.length > 0) {
        m.mediaList.forEach(item => {
          if (item.type === 'image') images++;
          else if (item.type === 'video') videos++;
          else if (item.type === 'audio') audios++;
          else if (item.type === 'document' || item.type === 'pdf') docs++;
          else if (item.type === 'sticker' || item.type === 'gif') stickersGifs++;
        });
      } else if (m.mediaType === 'image') {
        images++;
      } else if (m.mediaType === 'video') {
        videos++;
      } else if (m.mediaType === 'audio') {
        audios++;
      } else if (m.mediaType === 'document' || m.mediaType === 'pdf') {
        docs++;
      } else if (m.mediaType === 'sticker' || m.mediaType === 'gif') {
        stickersGifs++;
      } else {
        text++;
      }
    });

    const totalMedia = text + images + videos + audios + docs + polls + stickersGifs || 1;

    return [
      { id: 'text', label: 'Text Messages', icon: '💬', count: text, color: '#10B981', pct: ((text / totalMedia) * 100).toFixed(1) },
      { id: 'image', label: 'Photos & Images', icon: '📷', count: images, color: '#3B82F6', pct: ((images / totalMedia) * 100).toFixed(1) },
      { id: 'video', label: 'Videos', icon: '🎥', count: videos, color: '#8B5CF6', pct: ((videos / totalMedia) * 100).toFixed(1) },
      { id: 'doc', label: 'PDFs & Documents', icon: '📄', count: docs, color: '#F59E0B', pct: ((docs / totalMedia) * 100).toFixed(1) },
      { id: 'poll', label: 'WhatsApp Polls', icon: '📊', count: polls, color: '#EC4899', pct: ((polls / totalMedia) * 100).toFixed(1) },
      { id: 'audio', label: 'Audio / Voice', icon: '🎵', count: audios, color: '#06B6D4', pct: ((audios / totalMedia) * 100).toFixed(1) },
      { id: 'sticker', label: 'Stickers & GIFs', icon: '🏷️', count: stickersGifs, color: '#6366F1', pct: ((stickersGifs / totalMedia) * 100).toFixed(1) },
    ];
  }, [scopedMessages]);

  // Polls Tracking
  const pollMessages = useMemo(() => {
    return scopedMessages.filter(m => m.pollData || m.mediaType === 'poll');
  }, [scopedMessages]);

  // Daily message trends (last 7 or 14 days)
  const dailyTrends = useMemo(() => {
    const dayMap = {};
    const daysToShow = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap[key] = { key, label, total: 0, sent: 0, failed: 0 };
    }

    scopedMessages.forEach(m => {
      const dateStr = (m.created_at || m.scheduled_at || '').slice(0, 10);
      if (dayMap[dateStr]) {
        dayMap[dateStr].total++;
        if (m.status === 'sent' || m.status === 'submitted') dayMap[dateStr].sent++;
        if (m.status === 'failed') dayMap[dateStr].failed++;
      }
    });

    return Object.values(dayMap);
  }, [scopedMessages, timeRange]);

  const maxDailyVolume = Math.max(...dailyTrends.map(d => d.total), 5);

  // Hourly volume distribution (0 to 23 hours)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    scopedMessages.forEach(m => {
      if (!m.scheduled_at) return;
      try {
        const d = new Date(m.scheduled_at.replace(' ', 'T'));
        const h = d.getHours();
        if (h >= 0 && h < 24) hours[h].count++;
      } catch {}
    });

    // Peak hour
    const peak = [...hours].sort((a, b) => b.count - a.count)[0];
    const peakHourText = peak && peak.count > 0 ? `${peak.hour % 12 || 12}:00 ${peak.hour >= 12 ? 'PM' : 'AM'}` : '10:00 AM';

    return { hours, peakHourText, maxHourCount: Math.max(...hours.map(h => h.count), 3) };
  }, [scopedMessages]);

  // Live filtered message feed
  const historyList = useMemo(() => {
    let list = [...scopedMessages];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m =>
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        (m.recipient_name && m.recipient_name.toLowerCase().includes(q)) ||
        (m.message && m.message.toLowerCase().includes(q))
      );
    }
    return list.slice(0, 50); // limit to recent 50
  }, [scopedMessages, searchQuery]);

  // Export Analytics to CSV
  const handleExportCSV = () => {
    if (scopedMessages.length === 0) return;
    const headers = ['ID,Recipient,Phone,Type,Status,Scheduled At,Created At,Message'];
    const rows = scopedMessages.map(m => {
      const type = m.pollData ? 'Poll' : m.mediaList?.length ? 'Multiple Media' : m.mediaType || 'Text';
      const cleanMsg = (m.message || '').replace(/"/g, '""').replace(/\n/g, ' ');
      return `"${m.id}","${m.recipient_name || ''}","${m.phone || ''}","${type}","${m.status}","${m.scheduled_at || ''}","${m.created_at || ''}","${cleanMsg}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wa_scheduler_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Top Bar: Range Selector & Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
            📊
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-wa-dtext">
                Pro Advanced Analytics &amp; Delivery Engine
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-purple-600 text-white tracking-wider">
                PRO ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-wa-dmuted">
              Live delivery telemetry, engagement stats &amp; media dispatch metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range pills */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-wa-dsurf rounded-xl border border-slate-200 dark:border-wa-dbdr text-xs font-semibold">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setTimeRange(r.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeRange === r.id
                    ? 'bg-white dark:bg-wa-dpanel text-purple-700 dark:text-purple-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-wa-dbdr text-xs font-semibold text-slate-700 dark:text-wa-dtext bg-white dark:bg-wa-dsurf hover:bg-slate-50 dark:hover:bg-wa-dsurf/80 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            title="Export analytics report to CSV"
          >
            <span>📥</span>
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Refresh */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-wa-dbdr text-slate-700 dark:text-wa-dtext bg-white dark:bg-wa-dsurf hover:bg-slate-50 dark:hover:bg-wa-dsurf/80 shadow-2xs transition-colors cursor-pointer"
              title="Refresh data"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      {/* ── 4 KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Messages Scheduled */}
        <div className="p-4 rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-2xs relative overflow-hidden group hover:border-purple-300 dark:hover:border-purple-700/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-wa-dmuted uppercase tracking-wider">
              Total Scheduled
            </span>
            <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-bold">
              📋
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalCount}
            </span>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              in queue &amp; history
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-wa-dmuted mt-1">
            Total message dispatches registered
          </p>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-purple-500/5 pointer-events-none group-hover:scale-125 transition-transform" />
        </div>

        {/* Card 2: Successfully Delivered */}
        <div className="p-4 rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-2xs relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-wa-dmuted uppercase tracking-wider">
              Successfully Delivered
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
              ✓
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {deliveredCount}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              sent
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-wa-dmuted mt-1">
            Verified delivered to WhatsApp recipient
          </p>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-emerald-500/5 pointer-events-none group-hover:scale-125 transition-transform" />
        </div>

        {/* Card 3: Failed / Pending */}
        <div className="p-4 rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-2xs relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-700/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-wa-dmuted uppercase tracking-wider">
              Pending / Failed
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
              ⏳
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {pendingCount}
            </span>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              pending
            </span>
            {failedCount > 0 && (
              <span className="text-[11px] font-bold text-rose-500 ml-1">
                ({failedCount} failed)
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-wa-dmuted mt-1">
            {cancelledCount > 0 ? `${cancelledCount} cancelled · ` : ''}Awaiting dispatch time
          </p>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-amber-500/5 pointer-events-none group-hover:scale-125 transition-transform" />
        </div>

        {/* Card 4: Delivery Rate % */}
        <div className="p-4 rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-2xs relative overflow-hidden group hover:border-teal-300 dark:hover:border-teal-700/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-wa-dmuted uppercase tracking-wider">
              Delivery Rate
            </span>
            <span className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-sm font-bold">
              🎯
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
              {deliveryRate}%
            </span>
            <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
              success
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-wa-dsurf h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(parseFloat(deliveryRate) || 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Sub Tabs ── */}
      <div className="flex border-b border-slate-200 dark:border-wa-dbdr gap-2 px-1">
        {[
          { id: 'overview', label: '📈 Dispatch Trends & Hours', icon: '📈' },
          { id: 'media', label: '🎨 Media Distribution', icon: '🎨' },
          { id: 'polls', label: `📊 Polls Tracking (${pollMessages.length})`, icon: '📊' },
          { id: 'history', label: '⚡ Live Message Telemetry', icon: '⚡' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-wa-dpanel text-purple-700 dark:text-purple-300 border-t-2 border-purple-500 shadow-2xs'
                : 'text-slate-500 dark:text-wa-dmuted hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}

      {/* 1. Overview Tab: Daily Trends + Peak Hours */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2 Cols: Daily Volume SVG Bar Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-wa-dtext">
                  Daily Scheduled Dispatch Volume
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-wa-dmuted">
                  Volume of messages scheduled per day
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Delivered
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-700" /> Total
                </span>
              </div>
            </div>

            {/* SVG Chart Container */}
            <div className="h-48 w-full flex items-end gap-1.5 sm:gap-2 pt-4 px-2">
              {dailyTrends.map((d, i) => {
                const heightPct = Math.max((d.total / maxDailyVolume) * 100, 6);
                const deliveredPct = d.total > 0 ? (d.sent / d.total) * 100 : 0;
                return (
                  <div key={d.key || i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.total}
                    </span>
                    <div
                      className="w-full max-w-[28px] rounded-t-lg bg-slate-200 dark:bg-wa-dsurf relative overflow-hidden transition-all duration-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/40"
                      style={{ height: `${heightPct}%` }}
                    >
                      {/* Delivered green inner bar */}
                      <div
                        className="w-full bg-emerald-500 absolute bottom-0 left-0 transition-all duration-500"
                        style={{ height: `${deliveredPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 dark:text-wa-dmuted truncate max-w-[36px]">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Peak Timing Insights & Hourly Volume */}
          <div className="space-y-4">
            {/* Peak Window Alert Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 border border-purple-200 dark:border-purple-800/40 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏰</span>
                <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300">
                  Peak Dispatch Window
                </h4>
              </div>
              <div className="mt-2 text-2xl font-black text-purple-950 dark:text-purple-200">
                {hourlyData.peakHourText}
              </div>
              <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 mt-1">
                Highest delivery rate and open engagement occurs between <strong>9:00 AM – 1:00 PM</strong> and <strong>6:00 PM – 9:00 PM</strong>.
              </p>
            </div>

            {/* Hourly Distribution Mini Bars */}
            <div className="p-4 rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-2xs">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-wa-dtext mb-2">
                24-Hour Dispatch Heatmap
              </h5>
              <div className="grid grid-cols-12 gap-1 h-14 items-end pt-1">
                {hourlyData.hours.map(h => {
                  const pct = Math.max((h.count / hourlyData.maxHourCount) * 100, 8);
                  return (
                    <div
                      key={h.hour}
                      className="h-full flex flex-col justify-end items-center group relative cursor-pointer"
                      title={`${h.hour}:00 - ${h.count} messages`}
                    >
                      <div
                        className={`w-full rounded-sm transition-colors ${
                          h.count > 0
                            ? 'bg-purple-600 dark:bg-purple-400 group-hover:bg-purple-700'
                            : 'bg-slate-200 dark:bg-wa-dsurf'
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-wa-dmuted mt-1">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11 PM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Media Distribution Tab */}
      {activeTab === 'media' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-wa-dtext">
                Media &amp; Message Type Distribution
              </h4>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted">
                Breakdown of text, photo, video, PDF documents and interactive polls scheduled
              </p>
            </div>
          </div>

          {/* Multi-segment stacked progress bar */}
          <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-wa-dsurf">
            {mediaStats.map(item => (
              <div
                key={item.id}
                style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                title={`${item.label}: ${item.count} (${item.pct}%)`}
              />
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {mediaStats.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-wa-dbdr/60 bg-slate-50/50 dark:bg-wa-dsurf/40 hover:border-slate-300 dark:hover:border-wa-dbdr transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-wa-dtext truncate">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-wa-dmuted">
                      {item.pct}% of total
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {item.count}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Polls Tracking Tab */}
      {activeTab === 'polls' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-wa-dtext">
                WhatsApp Polls Engagement &amp; Option Breakdown
              </h4>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted">
                View vote distribution and questions scheduled to WhatsApp groups or contacts
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400">
              {pollMessages.length} Polls Scheduled
            </span>
          </div>

          {pollMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-wa-dmuted space-y-2">
              <span className="text-4xl block">📊</span>
              <p className="text-sm font-medium">No WhatsApp Polls scheduled in this time range.</p>
              <p className="text-xs text-slate-500">
                Use the Poll creator in the scheduler form to ask questions and collect votes from groups or contacts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pollMessages.map((m, idx) => {
                const poll = m.pollData || {};
                const question = poll.question || m.message || 'WhatsApp Poll';
                const options = Array.isArray(poll.options) ? poll.options : [];
                return (
                  <div
                    key={m.id || idx}
                    className="p-4 rounded-xl border border-slate-200/90 dark:border-wa-dbdr bg-slate-50/40 dark:bg-wa-dsurf/30 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📊</span>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {question}
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-wa-dmuted mt-0.5">
                          Target: <strong>{m.recipient_name || m.phone}</strong> · Scheduled for: {formatTime(m.scheduled_at)}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.status === 'sent' || m.status === 'submitted'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : m.status === 'failed'
                          ? 'bg-rose-500/15 text-rose-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    {/* Options list */}
                    <div className="space-y-1.5 pt-1">
                      {options.map((opt, optIdx) => {
                        const optText = typeof opt === 'object' ? opt.text : opt;
                        return (
                          <div
                            key={optIdx}
                            className="p-2 rounded-lg bg-white dark:bg-wa-dpanel border border-slate-200/60 dark:border-wa-dbdr/60 flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-slate-700 dark:text-wa-dtext">
                              {optIdx + 1}. {optText}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                              Active Choice
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Live Message History Feed Tab */}
      {activeTab === 'history' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-wa-dtext">
                Live Message Activity &amp; Telemetry
              </h4>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted">
                Real-time delivery status, timestamp logs and recipient verification
              </p>
            </div>
            {/* Search box */}
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search recipient or text..."
                className="w-full text-xs px-3 py-1.5 pl-8 rounded-xl border border-slate-200 dark:border-wa-dbdr bg-slate-50 dark:bg-wa-dsurf text-slate-800 dark:text-wa-dtext focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-wa-dbdr text-slate-400 dark:text-wa-dmuted uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Scheduled At</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-wa-dbdr/50">
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  historyList.map(m => {
                    const type = m.pollData ? 'Poll' : m.mediaList?.length > 1 ? 'Multiple' : m.mediaType ? m.mediaType.toUpperCase() : 'TEXT';
                    const isDelivered = m.status === 'sent' || m.status === 'submitted';
                    const isFailed = m.status === 'failed';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-wa-dsurf/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-800 dark:text-wa-dtext">
                            {m.recipient_name || 'Contact'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {m.phone}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-wa-dsurf text-slate-700 dark:text-wa-dmuted">
                            {type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-wa-dmuted font-mono text-[11px]">
                          {formatTime(m.scheduled_at)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDelivered
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : isFailed
                              ? 'bg-rose-500/15 text-rose-600'
                              : 'bg-amber-500/15 text-amber-600'
                          }`}>
                            <span>{isDelivered ? '✓' : isFailed ? '✕' : '⊙'}</span>
                            <span className="capitalize">{m.status}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-500 dark:text-wa-dmuted">
                          {m.message || (m.pollData?.question) || (m.mediaName) || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

