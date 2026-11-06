import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, addMinutes, addSeconds, addHours, addDays, setHours, setMinutes, setSeconds, isValid } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getUserTimeZone,
  POPULAR_TIMEZONES,
  getAllSupportedTimezones,
  getTimeZoneOffset,
  formatInTimeZone,
} from '../utils/timezoneHelper';

/**
 * Universal DateTimePicker Component:
 * - Dynamic Timezone support: Auto-detects live location/browser timezone and allows picking any world timezone
 * - Native Calendar picker (type="date")
 * - Native Time picker with Seconds & AM/PM (type="time" step="1")
 * - Combined DateTime Local picker (type="datetime-local" step="1")
 * - Quick presets: +1 min, +5 min, +15 min, +30 min, +1 hour, Tomorrow 12 AM, Tomorrow 9 AM
 * - Live formatted Dispatch Time preview in selected timezone
 */
export default function DateTimePicker({
  value,
  onChange,
  min,
  timeConfirmed,
  setTimeConfirmed,
  timeZone: propTimeZone,
  onTimeZoneChange,
}) {
  // Timezone state (parent prop or internal with localStorage fallback)
  const [internalTimeZone, setInternalTimeZone] = useState(getUserTimeZone);
  const activeTimeZone = propTimeZone || internalTimeZone;

  const [showTzDropdown, setShowTzDropdown] = useState(false);
  const [tzSearch, setTzSearch] = useState('');
  const tzDropdownRef = useRef(null);

  // Close timezone dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (tzDropdownRef.current && !tzDropdownRef.current.contains(e.target)) {
        setShowTzDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectTimeZone = (tzId) => {
    if (onTimeZoneChange) {
      onTimeZoneChange(tzId);
    } else {
      setInternalTimeZone(tzId);
    }
    try {
      localStorage.setItem('wa_user_timezone', tzId);
    } catch {}
    setShowTzDropdown(false);
    setTzSearch('');
    toast.success(`Timezone updated to ${tzId.split('/').pop().replace('_', ' ')}`);
  };

  const handleDetectLiveLocation = () => {
    try {
      const live = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      handleSelectTimeZone(live);
      toast.success(`Live location detected: ${live}`);
    } catch {
      toast.error('Could not auto-detect location');
    }
  };

  // Parse value into a valid Date object or fallback to now + 5 min
  const getCurrentDate = () => {
    if (!value) return addMinutes(new Date(), 5);
    try {
      const normalized = value.replace(' ', 'T');
      const d = parseISO(normalized);
      if (isValid(d)) return d;
    } catch (e) {
      console.warn('Failed to parse date:', e);
    }
    return addMinutes(new Date(), 5);
  };

  const currentDate = getCurrentDate();

  // Format parts for native HTML inputs
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const timeStr = format(currentDate, 'HH:mm:ss');
  const datetimeLocalStr = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss");

  // Helper: Format Date object to "yyyy-MM-dd'T'HH:mm:ss"
  const formatToInternal = (dateObj) => {
    try {
      if (!dateObj || !isValid(dateObj)) return '';
      return format(dateObj, "yyyy-MM-dd'T'HH:mm:ss");
    } catch {
      return '';
    }
  };

  // Handler for Date change
  const handleDateChange = (newDateStr) => {
    if (!newDateStr) return;
    try {
      const combined = `${newDateStr}T${timeStr}`;
      const d = parseISO(combined);
      if (isValid(d)) {
        onChange(formatToInternal(d));
        if (d.getTime() > Date.now() + 5000) {
          setTimeConfirmed(true);
        } else {
          setTimeConfirmed(false);
        }
      }
    } catch (e) {
      console.error('Error changing date:', e);
    }
  };

  // Handler for Time change
  const handleTimeChange = (newTimeStr) => {
    if (!newTimeStr) return;
    try {
      const fullTime = newTimeStr.split(':').length === 2 ? `${newTimeStr}:00` : newTimeStr;
      const combined = `${dateStr}T${fullTime}`;
      const d = parseISO(combined);
      if (isValid(d)) {
        onChange(formatToInternal(d));
        if (d.getTime() > Date.now() + 5000) {
          setTimeConfirmed(true);
        } else {
          setTimeConfirmed(false);
        }
      }
    } catch (e) {
      console.error('Error changing time:', e);
    }
  };

  // Presets
  const applyPreset = (presetType) => {
    const now = new Date();
    const base = currentDate && isValid(currentDate) && currentDate > now ? currentDate : now;
    let target = base;

    switch (presetType) {
      case '1m':
        target = setSeconds(addMinutes(base, 1), 0);
        break;
      case '5m':
        target = setSeconds(addMinutes(base, 5), 0);
        break;
      case '15m':
        target = setSeconds(addMinutes(base, 15), 0);
        break;
      case '30m':
        target = setSeconds(addMinutes(base, 30), 0);
        break;
      case '1h':
        target = setSeconds(addHours(base, 1), 0);
        break;
      case 'tomorrow-12am':
        target = setSeconds(setMinutes(setHours(addDays(now, 1), 0), 0), 0);
        break;
      case 'tomorrow-9am':
        target = setSeconds(setMinutes(setHours(addDays(now, 1), 9), 0), 0);
        break;
      default:
        break;
    }

    onChange(formatToInternal(target));
    setTimeConfirmed(true);
    toast.success('Scheduled time updated & confirmed!');
  };

  // Filter timezones for search
  const allTzs = getAllSupportedTimezones();
  const filteredTzs = allTzs.filter((tz) => {
    const q = tzSearch.trim().toLowerCase();
    if (!q) return true;
    return tz.toLowerCase().includes(q);
  });

  const activeOffset = getTimeZoneOffset(activeTimeZone);
  const detectedDeviceTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata';
  const isLiveLocation = activeTimeZone === detectedDeviceTz;

  return (
    <div className="w-full space-y-3">
      {/* ── Timezone Selector & Live Location Header ────────────────────────── */}
      <div className="relative" ref={tzDropdownRef}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🌐</span>
            <div className="min-w-0">
              <span className="text-slate-500 dark:text-wa-dmuted font-medium text-[11px] block">
                Timezone:
              </span>
              <button
                type="button"
                onClick={() => setShowTzDropdown((p) => !p)}
                className="font-bold text-slate-800 dark:text-wa-dtext hover:text-wa-teal dark:hover:text-wa-green truncate flex items-center gap-1.5 transition-colors cursor-pointer text-left"
              >
                <span>{activeTimeZone.replace('_', ' ')}</span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-wa-green font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                  {activeOffset}
                </span>
                <span className="text-slate-400 text-[10px]">▼</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            {isLiveLocation ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-wa-green text-[10px] font-bold border border-emerald-300 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Location
              </span>
            ) : (
              <button
                type="button"
                onClick={handleDetectLiveLocation}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-wa-dpanel hover:bg-slate-50 text-slate-700 dark:text-wa-dtext text-[10px] font-semibold border border-slate-200 dark:border-wa-dbdr shadow-xs transition-colors"
                title="Reset to your computer's local timezone"
              >
                📍 Use My Location
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowTzDropdown((p) => !p)}
              className="px-2.5 py-1 rounded-lg bg-wa-teal hover:bg-emerald-600 text-white text-[10px] font-bold transition-colors"
            >
              Change
            </button>
          </div>
        </div>

        {/* Timezone Dropdown Popup */}
        {showTzDropdown && (
          <div className="absolute inset-x-0 top-full mt-1.5 z-50 p-3 bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-wa-dbdr/60">
              <span className="text-xs font-bold text-slate-800 dark:text-wa-dtext">
                Select Country / Timezone
              </span>
              <button
                type="button"
                onClick={() => setShowTzDropdown(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              autoFocus
              value={tzSearch}
              onChange={(e) => setTzSearch(e.target.value)}
              placeholder="Search city, country or region (e.g. New York, London, Dubai)..."
              className="w-full px-3 py-1.5 mb-2 rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-xs text-slate-800 dark:text-wa-dtext placeholder-slate-400 focus:outline-none focus:border-wa-teal"
            />

            {/* Popular Timezones Quick Chips */}
            {!tzSearch && (
              <div className="mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-wa-dmuted mb-1 block">
                  Popular Regions:
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scroll">
                  {POPULAR_TIMEZONES.map((p) => {
                    const isSelected = activeTimeZone === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectTimeZone(p.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 border transition-all ${
                          isSelected
                            ? 'bg-wa-teal text-white border-wa-teal'
                            : 'bg-slate-100 dark:bg-wa-dsurf text-slate-700 dark:text-wa-dtext border-slate-200 dark:border-wa-dbdr hover:bg-slate-200'
                        }`}
                      >
                        <span>{p.flag}</span>
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full Timezones Scroll List */}
            <div className="max-h-48 overflow-y-auto custom-scroll flex flex-col gap-1 border-t border-slate-100 dark:border-wa-dbdr/60 pt-1.5">
              {filteredTzs.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No timezones matching "{tzSearch}"
                </div>
              ) : (
                filteredTzs.slice(0, 80).map((tz) => {
                  const isSelected = activeTimeZone === tz;
                  const offset = getTimeZoneOffset(tz);
                  return (
                    <button
                      key={tz}
                      type="button"
                      onClick={() => handleSelectTimeZone(tz)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-wa-green font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-wa-dsurf text-slate-700 dark:text-wa-dtext'
                      }`}
                    >
                      <span className="truncate">{tz.replace('_', ' ')}</span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-wa-dmuted shrink-0 ml-2">
                        {offset}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Presets Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll text-xs">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-wa-dmuted shrink-0">
          ⚡ Quick:
        </span>
        <button
          type="button"
          onClick={() => applyPreset('1m')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-wa-dsurf dark:hover:bg-wa-dbdr text-slate-700 dark:text-wa-dtext hover:text-emerald-600 dark:hover:text-wa-green border border-slate-200 dark:border-wa-dbdr shrink-0 transition-colors"
        >
          +1 min
        </button>
        <button
          type="button"
          onClick={() => applyPreset('5m')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-wa-dsurf dark:hover:bg-wa-dbdr text-slate-700 dark:text-wa-dtext hover:text-emerald-600 dark:hover:text-wa-green border border-slate-200 dark:border-wa-dbdr shrink-0 transition-colors"
        >
          +5 min
        </button>
        <button
          type="button"
          onClick={() => applyPreset('15m')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-wa-dsurf dark:hover:bg-wa-dbdr text-slate-700 dark:text-wa-dtext hover:text-emerald-600 dark:hover:text-wa-green border border-slate-200 dark:border-wa-dbdr shrink-0 transition-colors"
        >
          +15 min
        </button>
        <button
          type="button"
          onClick={() => applyPreset('30m')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-wa-dsurf dark:hover:bg-wa-dbdr text-slate-700 dark:text-wa-dtext hover:text-emerald-600 dark:hover:text-wa-green border border-slate-200 dark:border-wa-dbdr shrink-0 transition-colors"
        >
          +30 min
        </button>
        <button
          type="button"
          onClick={() => applyPreset('1h')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-wa-dsurf dark:hover:bg-wa-dbdr text-slate-700 dark:text-wa-dtext hover:text-emerald-600 dark:hover:text-wa-green border border-slate-200 dark:border-wa-dbdr shrink-0 transition-colors"
        >
          +1 hour
        </button>
        <button
          type="button"
          onClick={() => applyPreset('tomorrow-12am')}
          className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/60 dark:border-purple-800/40 shrink-0 hover:bg-purple-100 transition-colors"
        >
          🌙 Tomorrow 12 AM
        </button>
        <button
          type="button"
          onClick={() => applyPreset('tomorrow-9am')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-wa-dsurf dark:hover:bg-wa-dbdr text-slate-700 dark:text-wa-dtext hover:text-emerald-600 dark:hover:text-wa-green border border-slate-200 dark:border-wa-dbdr shrink-0 transition-colors"
        >
          ☀️ Tomorrow 9 AM
        </button>
      </div>

      {/* ── Native Calendar & Time Pickers ─────────────────────────────────── */}
      <div className="bg-slate-50/80 dark:bg-wa-dsurf/60 border border-slate-200 dark:border-wa-dbdr rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Calendar Date Picker */}
          <div className="space-y-1">
            <label htmlFor="datetime-date-input" className="block text-xs font-bold text-slate-700 dark:text-wa-dtext flex items-center gap-1.5">
              📅 Select Date
            </label>
            <input
              id="datetime-date-input"
              name="scheduledDate"
              type="date"
              value={dateStr}
              min={min ? min.split('T')[0] : undefined}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-wa-dtext focus:border-wa-teal focus:ring-2 focus:ring-wa-teal/30 transition-all cursor-pointer"
            />
          </div>

          {/* Time Picker with Seconds & AM/PM */}
          <div className="space-y-1">
            <label htmlFor="datetime-time-input" className="block text-xs font-bold text-slate-700 dark:text-wa-dtext flex items-center justify-between">
              <span className="flex items-center gap-1.5">⏰ Select Time</span>
            </label>
            <input
              id="datetime-time-input"
              name="scheduledTime"
              type="time"
              step="1"
              value={timeStr}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-wa-dtext focus:border-wa-teal focus:ring-2 focus:ring-wa-teal/30 transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Combined Full DateTime Selector */}
        <div className="pt-1">
          <label htmlFor="datetime-combined-input" className="block text-[11px] font-bold text-slate-400 dark:text-wa-dmuted mb-1">
            🗓️ Combined Date & Time Picker (Alternative)
          </label>
          <input
            id="datetime-combined-input"
            name="scheduledDateTime"
            type="datetime-local"
            step="1"
            value={datetimeLocalStr}
            min={min}
            onChange={(e) => {
              if (e.target.value) {
                onChange(e.target.value);
                const d = parseISO(e.target.value);
                if (isValid(d) && d.getTime() > Date.now() + 5000) {
                  setTimeConfirmed(true);
                } else {
                  setTimeConfirmed(false);
                }
              }
            }}
            className="w-full bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-wa-dtext focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* ── Live Formatted Dynamic Timezone Preview Badge ──────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-900 dark:bg-wa-dpanel text-white p-3 rounded-xl border border-slate-800 dark:border-wa-dbdr shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-base">
            🕒
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Scheduled Dispatch Time
            </div>
            <div className="text-xs sm:text-sm font-semibold text-emerald-400 truncate">
              {isValid(currentDate)
                ? formatInTimeZone(currentDate, activeTimeZone)
                : 'Invalid Time'}
            </div>
          </div>
        </div>

        {/* Confirm / Lock Button */}
        <button
          type="button"
          onClick={() => {
            if (!value) {
              toast.error('Pick a date & time first.');
              return;
            }
            const picked = getCurrentDate();
            if (picked.getTime() <= new Date().getTime() + 10000) {
              toast.error('Scheduled time must be in the future.');
              return;
            }
            setTimeConfirmed(true);
            toast.success(`Scheduled time confirmed in ${activeTimeZone.split('/').pop().replace('_', ' ')}!`);
          }}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            timeConfirmed
              ? 'bg-emerald-500 text-slate-950 cursor-default shadow-md shadow-emerald-500/20'
              : 'bg-wa-teal hover:bg-emerald-600 text-white active:scale-98'
          }`}
        >
          {timeConfirmed ? '✓ Time Confirmed' : 'Confirm Time'}
        </button>
      </div>
    </div>
  );
}
