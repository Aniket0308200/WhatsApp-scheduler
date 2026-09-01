import React, { useState, useEffect } from 'react';
import { format, parseISO, addMinutes, addHours, addDays, setHours, setMinutes, setSeconds, isValid } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * DateTimePicker component with:
 * - Date, Hours, Minutes, and Seconds (HH:MM:SS) support
 * - Direct Text Input mode (e.g., YYYY-MM-DD HH:mm:ss)
 * - Quick preset chips (+5m, +15m, +30m, +1h, Tomorrow 9 AM, etc.)
 * - Native browser fallback option with step="1"
 * - Live formatted preview with IST timezone
 * - Responsive layout for mobile and desktop
 */
export default function DateTimePicker({
  value,
  onChange,
  min,
  timeConfirmed,
  setTimeConfirmed
}) {
  // Modes: 'interactive' (Steppers & Date), 'text' (Direct Typing), 'native' (Browser datetime-local)
  const [activeTab, setActiveTab] = useState('interactive');
  
  // Local text input buffer for Direct Text Edit mode
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

  // Helper: Format Date object for display in Text Input mode "yyyy-MM-DD HH:mm:ss"
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
      // Handles both ISO strings with 'T' and strings with spaces
      const normalized = value.replace(' ', 'T');
      const d = parseISO(normalized);
      if (isValid(d)) return d;
    } catch (e) {
      console.warn('Failed to parse date:', e);
    }
    return addMinutes(new Date(), 5);
  };

  const currentDate = getCurrentDate();
  
  // Breakdown states
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  const currentHours = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();
  const currentSeconds = currentDate.getSeconds();

  // Keep textBuffer in sync when switching to 'text' tab or when value changes externally
  useEffect(() => {
    setTextBuffer(formatToTextDisplay(currentDate));
    setTextError('');
  }, [value, activeTab]);

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

    // Try parsing flexible formats: "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm", "YYYY-MM-DDTHH:mm:ss"
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

    // Valid date!
    setTextError('');
    onChange(formatToInternal(testDate));
    if (timeConfirmed) setTimeConfirmed(false);
  };

  // Presets
  const applyPreset = (presetType) => {
    let now = new Date();
    let target = now;

    switch (presetType) {
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
      case 'tomorrow-9am':
        target = setSeconds(setMinutes(setHours(addDays(now, 1), 9), 0), 0);
        break;
      case 'tomorrow-6pm':
        target = setSeconds(setMinutes(setHours(addDays(now, 1), 18), 0), 0);
        break;
      default:
        break;
    }

    onChange(formatToInternal(target));
    if (timeConfirmed) setTimeConfirmed(false);
    toast.success('Scheduled time updated!');
  };

  // Stepper helper
  const adjustValue = (type, delta) => {
    let updated = new Date(currentDate.getTime());
    if (type === 'hours') {
      updated = addHours(updated, delta);
    } else if (type === 'minutes') {
      updated = addMinutes(updated, delta);
    } else if (type === 'seconds') {
      updated.setSeconds(updated.getSeconds() + delta);
    }
    onChange(formatToInternal(updated));
    if (timeConfirmed) setTimeConfirmed(false);
  };

  return (
    <div className="w-full space-y-3">
      {/* ── Mode Selection Header ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-wa-dbdr pb-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-wa-dsurf p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('interactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'interactive'
                ? 'bg-white dark:bg-wa-dpanel text-wa-teal dark:text-wa-green shadow-xs'
                : 'text-slate-500 dark:text-wa-dmuted hover:text-slate-800 dark:hover:text-wa-dtext'
            }`}
          >
            🎛️ Picker & Stepper
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-white dark:bg-wa-dpanel text-wa-teal dark:text-wa-green shadow-xs'
                : 'text-slate-500 dark:text-wa-dmuted hover:text-slate-800 dark:hover:text-wa-dtext'
            }`}
          >
            ✏️ Direct Text Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('native')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'native'
                ? 'bg-white dark:bg-wa-dpanel text-wa-teal dark:text-wa-green shadow-xs'
                : 'text-slate-500 dark:text-wa-dmuted hover:text-slate-800 dark:hover:text-wa-dtext'
            }`}
            title="Browser default calendar"
          >
            📱 Calendar
          </button>
        </div>

        {/* Quick Reset to :00 Seconds */}
        {currentSeconds > 0 && activeTab === 'interactive' && (
          <button
            type="button"
            onClick={() => adjustValue('seconds', -currentSeconds)}
            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Reset SS to 00
          </button>
        )}
      </div>

      {/* ── Preset Chips ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll text-xs">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-wa-dmuted shrink-0">
          ⚡ Quick:
        </span>
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
          onClick={() => applyPreset('tomorrow-9am')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-wa-dsurf dark:hover:bg-wa-dbdr text-slate-700 dark:text-wa-dtext hover:text-emerald-600 dark:hover:text-wa-green border border-slate-200 dark:border-wa-dbdr shrink-0 transition-colors"
        >
          Tomorrow 9 AM
        </button>
      </div>

      {/* ── Main Tab Content ─────────────────────────────────────────────── */}
      <div className="bg-slate-50/70 dark:bg-wa-dsurf/60 border border-slate-200/80 dark:border-wa-dbdr rounded-2xl p-3.5 sm:p-4 transition-all">
        {/* Tab 1: Interactive Stepper & Date Picker */}
        {activeTab === 'interactive' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Date Input */}
              <div className="sm:col-span-6 space-y-1">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-wa-dmuted">
                  📅 Scheduled Date
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
                  className="w-full bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-wa-dtext font-medium focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
                />
              </div>

              {/* Time Pickers (HH : MM : SS) */}
              <div className="sm:col-span-6 space-y-1">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-wa-dmuted">
                  ⏰ Time (HH : MM : SS)
                </label>
                <div className="grid grid-cols-3 gap-1.5 items-center">
                  {/* Hours */}
                  <div className="relative group">
                    <div className="text-[10px] text-center font-bold text-slate-400 dark:text-wa-dmuted mb-0.5">Hours</div>
                    <div className="flex items-center justify-between bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-xl p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => adjustValue('hours', -1)}
                        className="w-6 h-7 flex items-center justify-center text-slate-500 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-wa-dbdr rounded-md font-bold text-xs transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={String(currentHours).padStart(2, '0')}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(23, Number(e.target.value) || 0));
                          updateFromParts(currentDateStr, val, currentMinutes, currentSeconds);
                        }}
                        className="w-8 text-center text-sm font-bold text-slate-900 dark:text-wa-dtext bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => adjustValue('hours', 1)}
                        className="w-6 h-7 flex items-center justify-center text-slate-500 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-wa-dbdr rounded-md font-bold text-xs transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Minutes */}
                  <div className="relative group">
                    <div className="text-[10px] text-center font-bold text-slate-400 dark:text-wa-dmuted mb-0.5">Mins</div>
                    <div className="flex items-center justify-between bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-xl p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => adjustValue('minutes', -1)}
                        className="w-6 h-7 flex items-center justify-center text-slate-500 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-wa-dbdr rounded-md font-bold text-xs transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={String(currentMinutes).padStart(2, '0')}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                          updateFromParts(currentDateStr, currentHours, val, currentSeconds);
                        }}
                        className="w-8 text-center text-sm font-bold text-slate-900 dark:text-wa-dtext bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => adjustValue('minutes', 1)}
                        className="w-6 h-7 flex items-center justify-center text-slate-500 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-wa-dbdr rounded-md font-bold text-xs transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Seconds */}
                  <div className="relative group">
                    <div className="text-[10px] text-center font-bold text-emerald-600 dark:text-wa-green mb-0.5">Secs</div>
                    <div className="flex items-center justify-between bg-white dark:bg-wa-dpanel border border-emerald-500/40 dark:border-emerald-500/50 rounded-xl p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => adjustValue('seconds', -1)}
                        className="w-6 h-7 flex items-center justify-center text-slate-500 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-wa-dbdr rounded-md font-bold text-xs transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={String(currentSeconds).padStart(2, '0')}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                          updateFromParts(currentDateStr, currentHours, currentMinutes, val);
                        }}
                        className="w-8 text-center text-sm font-bold text-emerald-600 dark:text-wa-green bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => adjustValue('seconds', 1)}
                        className="w-6 h-7 flex items-center justify-center text-slate-500 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-wa-dbdr rounded-md font-bold text-xs transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Text Edit Mode */}
        {activeTab === 'text' && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-wa-dtext">
              Type Date & Time (YYYY-MM-DD HH:mm:ss)
            </label>
            <div className="relative">
              <input
                type="text"
                value={textBuffer}
                onChange={(e) => handleTextInputChange(e.target.value)}
                placeholder="2026-09-02 18:30:45"
                className={`w-full bg-white dark:bg-wa-dpanel border rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-wide text-slate-900 dark:text-wa-dtext focus:outline-none transition-colors ${
                  textError
                    ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                    : 'border-slate-200 dark:border-wa-dbdr focus:border-wa-teal focus:ring-1 focus:ring-wa-teal'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs select-none">
                ✍️
              </span>
            </div>
            {textError ? (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                ⚠️ {textError}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-wa-dmuted">
                💡 Tip: You can type date and time directly, e.g. <span className="font-mono font-bold text-slate-700 dark:text-slate-300">2026-09-02 14:30:15</span>
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Native Browser DateTime Input */}
        {activeTab === 'native' && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-wa-dtext">
              Native Calendar Picker (Includes Seconds)
            </label>
            <input
              type="datetime-local"
              step="1"
              value={formatToInternal(currentDate)}
              min={min}
              onChange={(e) => {
                if (e.target.value) {
                  onChange(e.target.value);
                  if (timeConfirmed) setTimeConfirmed(false);
                }
              }}
              className="w-full bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-wa-dtext focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
            />
          </div>
        )}
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
            if (picked.getTime() <= new Date().getTime() + 30000) {
              toast.error('Scheduled time must be in the future (at least 30s ahead).');
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
