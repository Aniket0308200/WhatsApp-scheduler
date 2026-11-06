/**
 * timezoneHelper.js
 * Comprehensive timezone utilities using standard Web Intl APIs.
 * Supports auto-detection of user location/browser timezone and global timezone conversion.
 */

// ─── 1. Popular Global Timezones ──────────────────────────────────────────────
export const POPULAR_TIMEZONES = [
  { id: 'Asia/Kolkata', label: 'India (IST)', flag: '🇮🇳', region: 'Asia' },
  { id: 'America/New_York', label: 'US Eastern (New York, EST/EDT)', flag: '🇺🇸', region: 'Americas' },
  { id: 'America/Chicago', label: 'US Central (Chicago, CST/CDT)', flag: '🇺🇸', region: 'Americas' },
  { id: 'America/Denver', label: 'US Mountain (Denver, MST/MDT)', flag: '🇺🇸', region: 'Americas' },
  { id: 'America/Los_Angeles', label: 'US Pacific (Los Angeles, PST/PDT)', flag: '🇺🇸', region: 'Americas' },
  { id: 'Europe/London', label: 'United Kingdom (London, GMT/BST)', flag: '🇬🇧', region: 'Europe' },
  { id: 'Europe/Paris', label: 'Central Europe (Paris/Berlin, CET/CEST)', flag: '🇪🇺', region: 'Europe' },
  { id: 'Asia/Dubai', label: 'United Arab Emirates (Dubai, GST)', flag: '🇦🇪', region: 'Middle East' },
  { id: 'Asia/Riyadh', label: 'Saudi Arabia (Riyadh, AST)', flag: '🇸🇦', region: 'Middle East' },
  { id: 'Asia/Singapore', label: 'Singapore / Malaysia (SGT)', flag: '🇸🇬', region: 'Asia' },
  { id: 'Asia/Tokyo', label: 'Japan (Tokyo, JST)', flag: '🇯🇵', region: 'Asia' },
  { id: 'Australia/Sydney', label: 'Australia (Sydney, AEST/AEDT)', flag: '🇦🇺', region: 'Oceania' },
  { id: 'America/Toronto', label: 'Canada (Toronto, EST/EDT)', flag: '🇨🇦', region: 'Americas' },
  { id: 'America/Vancouver', label: 'Canada (Vancouver, PST/PDT)', flag: '🇨🇦', region: 'Americas' },
  { id: 'Asia/Karachi', label: 'Pakistan (Karachi, PKT)', flag: '🇵🇰', region: 'Asia' },
  { id: 'Asia/Dhaka', label: 'Bangladesh (Dhaka, BST)', flag: '🇧🇩', region: 'Asia' },
  { id: 'Asia/Kathmandu', label: 'Nepal (Kathmandu, NPT)', flag: '🇳🇵', region: 'Asia' },
  { id: 'Asia/Colombo', label: 'Sri Lanka (Colombo, SLST)', flag: '🇱🇰', region: 'Asia' },
  { id: 'Africa/Johannesburg', label: 'South Africa (Johannesburg, SAST)', flag: '🇿🇦', region: 'Africa' },
  { id: 'America/Sao_Paulo', label: 'Brazil (Sao Paulo, BRT)', flag: '🇧🇷', region: 'Americas' },
  { id: 'Europe/Moscow', label: 'Russia (Moscow, MSK)', flag: '🇷🇺', region: 'Europe' },
  { id: 'UTC', label: 'Coordinated Universal Time (UTC)', flag: '🌐', region: 'Universal' },
];

// ─── 2. Get All Available IANA Timezones ──────────────────────────────────────
export function getAllSupportedTimezones() {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf('timeZone');
    }
  } catch {
    // Fallback if unsupported
  }
  return POPULAR_TIMEZONES.map((p) => p.id);
}

// ─── 3. Auto-detect User Live Location / Browser Timezone ─────────────────────
export function getUserTimeZone() {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('wa_user_timezone') : null;
    if (saved) return saved;
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (resolved) return resolved;
    }
  } catch (err) {
    console.warn('[Timezone] Error resolving timezone:', err);
  }
  return 'Asia/Kolkata';
}

// ─── 4. Extract GMT Offset (e.g. 'GMT+5:30', 'GMT-5') ────────────────────────
export function getTimeZoneOffset(timeZone, date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value;
    return tzName || 'GMT';
  } catch {
    return 'GMT';
  }
}

// Helper: Parse offset string like 'GMT+5:30' or 'GMT-5' into minutes
function parseOffsetToMinutes(offsetStr) {
  if (!offsetStr || offsetStr === 'GMT' || offsetStr === 'UTC') return 0;
  const match = offsetStr.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const mins = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours * 60 + mins);
}

// ─── 5. Convert Local Target Time in Any Timezone to Exact UTC Date ───────────
export function zonedTimeToUtc(dateStr, timeZone = getUserTimeZone()) {
  if (!dateStr) return new Date();
  try {
    const clean = String(dateStr).replace(' ', 'T');
    const [datePart, timePart] = clean.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [h, min, s] = (timePart || '00:00:00').split(':').map(Number);

    const approxUtc = new Date(Date.UTC(y, m - 1, d, h, min, s || 0));
    const offsetStr = getTimeZoneOffset(timeZone, approxUtc);
    const offsetMinutes = parseOffsetToMinutes(offsetStr);

    return new Date(approxUtc.getTime() - offsetMinutes * 60 * 1000);
  } catch (err) {
    console.warn('[Timezone] Conversion error, fallback to Date:', err);
    return new Date(dateStr);
  }
}

// ─── 6. Get Current Date & Time string 'YYYY-MM-DDTHH:mm:ss' in Specific Timezone ─
export function getNowInTimeZone(timeZone = getUserTimeZone()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date()).replace(', ', 'T');
  } catch {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}

// ─── 7. Format Date for Display in a Specific Timezone ────────────────────────
export function formatInTimeZone(dateInput, timeZone = getUserTimeZone()) {
  if (!dateInput) return '—';
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);

    const offset = getTimeZoneOffset(timeZone, date);
    return `${formatted} (${offset} • ${timeZone.split('/').pop().replace('_', ' ')})`;
  } catch {
    return String(dateInput);
  }
}

// ─── 8. Format UTC ISO string to User Timezone for Tables & History ────────────
export function formatUtcToZoned(val, timeZone = getUserTimeZone()) {
  if (!val) return '—';
  try {
    const normalized = String(val).includes('T') ? val : String(val).replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return val;

    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return val;
  }
}
