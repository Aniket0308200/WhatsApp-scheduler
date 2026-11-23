import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminGetAnalytics } from '../api';

// ─── Kolkata Time Date Helpers ───────────────────────────────────────────────
function getKolkataDateString(d = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  } catch {
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 3600000 * 5.5);
    return ist.toISOString().split('T')[0];
  }
}

function getOffsetDateKolkata(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return getKolkataDateString(d);
}

// ─── Preset Ranges (11 Options Matching User's Specification) ────────────────
const PRESET_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'today_and_yesterday', label: 'Today and yesterday' },
  { key: 'last_7_days', label: 'Last 7 days' },
  { key: 'last_14_days', label: 'Last 14 days' },
  { key: 'last_28_days', label: 'Last 28 days' },
  { key: 'last_30_days', label: 'Last 30 days' },
  { key: 'this_week', label: 'This week' },
  { key: 'last_week', label: 'Last week' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'custom', label: 'Custom Calendar' }
];

function computeRangeForPreset(key) {
  const today = getOffsetDateKolkata(0);
  const yesterday = getOffsetDateKolkata(-1);

  switch (key) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday':
      return { start: yesterday, end: yesterday };
    case 'today_and_yesterday':
      return { start: yesterday, end: today };
    case 'last_7_days':
      return { start: getOffsetDateKolkata(-6), end: today };
    case 'last_14_days':
      return { start: getOffsetDateKolkata(-13), end: today };
    case 'last_28_days':
      return { start: getOffsetDateKolkata(-27), end: today };
    case 'last_30_days':
      return { start: getOffsetDateKolkata(-29), end: today };
    case 'this_week': {
      const now = new Date();
      const day = now.getDay();
      const diffToMon = day === 0 ? 6 : day - 1;
      return { start: getOffsetDateKolkata(-diffToMon), end: today };
    }
    case 'last_week': {
      const now = new Date();
      const day = now.getDay();
      const diffToMon = day === 0 ? 6 : day - 1;
      return { start: getOffsetDateKolkata(-diffToMon - 7), end: getOffsetDateKolkata(-diffToMon - 1) };
    }
    case 'this_month': {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      return { start: `${y}-${m}-01`, end: today };
    }
    case 'last_month': {
      const now = new Date();
      let y = now.getFullYear();
      let m = now.getMonth();
      if (m === 0) {
        m = 12;
        y -= 1;
      }
      const mStr = String(m).padStart(2, '0');
      const lastDay = new Date(y, m, 0).getDate();
      return { start: `${y}-${mStr}-01`, end: `${y}-${mStr}-${String(lastDay).padStart(2, '0')}` };
    }
    default:
      return { start: getOffsetDateKolkata(-29), end: today };
  }
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parseInt(parts[2], 10)} ${months[mIdx]} ${parts[0]}`;
    }
  } catch {}
  return dateStr;
}

// ─── Compact Cloudflare-Style SVG Area Chart Component ───────────────────────
function CloudflareChart({
  title,
  subtitle,
  metricKey,
  data = [],
  color = '#38bdf8',
  secondaryKey = null,
  secondaryColor = '#a855f7',
  secondaryTitle = '',
  totalValue = 0,
  secondaryTotal = 0,
  height = 115
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  // Compute Max Y for scaling
  const maxY = useMemo(() => {
    let max = 0;
    for (const d of data) {
      const val1 = Number(d[metricKey] || 0);
      const val2 = secondaryKey ? Number(d[secondaryKey] || 0) : 0;
      if (val1 > max) max = val1;
      if (val2 > max) max = val2;
    }
    if (max === 0) return 5;
    return Math.ceil(max * 1.15);
  }, [data, metricKey, secondaryKey]);

  // Generate SVG Points (Tightly scaled)
  const svgWidth = 800;
  const paddingLeft = 34;
  const paddingRight = 10;
  const paddingTop = 8;
  const paddingBottom = 20;

  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = height - paddingTop - paddingBottom;

  const pointsPrimary = useMemo(() => {
    if (!data.length) return [];
    return data.map((d, i) => {
      const x = paddingLeft + (i / Math.max(1, data.length - 1)) * chartInnerWidth;
      const val = Number(d[metricKey] || 0);
      const y = paddingTop + chartInnerHeight - (val / maxY) * chartInnerHeight;
      return { x, y, val, date: d.date };
    });
  }, [data, metricKey, maxY, chartInnerWidth, chartInnerHeight, paddingLeft, paddingTop]);

  const pointsSecondary = useMemo(() => {
    if (!secondaryKey || !data.length) return [];
    return data.map((d, i) => {
      const x = paddingLeft + (i / Math.max(1, data.length - 1)) * chartInnerWidth;
      const val = Number(d[secondaryKey] || 0);
      const y = paddingTop + chartInnerHeight - (val / maxY) * chartInnerHeight;
      return { x, y, val, date: d.date };
    });
  }, [data, secondaryKey, maxY, chartInnerWidth, chartInnerHeight, paddingLeft, paddingTop]);

  // Build Smooth Bezier Path
  const buildSmoothPath = (pts) => {
    if (!pts.length) return { line: '', area: '' };
    if (pts.length === 1) {
      const p = pts[0];
      return {
        line: `M ${p.x} ${p.y} L ${p.x + 1} ${p.y}`,
        area: `M ${p.x} ${p.y} L ${p.x + 1} ${p.y} L ${p.x + 1} ${paddingTop + chartInnerHeight} L ${p.x} ${paddingTop + chartInnerHeight} Z`
      };
    }

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const baseline = paddingTop + chartInnerHeight;
    const area = `${d} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`;
    return { line: d, area };
  };

  const primaryPaths = useMemo(() => buildSmoothPath(pointsPrimary), [pointsPrimary, chartInnerHeight, paddingTop]);
  const secondaryPaths = useMemo(() => buildSmoothPath(pointsSecondary), [pointsSecondary, chartInnerHeight, paddingTop]);

  // Y-axis grid ticks (3 ticks for clean compact fit)
  const yTicks = [
    0,
    Math.round(maxY * 0.5),
    maxY
  ];

  // X-axis date labels (5 labels)
  const xLabels = useMemo(() => {
    if (!data.length) return [];
    if (data.length <= 6) {
      return data.map((d, idx) => ({ idx, text: d.date.slice(5) }));
    }
    const step = Math.ceil(data.length / 5);
    const labels = [];
    for (let i = 0; i < data.length; i += step) {
      labels.push({ idx: i, text: data[i].date.slice(5) });
    }
    if (labels[labels.length - 1].idx !== data.length - 1) {
      labels.push({ idx: data.length - 1, text: data[data.length - 1].date.slice(5) });
    }
    return labels;
  }, [data]);

  const activePoint = hoverIndex !== null && pointsPrimary[hoverIndex] ? pointsPrimary[hoverIndex] : null;
  const activeSecPoint = hoverIndex !== null && pointsSecondary[hoverIndex] ? pointsSecondary[hoverIndex] : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-md relative overflow-hidden transition-all hover:border-slate-700">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-baseline gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <h4 className="text-xs font-bold text-slate-200 truncate">{title}</h4>
          <span className="text-base sm:text-lg font-black text-white tracking-tight ml-1">
            {totalValue.toLocaleString()}
          </span>
          {secondaryKey && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium ml-1">
              vs <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
              {secondaryTitle}: <strong className="text-purple-300 font-bold">{secondaryTotal.toLocaleString()}</strong>
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: color }} />
            <span className="font-medium truncate max-w-[70px] sm:max-w-none">{title}</span>
          </div>
          {secondaryKey && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: secondaryColor }} />
              <span className="font-medium truncate max-w-[70px] sm:max-w-none">{secondaryTitle}</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            if (relX >= paddingLeft && relX <= paddingLeft + chartInnerWidth) {
              const ratio = (relX - paddingLeft) / chartInnerWidth;
              const idx = Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1))));
              setHoverIndex(idx);
            }
          }}
        >
          <defs>
            <linearGradient id={`grad-${metricKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.30" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
            {secondaryKey && (
              <linearGradient id={`grad-${secondaryKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.01" />
              </linearGradient>
            )}
          </defs>

          {/* Horizontal Grid Lines */}
          {yTicks.map((tick, i) => {
            const y = paddingTop + chartInnerHeight - (tick / maxY) * chartInnerHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartInnerWidth}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="2 2"
                  strokeWidth="0.6"
                />
                <text
                  x={paddingLeft - 5}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Secondary Area & Line (if comparison mode) */}
          {secondaryKey && secondaryPaths.area && (
            <path d={secondaryPaths.area} fill={`url(#grad-${secondaryKey})`} />
          )}
          {secondaryKey && secondaryPaths.line && (
            <path
              d={secondaryPaths.line}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Primary Area & Line */}
          {primaryPaths.area && (
            <path d={primaryPaths.area} fill={`url(#grad-${metricKey})`} />
          )}
          {primaryPaths.line && (
            <path
              d={primaryPaths.line}
              fill="none"
              stroke={color}
              strokeWidth="2.0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis Date Labels */}
          {xLabels.map((lbl, i) => {
            const x = paddingLeft + (lbl.idx / Math.max(1, data.length - 1)) * chartInnerWidth;
            return (
              <text
                key={i}
                x={x}
                y={height - 4}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
                fontFamily="sans-serif"
              >
                {lbl.text}
              </text>
            );
          })}

          {/* Hover Crosshair & Dots */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={paddingTop + chartInnerHeight}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="3"
                fill={color}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              {activeSecPoint && (
                <circle
                  cx={activeSecPoint.x}
                  cy={activeSecPoint.y}
                  r="3"
                  fill={secondaryColor}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Card */}
        {activePoint && hoverIndex !== null && data[hoverIndex] && (
          <div
            className="absolute top-1 pointer-events-none z-10 bg-slate-950/95 border border-slate-700/80 shadow-xl rounded-lg px-2 py-1 text-[10px] backdrop-blur-md transition-all duration-75"
            style={{
              left: `${Math.min(85, Math.max(15, (activePoint.x / svgWidth) * 100))}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-bold text-slate-300 border-b border-slate-800 pb-0.5 mb-0.5">
              📅 {formatDateDisplay(data[hoverIndex].date)}
            </div>
            <div className="flex items-center justify-between gap-3 py-0.2">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                {title}:
              </span>
              <strong className="text-white font-mono font-bold">
                {data[hoverIndex][metricKey] || 0}
              </strong>
            </div>
            {secondaryKey && (
              <div className="flex items-center justify-between gap-3 py-0.2">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
                  {secondaryTitle}:
                </span>
                <strong className="text-purple-300 font-mono font-bold">
                  {data[hoverIndex][secondaryKey] || 0}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main AdminAnalyticsTab Component ────────────────────────────────────────
export default function AdminAnalyticsTab({ token }) {
  // Preset selection
  const [selectedPreset, setSelectedPreset] = useState('last_30_days');
  const [dateRange, setDateRange] = useState(() => computeRangeForPreset('last_30_days'));

  // Calendar Modal State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [tempPreset, setTempPreset] = useState('last_30_days');
  const [tempStart, setTempStart] = useState(() => computeRangeForPreset('last_30_days').start);
  const [tempEnd, setTempEnd] = useState(() => computeRangeForPreset('last_30_days').end);

  // View Mode: 'all' | 'compare' | 'unique' | 'views' | 'logins' | 'whatsapp'
  const [viewMode, setViewMode] = useState('all');

  // Data states
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBreakdownTable, setShowBreakdownTable] = useState(false);

  // Fetch Analytics from Backend
  const fetchAnalytics = useCallback(async (start, end) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminGetAnalytics(token, {
        startDate: start,
        endDate: end
      });
      if (res && res.success) {
        setAnalyticsData(res);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch analytics data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial fetch and when dateRange changes
  useEffect(() => {
    fetchAnalytics(dateRange.start, dateRange.end);
  }, [fetchAnalytics, dateRange.start, dateRange.end]);

  // Handle Modal Open
  const handleOpenCalendarModal = () => {
    setTempPreset(selectedPreset);
    setTempStart(dateRange.start);
    setTempEnd(dateRange.end);
    setShowCalendarModal(true);
  };

  // When radio preset is selected in modal
  const handleSelectTempPreset = (key) => {
    setTempPreset(key);
    if (key !== 'custom') {
      const computed = computeRangeForPreset(key);
      setTempStart(computed.start);
      setTempEnd(computed.end);
    }
  };

  // Apply button inside modal
  const handleApplyRange = () => {
    if (!tempStart || !tempEnd) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (tempStart > tempEnd) {
      toast.error('Start date cannot be after end date.');
      return;
    }
    setSelectedPreset(tempPreset);
    setDateRange({ start: tempStart, end: tempEnd });
    setShowCalendarModal(false);
    toast.success('Analytics date range updated.');
  };

  const summary = analyticsData?.summary || {
    totalViews: 0,
    uniqueVisitors: 0,
    logins: 0,
    whatsappConnected: 0,
    visitorToLoginRate: 0,
    loginToWaRate: 0
  };

  const timeline = analyticsData?.timeline || [];

  const currentPresetLabel = useMemo(() => {
    const found = PRESET_OPTIONS.find(p => p.key === selectedPreset);
    return found ? found.label : 'Custom Range';
  }, [selectedPreset]);

  return (
    <div className="space-y-3.5">
      {/* ── Top Bar: Range Selector & Controls ─────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        {/* Title & Kolkata Timezone Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <h3 className="text-sm sm:text-base font-bold text-white">Traffic & Conversion Analytics</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time clicks, logins & WhatsApp funnels • <strong className="text-emerald-400 font-semibold">Asia/Kolkata Time (IST)</strong>
          </p>
        </div>

        {/* Date Range Button & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Date Picker Button (Google Ads style trigger) */}
          <button
            type="button"
            onClick={handleOpenCalendarModal}
            className="flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-500 text-xs text-slate-200 font-bold transition-all shadow group"
          >
            <span className="text-slate-400 group-hover:text-emerald-400 transition-colors">📅</span>
            <span>
              {formatDateDisplay(dateRange.start)} – {formatDateDisplay(dateRange.end)}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-emerald-400 font-bold border border-slate-700">
              {currentPresetLabel}
            </span>
            <span className="text-slate-500 text-[9px]">▼</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            disabled={loading}
            onClick={() => fetchAnalytics(dateRange.start, dateRange.end)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
            title="Refresh Analytics"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Summary Funnel Metric Cards (Compact 2x2 on Mobile, 4 in row on Desktop) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Unique Visitors */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-md hover:border-sky-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-sky-400 flex items-center gap-1">
              <span>👤</span> Unique Visitors
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/80 font-bold">
              Unique
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            {summary.uniqueVisitors.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            Distinct individuals visiting per day
          </p>
        </div>

        {/* Card 2: Total Page Views / Clicks */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-md hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-indigo-400 flex items-center gap-1">
              <span>👁️</span> Total Clicks
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-bold">
              Hits
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            {summary.totalViews.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            Total page opens & repeat loads
          </p>
        </div>

        {/* Card 3: User Logins / Signups */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-md hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span>🔑</span> Logins / Signups
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold">
              {summary.visitorToLoginRate}% conv.
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            {summary.logins.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            Accounts logged in or registered
          </p>
        </div>

        {/* Card 4: WhatsApp Connected */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-md hover:border-green-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-green-400 flex items-center gap-1">
              <span>📱</span> WhatsApp Connected
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-950 text-green-300 border border-green-800/80 font-bold">
              {summary.loginToWaRate}% of users
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            {summary.whatsappConnected.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            QR scanned & live WhatsApp sessions
          </p>
        </div>
      </div>

      {/* ── View Toggle Pills ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
        <span className="text-slate-400 font-medium whitespace-nowrap mr-1 text-[10px]">View:</span>
        <button
          type="button"
          onClick={() => setViewMode('all')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all ${
            viewMode === 'all'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          📊 All 4 Graphs (Grid)
        </button>
        <button
          type="button"
          onClick={() => setViewMode('compare')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all ${
            viewMode === 'compare'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          👥 Unique vs Total Clicks
        </button>
        <button
          type="button"
          onClick={() => setViewMode('unique')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all ${
            viewMode === 'unique'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          👤 Unique Visitors
        </button>
        <button
          type="button"
          onClick={() => setViewMode('views')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all ${
            viewMode === 'views'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          👁️ Total Clicks
        </button>
        <button
          type="button"
          onClick={() => setViewMode('logins')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all ${
            viewMode === 'logins'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          🔑 Logins
        </button>
        <button
          type="button"
          onClick={() => setViewMode('whatsapp')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all ${
            viewMode === 'whatsapp'
              ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          📱 WhatsApp
        </button>
      </div>

      {/* ── Graphs Container: 2x2 Compact Grid (All 4 fit onto screen at once!) ── */}
      <div>
        {/* Comparison Mode (Unique Visitors vs Total Clicks) */}
        {viewMode === 'compare' && (
          <CloudflareChart
            title="Unique Visitors"
            subtitle="Distinct People"
            metricKey="uniqueVisitors"
            color="#38bdf8"
            secondaryKey="totalViews"
            secondaryTitle="Total Clicks / Page Views"
            secondaryColor="#a855f7"
            totalValue={summary.uniqueVisitors}
            secondaryTotal={summary.totalViews}
            data={timeline}
            height={150}
          />
        )}

        {/* 2x2 Grid Mode: All 4 Panels visible at once without scrolling! */}
        {viewMode === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Panel 1: Unique Visitors */}
            <CloudflareChart
              title="Unique Visitors"
              subtitle="Distinct People"
              metricKey="uniqueVisitors"
              color="#38bdf8"
              totalValue={summary.uniqueVisitors}
              data={timeline}
              height={115}
            />

            {/* Panel 2: Total Page Views / Clicks */}
            <CloudflareChart
              title="Total Requests & Clicks"
              subtitle="Page Views"
              metricKey="totalViews"
              color="#818cf8"
              totalValue={summary.totalViews}
              data={timeline}
              height={115}
            />

            {/* Panel 3: User Logins / Signups */}
            <CloudflareChart
              title="User Logins & Signups"
              subtitle="Authenticated"
              metricKey="logins"
              color="#10b981"
              totalValue={summary.logins}
              data={timeline}
              height={115}
            />

            {/* Panel 4: WhatsApp Connected */}
            <CloudflareChart
              title="WhatsApp Connected"
              subtitle="Live Sockets"
              metricKey="whatsappConnected"
              color="#22c55e"
              totalValue={summary.whatsappConnected}
              data={timeline}
              height={115}
            />
          </div>
        )}

        {/* Single Panel Modes */}
        {viewMode === 'unique' && (
          <CloudflareChart
            title="Unique Visitors"
            subtitle="Distinct People"
            metricKey="uniqueVisitors"
            color="#38bdf8"
            totalValue={summary.uniqueVisitors}
            data={timeline}
            height={150}
          />
        )}

        {viewMode === 'views' && (
          <CloudflareChart
            title="Total Requests & Clicks"
            subtitle="Page Views"
            metricKey="totalViews"
            color="#818cf8"
            totalValue={summary.totalViews}
            data={timeline}
            height={150}
          />
        )}

        {viewMode === 'logins' && (
          <CloudflareChart
            title="User Logins & Signups"
            subtitle="Authenticated"
            metricKey="logins"
            color="#10b981"
            totalValue={summary.logins}
            data={timeline}
            height={150}
          />
        )}

        {viewMode === 'whatsapp' && (
          <CloudflareChart
            title="WhatsApp Connected"
            subtitle="Live Sockets"
            metricKey="whatsappConnected"
            color="#22c55e"
            totalValue={summary.whatsappConnected}
            data={timeline}
            height={150}
          />
        )}
      </div>

      {/* ── Day-by-Day Data Breakdown Toggle & Table ───────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => setShowBreakdownTable(!showBreakdownTable)}
          className="w-full p-3 flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span>Day-by-Day Detailed Log Table ({timeline.length} Days)</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">
            {showBreakdownTable ? '▲ Hide' : '▼ View'}
          </span>
        </button>

        {showBreakdownTable && (
          <div className="overflow-x-auto border-t border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 font-bold">Date (IST)</th>
                  <th className="py-2 px-3 font-bold">Unique Visitors</th>
                  <th className="py-2 px-3 font-bold">Total Clicks</th>
                  <th className="py-2 px-3 font-bold">Logins</th>
                  <th className="py-2 px-3 font-bold">WhatsApp Connected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {timeline.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-1.5 px-3 text-slate-300 font-sans font-medium">
                      {formatDateDisplay(row.date)}
                    </td>
                    <td className="py-1.5 px-3 text-sky-400 font-bold">
                      {row.uniqueVisitors}
                    </td>
                    <td className="py-1.5 px-3 text-indigo-400 font-bold">
                      {row.totalViews}
                    </td>
                    <td className="py-1.5 px-3 text-emerald-400 font-bold">
                      {row.logins}
                    </td>
                    <td className="py-1.5 px-3 text-green-400 font-bold">
                      {row.whatsappConnected}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Google Ads Style Date Range Modal (Image 2) ────────────────────────── */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <h3 className="text-sm font-bold text-white">Select Date Range</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Left Presets Radio List + Right Custom Range Inputs */}
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {/* Left Pane: Preset Radio Buttons */}
              <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-slate-800 p-2.5 sm:p-3 bg-slate-950/60 space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                  Preset Options
                </p>
                <div className="space-y-0.5">
                  {PRESET_OPTIONS.map((opt) => (
                    <label
                      key={opt.key}
                      onClick={() => handleSelectTempPreset(opt.key)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        tempPreset === opt.key
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="preset_radio"
                        checked={tempPreset === opt.key}
                        onChange={() => handleSelectTempPreset(opt.key)}
                        className="text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Right Pane: Custom Start and End Inputs & Preview */}
              <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Date Range Selection (Kolkata Time)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Start Date */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={tempStart}
                        onChange={(e) => {
                          setTempStart(e.target.value);
                          setTempPreset('custom');
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={tempEnd}
                        onChange={(e) => {
                          setTempEnd(e.target.value);
                          setTempPreset('custom');
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Range Preview Badge */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400">Selected Range:</p>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {formatDateDisplay(tempStart)} ➔ {formatDateDisplay(tempEnd)}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
                      {tempPreset === 'custom' ? 'Custom Calendar' : PRESET_OPTIONS.find(p => p.key === tempPreset)?.label || 'Custom'}
                    </span>
                  </div>
                </div>

                {/* Kolkata Timezone Footnote */}
                <div className="pt-1">
                  <p className="text-[10px] text-slate-400 italic flex items-center gap-1">
                    <span>🕒</span> Dates are shown in Kolkata Time (Asia/Kolkata, IST)
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer: Cancel and Update buttons */}
            <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyRange}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 active:scale-95"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
