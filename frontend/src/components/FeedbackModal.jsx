import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  fetchPublicFeedback,
  fetchPersonalFeedback,
  submitFeedback,
  toggleFeedbackLike
} from '../api';
import {
  computeUnreadReplyCount,
  markPersonalRepliesAsSeen
} from '../utils/supportNotifications';

export default function FeedbackModal({ onClose, initialTab = 'public' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'public' | 'personal'
  const [feedbacks, setFeedbacks] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const mySessionId = localStorage.getItem('wa_session_id') || '';
  const modalRef = useRef(null);
  const feedEndRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  // Lock body scroll when modal is mounted, restore on unmount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Load feedbacks on tab change
  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      if (activeTab === 'public') {
        const [pubRes, persRes] = await Promise.allSettled([
          fetchPublicFeedback(),
          fetchPersonalFeedback()
        ]);
        if (pubRes.status === 'fulfilled') {
          setFeedbacks(pubRes.value.feedbacks || []);
        }
        if (persRes.status === 'fulfilled' && Array.isArray(persRes.value.feedbacks)) {
          setUnreadCount(computeUnreadReplyCount(persRes.value.feedbacks));
        }
      } else {
        const res = await fetchPersonalFeedback();
        const list = res.feedbacks || [];
        setFeedbacks(list);
        // Mark all current admin replies as seen upon opening Personal tab
        markPersonalRepliesAsSeen(list);
        setUnreadCount(0);
      }
    } catch (err) {
      toast.error('Failed to load feedbacks.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [activeTab]);

  // Scroll to bottom when feedbacks change in Personal tab
  useEffect(() => {
    if (activeTab === 'personal') {
      feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [feedbacks, activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text) return;

    setSubmitting(true);
    try {
      await submitFeedback({ message: text, type: activeTab });
      toast.success(
        activeTab === 'public'
          ? 'Feedback submitted to community!'
          : 'Query submitted to Support!'
      );
      setMessageText('');
      loadFeedbacks();
    } catch (err) {
      toast.error('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id) => {
    try {
      const res = await toggleFeedbackLike(id);
      // Update local state immediately
      setFeedbacks((prev) =>
        prev.map((item) => {
          if (item._id === id) {
            return { ...item, likes: res.likes };
          }
          return item;
        })
      );
    } catch (err) {
      toast.error('Could not toggle like.');
    }
  };

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-end p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        className="w-full max-w-md sm:w-[400px] h-[480px] sm:h-[580px] max-h-[calc(100vh-100px)] sm:max-h-[75vh] mb-14 sm:mb-20 bg-white/95 dark:bg-wa-dpanel/95 border border-slate-200 dark:border-wa-dbdr rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 relative"
      >
        {/* Background Wallpaper Doodle inside Modal */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08] dark:opacity-[0.04] wp-custom-bg" />

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-wa-dbdr flex items-center justify-between bg-slate-50/80 dark:bg-wa-dsurf relative z-10">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-wa-dtext text-base flex items-center gap-1.5">
              💬 Feedback & Support
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-wa-dmuted">
              Submit your query or email{' '}
              <a href="mailto:support@wascheduler.site" className="text-wa-teal dark:text-emerald-400 font-semibold hover:underline">
                support@wascheduler.site
              </a>
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-close w-8 h-8 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-slate-200 dark:border-wa-dbdr bg-slate-50/50 dark:bg-gray-900 p-1 gap-1 relative z-10">
          <button
            onClick={() => setActiveTab('public')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors outline-none focus:outline-none border ${
              activeTab === 'public'
                ? 'bg-white dark:bg-wa-dsurf text-wa-teal shadow-sm border-slate-200/40 dark:border-wa-dbdr'
                : 'border-transparent text-slate-500 dark:text-wa-dmuted hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            👥 Community Feedback
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors outline-none focus:outline-none border flex items-center justify-center gap-1.5 ${
              activeTab === 'personal'
                ? 'bg-white dark:bg-wa-dsurf text-wa-teal shadow-sm border-slate-200/40 dark:border-wa-dbdr'
                : 'border-transparent text-slate-500 dark:text-wa-dmuted hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>🔒 Personal Support</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-red-500 text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Feedback Feed */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4 min-h-[300px] relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="w-8 h-8 border-3 border-wa-teal border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">Loading messages…</span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No messages found. Be the first to start a conversation!
            </div>
          ) : (
            feedbacks.map((item) => {
              const hasLiked = item.likes?.includes(mySessionId);
              return (
                <div
                  key={item._id}
                  className="bg-white/60 dark:bg-wa-dsurf/40 border border-slate-200/50 dark:border-wa-dbdr/50 rounded-xl p-3.5 flex flex-col gap-2.5 transition-all shadow-sm backdrop-blur-sm"
                >
                  {/* Top Row: User Name & Timestamp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-slate-700 dark:text-wa-dtext">
                        {item.userName}
                      </span>
                      {activeTab === 'personal' && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          item.type === 'personal'
                            ? 'bg-teal-100/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {item.type === 'personal' ? '🔒 Private' : '👥 Public'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-wa-dmuted">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>

                  {/* Message content */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>

                  {/* Tab-specific actions / Admin Replies */}
                  {activeTab === 'public' ? (
                    <div className="flex items-center justify-between border-t border-slate-200/40 dark:border-wa-dbdr/40 pt-2">
                      <button
                        onClick={() => handleLike(item._id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          hasLiked
                            ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-500 hover:scale-105'
                            : 'text-slate-400 dark:text-wa-dmuted hover:text-pink-500 hover:bg-slate-100 dark:hover:bg-wa-dsurf/60'
                        }`}
                      >
                        ❤️ <span>{item.likes?.length || 0}</span>
                      </button>
                    </div>
                  ) : (
                    item.adminReply ? (
                      <div className="mt-2 pl-3 border-l-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-r-xl p-2.5 flex flex-col gap-1 shadow-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            🛡️ Admin Private Reply
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-emerald-200/70 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-1 rounded">
                            Only Visible To You
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                          {item.adminReply}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400/90 font-medium bg-amber-50/50 dark:bg-amber-950/20 px-2 py-1 rounded-md border border-amber-200/40 dark:border-amber-900/30">
                        <span className="animate-spin text-[10px]">⏳</span>
                        <span>Waiting for Admin reply… Check back soon!</span>
                      </div>
                    )
                  )}
                </div>
              );
            })
          )}
          <div ref={feedEndRef} />
        </div>

        {/* Input box to submit message */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-slate-200 dark:border-wa-dbdr bg-slate-50/80 dark:bg-gray-900 flex gap-2 items-center relative z-10"
        >
          <input
            id="feedback-message-input"
            name="message"
            aria-label="Write feedback or support message"
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={
              activeTab === 'public'
                ? 'Suggest a feature or write feedback…'
                : 'Ask a support question or report an issue…'
            }
            required
            className="flex-1 bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-wa-dtext focus:outline-none focus:ring-2 focus:ring-wa-teal/30 focus:border-wa-teal transition-all"
          />
          <button
            type="submit"
            disabled={submitting || !messageText.trim()}
            className="bg-wa-teal hover:bg-wa-teal/90 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-md"
          >
            {submitting ? '…' : 'Send'}
          </button>
        </form>

        {/* Direct Email Support Note */}
        <div className="px-3 py-1.5 border-t border-slate-200/60 dark:border-wa-dbdr/60 bg-slate-100/70 dark:bg-wa-dsurf/40 text-center relative z-10 shrink-0">
          <p className="text-[10px] text-slate-500 dark:text-wa-dmuted">
            Prefer direct email? Contact us anytime at{' '}
            <a
              href="mailto:support@wascheduler.site"
              className="text-wa-teal dark:text-emerald-400 font-bold hover:underline"
            >
              support@wascheduler.site
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
