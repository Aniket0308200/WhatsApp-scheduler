import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { rescheduleMessage } from '../api';
import { getUserTimeZone, getTimeZoneOffset, zonedTimeToUtc } from '../utils/timezoneHelper';

function padZero(n) {
  return String(n).padStart(2, '0');
}

function dateToLocalInputString(date) {
  if (!date || isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}T${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

export default function RescheduleModal({ isOpen, onClose, message, onSuccess }) {
  const [editedText, setEditedText] = useState('');
  const [scheduledAtLocal, setScheduledAtLocal] = useState('');
  const [saving, setSaving] = useState(false);
  const userTimezone = getUserTimeZone();
  const tzOffset = getTimeZoneOffset(userTimezone);

  // Initialize modal state when message changes or opens
  useEffect(() => {
    if (!isOpen || !message) return;

    setEditedText(message.message || '');

    // Parse initial scheduled time
    let initialDate = new Date();
    if (message.scheduled_at) {
      const parsed = new Date(
        String(message.scheduled_at).includes('T')
          ? message.scheduled_at
          : String(message.scheduled_at).replace(' ', 'T') + 'Z'
      );
      if (!isNaN(parsed.getTime())) {
        initialDate = parsed;
      }
    }

    // If past or less than 2 mins from now, default to now + 5 mins
    if (initialDate.getTime() <= Date.now() + 60000) {
      initialDate = new Date(Date.now() + 5 * 60 * 1000);
    }

    setScheduledAtLocal(dateToLocalInputString(initialDate));
  }, [isOpen, message]);

  if (!isOpen || !message) return null;

  // Minimum allowed is current time
  const minLocalTime = dateToLocalInputString(new Date());

  // Quick jump helper functions
  const handleQuickAdd = (minutes) => {
    const nextDate = new Date(Date.now() + minutes * 60 * 1000);
    setScheduledAtLocal(dateToLocalInputString(nextDate));
  };

  const handleTomorrowAt = (hour) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(hour, 0, 0, 0);
    setScheduledAtLocal(dateToLocalInputString(nextDate));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!scheduledAtLocal) {
      toast.error('Please pick a date and time.');
      return;
    }

    // Convert local input to UTC ISO
    const selectedDate = zonedTimeToUtc(scheduledAtLocal, userTimezone);
    const nowTime = Date.now();

    if (isNaN(selectedDate.getTime())) {
      toast.error('Invalid date/time selected.');
      return;
    }

    if (selectedDate.getTime() <= nowTime + 20 * 1000) {
      toast.error('Scheduled time must be at least 1 minute in the future.');
      return;
    }

    setSaving(true);
    try {
      const res = await rescheduleMessage(message.id, {
        scheduledAt: selectedDate.toISOString(),
        message: editedText.trim()
      });

      toast.success(res?.message || 'Message rescheduled successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to reschedule message.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Recipient label
  const recipientDisplay = message.recipient_name
    ? `${message.recipient_name} (+${message.phone})`
    : message.phone === 'status@broadcast'
    ? 'WhatsApp Status (My Story)'
    : `+${message.phone}`;

  const mediaCount = (message.mediaList && message.mediaList.length)
    ? message.mediaList.length
    : (message.mediaType ? 1 : 0);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white dark:bg-wa-dpanel rounded-2xl shadow-2xl border border-slate-200 dark:border-wa-dbdr w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-wa-dbdr flex items-center justify-between bg-slate-50/70 dark:bg-wa-dsurf/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-lg">
              ⏱️
            </span>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                Reschedule Message
              </h3>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted">
                Adjust date, time, or message content
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-wa-dmuted dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-wa-dsurf transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 custom-scroll text-sm">
          {/* Recipient info pill */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-wa-dsurf/30 border border-slate-200/80 dark:border-wa-dbdr flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-wa-dmuted uppercase tracking-wider block">
                Recipient
              </span>
              <span className="font-semibold text-slate-800 dark:text-white text-sm">
                {recipientDisplay}
              </span>
            </div>
            {mediaCount > 0 && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                📁 {mediaCount} Media Preserved
              </span>
            )}
          </div>

          {/* Message text editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-wa-dtext mb-1.5">
              Message Content
            </label>
            <textarea
              rows={3}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Type your message here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-wa-dbdr bg-white dark:bg-wa-dsurf text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal text-sm transition-all"
            />
          </div>

          {/* Quick Schedule Jump Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-wa-dtext mb-1.5">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickAdd(5)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-wa-dsurf text-slate-700 dark:text-wa-dtext hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                +5 Mins
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(15)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-wa-dsurf text-slate-700 dark:text-wa-dtext hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                +15 Mins
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(30)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-wa-dsurf text-slate-700 dark:text-wa-dtext hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                +30 Mins
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(60)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-wa-dsurf text-slate-700 dark:text-wa-dtext hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={() => handleTomorrowAt(9)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                Tomorrow 9 AM
              </button>
              <button
                type="button"
                onClick={() => handleTomorrowAt(18)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              >
                Tomorrow 6 PM
              </button>
            </div>
          </div>

          {/* Exact Date & Time Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-wa-dtext">
                Scheduled Date & Time
              </label>
              <span className="text-[11px] text-slate-400 dark:text-wa-dmuted">
                {userTimezone} ({tzOffset})
              </span>
            </div>
            <input
              type="datetime-local"
              required
              min={minLocalTime}
              value={scheduledAtLocal}
              onChange={(e) => setScheduledAtLocal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-wa-dbdr bg-white dark:bg-wa-dsurf text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-wa-teal text-sm transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-wa-dbdr flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-wa-dmuted hover:bg-slate-100 dark:hover:bg-wa-dsurf transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-wa-teal hover:bg-wa-tealdark text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Rescheduling…</span>
                </>
              ) : (
                <>
                  <span>Save & Reschedule</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
