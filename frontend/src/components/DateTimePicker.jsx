import React, { useState, useEffect } from 'react';
import { format, parseISO, addMinutes, addHours, addDays, setHours, setMinutes, setSeconds, isValid } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * Clean & Simplified DateTimePicker:
 * - Single view (No confusing mode tabs)
 * - Date Picker Calendar
 * - Direct HH : MM : SS numeric inputs (Works on mobile & desktop with seconds support)
 * - Single-line Direct Text sync input (YYYY-MM-DD HH:mm:ss)
 * - Presets: +1 min, +5 min, +15 min, +30 min, +1 hour, Tomorrow 12 AM (Midnight), Tomorrow 9 AM
 * - Live IST time preview badge
 */
export default function DateTimePicker({
  value,
  onChange,
  min,
  timeConfirmed,
  setTimeConfirmed
}) {
  // Local text input buffer for Direct Text Edit
  const [textBuffer, setTextBuffer] = useState('');
  const [textError, setTextError] = useState('');

  // Helper: Format Date object to "yyyy-MM-dd'T'HH:mm:ss"
  const formatToInternal = (dateObj) => {
    try {
      if (!dateObj || !isValid(dateObj)) return '';
      return format(dateObj, "yyyy-MM-dd'T'HH:mm:ss");
    } catch {
      return '';
    }
  };

  // Helper: Format Date object for display in Text Input mode "yyyy-MM-dd HH:mm:ss"
  const formatToTextDisplay = (dateObj) => {
    try {
      if (!dateObj || !isValid(dateObj)) return '';
      return format(dateObj, 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return '';
    }
  };

  // Parse current value into a Date object or fallback to now + 5 min
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
  
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  const currentHours = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();
  const currentSeconds = currentDate.getSeconds();

  // Synchronize textBuffer whenever value changes
  useEffect(() => {
    setTextBuffer(formatToTextDisplay(currentDate));
    setTextError('');
  }, [value]);

  // Handler to update date/time from parts
  const updateFromParts = (newDateStr, hours, minutes, seconds) => {
    try {
      const [year, month, day] = newDateStr.split('-').map(Number);
      const updated = new Date(year, month - 1, day, hours, minutes, seconds);
      if (isValid(updated)) {
        onChange(formatToInternal(updated));
        if (timeConfirmed) setTimeConfirmed(false);
      }
    } catch (e) {
      console.error('Error updating date parts:', e);
    }
  };

  // Handler for Direct Text Typing
  const handleTextInputChange = (rawText) => {
    setTextBuffer(rawText);
    if (!rawText.trim()) {
      setTextError('Please enter date & time');
      return;
    }

    const cleaned = rawText.trim().replace('T', ' ');
    const parts = cleaned.split(' ');
    
    if (parts.length < 2) {
      setTextError('Use format: YYYY-MM-DD HH:mm:ss');
      return;
    }

    const datePart = parts[0];
    const timePart = parts[1];

    const dateComponents = datePart.split('-');
    const timeComponents = timePart.split(':');

    if (dateComponents.length !== 3 || timeComponents.length < 2) {
      setTextError('Use format: YYYY-MM-DD HH:mm:ss');
      return;
    }

    const y = Number(dateComponents[0]);
    const m = Number(dateComponents[1]) - 1;
    const d = Number(dateComponents[2]);

    const hh = Number(timeComponents[0]);
    const mm = Number(timeComponents[1]);
    const ss = timeComponents[2] ? Number(timeComponents[2]) : 0;

    if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(hh) || isNaN(mm) || isNaN(ss)) {
      setTextError('Invalid numeric values');
      return;
    }

    const testDate = new Date(y, m, d, hh, mm, ss);
    if (!isValid(testDate) || testDate.getFullYear() !== y || testDate.getMonth() !== m || testDate.getDate() !== d) {
      setTextError('Invalid calendar date or time');
      return;
    }

    setTextError('');
    onChange(formatToInternal(testDate));
    if (timeConfirmed) setTimeConfirmed(false);
  };

  // Quick Presets
  const applyPreset = (presetType) => {
    let now = new Date();
    let target = now;

    switch (presetType) {
      case '1m':
        target = addMinutes(now, 1);
        break;
      case '5m':
        target = addMinutes(now, 5);
        break;
      case '15m':
        target = addMinutes(now, 15);
        break;
      case '30m':
        target = addMinutes(now, 30);
        break;
      case '1h':
        target = addHours(now, 1);
        break;
      case 'tomorrow-12am':
        // Midnight (00:00:00) of next day
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
          onClick={() => applyPreset('1m')}
          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-wa-dsurf text-emerald-700 dark:text-wa-green font-semibold border border-emerald-200/60 dark:border-wa-dbdr shrink-0 hover:bg-emerald-100 transition-colors"
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

      {/* ── Main Simplified Picker Card (Single View) ─────────────────────── */}
      <div className="bg-slate-50/80 dark:bg-wa-dsurf/60 border border-slate-200 dark:border-wa-dbdr rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Date Picker */}
          <div className="sm:col-span-5 space-y-1">
            <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-wa-dmuted">
              📅 Calendar Date
            </label>
            <input
              type="date"
              value={currentDateStr}
              min={min ? min.split('T')[0] : undefined}
              onChange={(e) => {
                if (e.target.value) {
                  updateFromParts(e.target.value, currentHours, currentMinutes, currentSeconds);
                }
              }}
              className="w-full bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-wa-dtext focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
            />
          </div>

          {/* Time Picker (HH : MM : SS) */}
          <div className="sm:col-span-7 space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-wa-dmuted">
                ⏰ Time (HH : MM : SS)
              </label>
              {currentSeconds > 0 && (
                <button
                  type="button"
                  onClick={() => updateFromParts(currentDateStr, currentHours, currentMinutes, 0)}
                  className="text-[10px] text-emerald-600 dark:text-wa-green hover:underline font-semibold"
                >
                  Reset SS to 00
                </button>
              )}
            </div>

            {/* Mobile & Desktop friendly HH:MM:SS inputs */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-xl p-1.5 shadow-2xs">
              {/* Hours */}
              <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-wa-dsurf rounded-lg p-1">
                <span className="text-[10px] font-bold text-slate-400 mr-1 select-none">HH:</span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={String(currentHours).padStart(2, '0')}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(23, Number(e.target.value) || 0));
                    updateFromParts(currentDateStr, val, currentMinutes, currentSeconds);
                  }}
                  className="w-10 text-center font-mono font-bold text-sm text-slate-900 dark:text-wa-dtext bg-transparent focus:outline-none"
                />
              </div>

              <span className="font-bold text-slate-400 dark:text-wa-dmuted select-none">:</span>

              {/* Minutes */}
              <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-wa-dsurf rounded-lg p-1">
                <span className="text-[10px] font-bold text-slate-400 mr-1 select-none">MM:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={String(currentMinutes).padStart(2, '0')}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                    updateFromParts(currentDateStr, currentHours, val, currentSeconds);
                  }}
                  className="w-10 text-center font-mono font-bold text-sm text-slate-900 dark:text-wa-dtext bg-transparent focus:outline-none"
                />
              </div>

              <span className="font-bold text-slate-400 dark:text-wa-dmuted select-none">:</span>

              {/* Seconds */}
              <div className="flex-1 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-wa-green mr-1 select-none">SS:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={String(currentSeconds).padStart(2, '0')}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                    updateFromParts(currentDateStr, currentHours, currentMinutes, val);
                  }}
                  className="w-10 text-center font-mono font-bold text-sm text-emerald-700 dark:text-wa-green bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Direct Text Sync Row */}
        <div className="pt-1">
          <div className="relative">
            <input
              type="text"
              value={textBuffer}
              onChange={(e) => handleTextInputChange(e.target.value)}
              placeholder="YYYY-MM-DD HH:mm:ss"
              className={`w-full bg-white dark:bg-wa-dpanel border rounded-xl px-3 py-1.5 pr-24 text-xs font-mono tracking-wide text-slate-800 dark:text-wa-dtext focus:outline-none transition-colors ${
                textError
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-slate-200 dark:border-wa-dbdr focus:border-wa-teal'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-wa-dmuted pointer-events-none select-none font-sans font-semibold">
              ✍️ Text Edit
            </span>
          </div>
          {textError && (
            <p className="text-[11px] text-red-500 mt-1 font-medium">⚠️ {textError}</p>
          )}
        </div>
      </div>

      {/* ── Live Formatted Preview Badge ─────────────────────────────────── */}
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
