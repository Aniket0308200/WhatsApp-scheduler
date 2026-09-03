import React from 'react';
import { format, parseISO, addMinutes, addSeconds, addHours, addDays, setHours, setMinutes, setSeconds, isValid } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * Native Calendar & Time Picker Component:
 * - Simple Date Calendar picker (type="date")
 * - Simple Time picker with Seconds & AM/PM (type="time" step="1")
 * - Combined DateTime Local picker option (type="datetime-local" step="1")
 * - Quick presets: +1 min, +5 min, +15 min, +30 min, +1 hour, Tomorrow 12 AM, Tomorrow 9 AM
 * - Live formatted IST preview badge + Confirm Time button
 */
export default function DateTimePicker({
  value,
  onChange,
  min,
  timeConfirmed,
  setTimeConfirmed
}) {
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
        if (timeConfirmed) setTimeConfirmed(false);
      }
    } catch (e) {
      console.error('Error changing date:', e);
    }
  };

  // Handler for Time change
  const handleTimeChange = (newTimeStr) => {
    if (!newTimeStr) return;
    try {
      // Ensure seconds are included if input returns HH:mm
      const fullTime = newTimeStr.split(':').length === 2 ? `${newTimeStr}:00` : newTimeStr;
      const combined = `${dateStr}T${fullTime}`;
      const d = parseISO(combined);
      if (isValid(d)) {
        onChange(formatToInternal(d));
        if (timeConfirmed) setTimeConfirmed(false);
      }
    } catch (e) {
      console.error('Error changing time:', e);
    }
  };

  // Presets
  const applyPreset = (presetType) => {
    const now = new Date();
    // Use currently selected time as base if valid and in future; otherwise start from current real time
    const base = currentDate && isValid(currentDate) && currentDate > now ? currentDate : now;
    let target = base;

    switch (presetType) {
      case '30s':
        target = addSeconds(base, 30);
        break;
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
    if (timeConfirmed) setTimeConfirmed(false);
    toast.success('Scheduled time updated!');
  };

  return (
    <div className="w-full space-y-3">
      {/* ── Quick Presets Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll text-xs">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-wa-dmuted shrink-0">
          ⚡ Quick:
        </span>
        <button
          type="button"
          onClick={() => applyPreset('30s')}
          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-wa-dsurf text-emerald-700 dark:text-wa-green font-semibold border border-emerald-200/60 dark:border-wa-dbdr shrink-0 hover:bg-emerald-100 transition-colors"
        >
          {/* +30 sec */}
        </button>
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
              📅 Select Date (MM/DD/YYYY)
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
              <span className="flex items-center gap-1.5">⏰ Select Time (HH:MM:SS)</span>
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

        {/* Combined Mobile/Desktop Full DateTime Selector */}
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
                if (timeConfirmed) setTimeConfirmed(false);
              }
            }}
            className="w-full bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-wa-dtext focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* ── Live Formatted IST Time Preview Badge ─────────────────────────── */}
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
                ? format(currentDate, "EEEE, d MMM yyyy 'at' hh:mm:ss a") + ' (IST)'
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
            toast.success('Scheduled date & time confirmed!');
          }}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${timeConfirmed
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
