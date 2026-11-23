import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  adminLogin,
  adminGetMe,
  adminGetStats,
  adminGetUsers,
  adminGetUserActivity,
  adminUpdateUserPlan,
  adminUpdateUserLock,
  adminGetSubscriptions,
  adminApproveSubscription,
  adminRejectSubscription,
  adminDeleteSubscription,
  adminGetFeedbacks,
  adminReplyFeedback,
  adminDeleteFeedback,
  adminGetContactMessages,
  adminUpdateContactStatus,
  adminDeleteContactMessage
} from '../api';
import AdminAnalyticsTab from './AdminAnalyticsTab';

const ADMIN_STORAGE_KEY = 'wa_admin_token';
const ADMIN_USER_KEY = 'wa_admin_user';

// ─── Reusable Pagination Control ─────────────────────────────────────────────
function PaginationControl({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 20, 25]
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400">
      {/* Items per page selector & Range info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[11px] text-slate-500">
          Showing <strong className="text-slate-200">{startItem}</strong> - <strong className="text-slate-200">{endItem}</strong> of <strong className="text-slate-200">{totalItems}</strong>
        </span>
      </div>

      {/* Page Navigation Controls */}
      <div className="flex items-center gap-1.5">
        {/* First Page */}
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(1)}
          className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-semibold"
          title="First Page"
        >
          « First
        </button>

        {/* Prev Page */}
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-semibold"
          title="Previous Page"
        >
          ‹ Prev
        </button>

        {/* Page indicator */}
        <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs">
          Page {safePage} of {totalPages}
        </span>

        {/* Next Page */}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-semibold"
          title="Next Page"
        >
          Next ›
        </button>

        {/* Last Page */}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-semibold"
          title="Last Page"
        >
          Last »
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  // ── Authentication State ──────────────────────────────────────────────────
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem(ADMIN_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login form state (Empty by default, no pre-filled credentials)
  const [loginForm, setLoginForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // ── Dashboard Data State ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'subscriptions' | 'inquiries' | 'support'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [feedbackFilter, setFeedbackFilter] = useState('all'); // 'all' | 'unanswered' | 'answered'
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // ── Pagination States ─────────────────────────────────────────────────────
  // Tab 1 Users: 5-25, default 10
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  // Tab 2 Subscriptions: 5-25, default 10
  const [subPage, setSubPage] = useState(1);
  const [subPageSize, setSubPageSize] = useState(10);

  // Tab 3 Contact Inquiries: 10, 20, 30, default 10
  const [contactPage, setContactPage] = useState(1);
  const [contactPageSize, setContactPageSize] = useState(10);

  // Tab 4 Support & Feedback: 10, 20, 30, default 10
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPageSize, setFeedbackPageSize] = useState(10);

  // User Schedule Activity Overview Modal
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // ── Filters & Search States ──────────────────────────────────────────────
  // Tab 1 (Users)
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'free' | 'starter' | 'pro' | 'online' | 'locked'

  // Tab 2 (Subscriptions)
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  // Tab 3 (Contact Inquiries)
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState('all'); // 'all' | 'new' | 'resolved'

  // Tab 4 (Support & Feedback)
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Screenshot modal preview
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setToken('');
    setAdminUser(null);
    toast.success('Admin signed out.');
  }, []);

  // ── Login Submit ──────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.name.trim() || !loginForm.email.trim() || !loginForm.password) {
      toast.error('All fields (Name, Email, Password) are required.');
      return;
    }

    setLoggingIn(true);
    try {
      const res = await adminLogin({
        name: loginForm.name.trim(),
        email: loginForm.email.trim(),
        password: loginForm.password
      });

      if (res.token) {
        localStorage.setItem(ADMIN_STORAGE_KEY, res.token);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(res.admin));
        setToken(res.token);
        setAdminUser(res.admin);
        toast.success(`Welcome back, ${res.admin.name || 'Admin'}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid admin credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  // ── Fetch Dashboard Data ──────────────────────────────────────────────────
  const refreshData = useCallback(async (isBackground = false) => {
    if (!token) return;
    if (!isBackground) setLoading(true);

    try {
      const [statsRes, usersRes, subsRes, contactRes, feedbackRes] = await Promise.allSettled([
        adminGetStats(token),
        adminGetUsers(token),
        adminGetSubscriptions(token),
        adminGetContactMessages(token),
        adminGetFeedbacks(token)
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.stats);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value?.success) {
        setUsers(usersRes.value.users || []);
      }
      if (subsRes.status === 'fulfilled' && subsRes.value?.success) {
        setSubscriptions(subsRes.value.requests || []);
      }
      if (contactRes.status === 'fulfilled' && contactRes.value?.success) {
        setContactMessages(contactRes.value.messages || []);
      }
      if (feedbackRes.status === 'fulfilled' && feedbackRes.value?.success) {
        setFeedbacks(feedbackRes.value.feedbacks || []);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [token, handleLogout]);

  // Initial load & Token validation
  useEffect(() => {
    if (token) {
      adminGetMe(token)
        .then(res => {
          if (res?.admin) setAdminUser(res.admin);
          refreshData();
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [token, refreshData, handleLogout]);

  // Real-time auto-refresh interval (every 60 seconds when enabled)
  useEffect(() => {
    if (!token || !autoRefresh) return;
    const interval = setInterval(() => {
      if (!document.hidden) {
        refreshData(true);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [token, autoRefresh, refreshData]);

  // ── Handle Change Plan (Unlock/Upgrade/Downgrade) ──────────────────────────
  const handlePlanChange = async (userId, newPlan, billingCycle = 'monthly', userName = 'User') => {
    const cycleLabel = newPlan === 'free' ? '' : ` (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`;
    if (!window.confirm(`Are you sure you want to change ${userName}'s plan to ${newPlan.toUpperCase()}${cycleLabel}?`)) {
      return;
    }

    setActionLoadingId(userId);
    try {
      await adminUpdateUserPlan(token, userId, newPlan, billingCycle);
      toast.success(`Plan updated to ${newPlan.toUpperCase()}${cycleLabel} for ${userName}!`);
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan, billingCycle, planStatus: 'active' } : u));
      refreshData(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update plan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Handle Lock / Unlock Account ──────────────────────────────────────────
  const handleToggleLock = async (userId, currentLocked, userName) => {
    const actionWord = currentLocked ? 'unlock and restore access for' : 'lock and suspend';
    if (!window.confirm(`Are you sure you want to ${actionWord} ${userName || 'this account'}?`)) {
      return;
    }

    setActionLoadingId(userId);
    try {
      await adminUpdateUserLock(token, userId, !currentLocked);
      toast.success(`Account ${!currentLocked ? 'LOCKED' : 'UNLOCKED'} successfully!`);
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isLocked: !currentLocked } : u));
      refreshData(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update lock status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Handle Open User Activity Overview ────────────────────────────────────
  const openUserDetails = async (u) => {
    setSelectedUserForDetails(u);
    setUserActivity(null);
    setLoadingActivity(true);
    try {
      const res = await adminGetUserActivity(token, u.id);
      if (res?.activity) {
        setUserActivity(res.activity);
      }
    } catch (err) {
      toast.error('Could not load user schedule activity.');
    } finally {
      setLoadingActivity(false);
    }
  };

  // ── Handle Subscription Approve / Reject ──────────────────────────────────
  const handleApproveSub = async (id, email, plan, billingCycle = 'monthly') => {
    const cycleLabel = billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
    if (!window.confirm(`Approve payment and activate ${plan.toUpperCase()} (${cycleLabel}) for ${email}?`)) return;
    setActionLoadingId(id);
    try {
      await adminApproveSubscription(token, id, `Verified via Admin Panel (${cycleLabel})`);
      toast.success(`Plan ${plan.toUpperCase()} (${cycleLabel}) activated for ${email}!`);
      refreshData(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSub = async (id, email) => {
    const reason = window.prompt(`Reason for rejecting payment for ${email}:`, 'Invalid UTR or screenshot');
    if (reason === null) return;
    setActionLoadingId(id);
    try {
      await adminRejectSubscription(token, id, reason);
      toast.success(`Subscription rejected.`);
      refreshData(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rejection failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Handle Delete Subscription (Free Database Space) ──────────────────────
  const handleDeleteSub = async (id, email, utr, amount) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete this subscription payment record?\n\n• Email: ${email || 'N/A'}\n• UTR: ${utr || 'N/A'}\n• Amount: ₹${amount || '0'}\n\nThis will remove it from the database completely and cannot be undone.`)) {
      return;
    }
    setActionLoadingId(id);
    try {
      await adminDeleteSubscription(token, id);
      setSubscriptions(prev => prev.filter(s => s._id !== id));
      toast.success('Subscription record permanently deleted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete subscription.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Handle Support & Feedback Inquiries ────────────────────────────────────
  const handleReplyFeedback = async (id, userName) => {
    const draft = (replyDrafts[id] ?? '').trim();
    if (!draft) {
      toast.error('Please type a reply message before sending.');
      return;
    }
    setActionLoadingId(id);
    try {
      await adminReplyFeedback(token, id, draft);
      setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, adminReply: draft } : f));
      toast.success(`Private reply sent to ${userName || 'user'}! Visible in their Personal Support.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reply.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteFeedback = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete this feedback from "${userName || 'this user'}"?\n\nThis will remove it from the database completely.`)) {
      return;
    }
    setActionLoadingId(id);
    try {
      await adminDeleteFeedback(token, id);
      setFeedbacks(prev => prev.filter(f => f._id !== id));
      toast.success('Feedback permanently deleted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete feedback.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Handle Delete Inquiry ──────────────────────────────────────────────────
  const handleDeleteInquiry = async (id, senderName) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete this inquiry from "${senderName || 'this user'}"?\n\nThis will remove it from the database completely and cannot be undone.`)) {
      return;
    }
    try {
      await adminDeleteContactMessage(token, id);
      setContactMessages(prev => prev.filter(m => m._id !== id));
      toast.success('Inquiry permanently deleted from database!');
    } catch (err) {
      toast.error('Failed to delete inquiry: ' + (err.response?.data?.error || err.message));
    }
  };

  // ── Filtered Users List ───────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q));

      if (!matchSearch) return false;

      // Plan filter
      if (planFilter === 'online') return u.isOnline;
      if (planFilter === 'locked') return u.isLocked;
      if (planFilter === 'free') return u.plan === 'free' && !u.isLocked;
      if (planFilter === 'starter') return u.plan === 'starter' && !u.isLocked;
      if (planFilter === 'pro') return u.plan === 'pro' && !u.isLocked;

      return true;
    });
  }, [users, searchQuery, planFilter]);

  // Reset user page when search or plan filter changes
  useEffect(() => {
    setUserPage(1);
  }, [searchQuery, planFilter]);

  // Paginated users (Tab 1)
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  // Reset subscription page when search or status filter changes
  useEffect(() => {
    setSubPage(1);
  }, [subSearchQuery, subStatusFilter]);

  // Filtered subscriptions (Tab 2)
  const filteredSubs = useMemo(() => {
    return subscriptions.filter(sub => {
      const q = subSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (sub.email && sub.email.toLowerCase().includes(q)) ||
        (sub.phone && String(sub.phone).includes(q)) ||
        (sub.utr && sub.utr.toLowerCase().includes(q)) ||
        (sub.plan && sub.plan.toLowerCase().includes(q)) ||
        (sub.amount && String(sub.amount).includes(q));

      if (!matchSearch) return false;

      if (subStatusFilter !== 'all') {
        return sub.status === subStatusFilter;
      }
      return true;
    });
  }, [subscriptions, subSearchQuery, subStatusFilter]);

  // Paginated subscriptions (Tab 2)
  const paginatedSubs = useMemo(() => {
    const start = (subPage - 1) * subPageSize;
    return filteredSubs.slice(start, start + subPageSize);
  }, [filteredSubs, subPage, subPageSize]);

  // Reset contact page when search or status filter changes
  useEffect(() => {
    setContactPage(1);
  }, [contactSearchQuery, contactStatusFilter]);

  // Filtered contact messages (Tab 3)
  const filteredContacts = useMemo(() => {
    return contactMessages.filter(msg => {
      const q = contactSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (msg.loginName && msg.loginName.toLowerCase().includes(q)) ||
        (msg.loginEmail && msg.loginEmail.toLowerCase().includes(q)) ||
        (msg.contactEmail && msg.contactEmail.toLowerCase().includes(q)) ||
        (msg.whatsappNumber && String(msg.whatsappNumber).includes(q)) ||
        (msg.subject && msg.subject.toLowerCase().includes(q)) ||
        (msg.message && msg.message.toLowerCase().includes(q)) ||
        (msg.paymentDetails?.payerRef && msg.paymentDetails.payerRef.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (contactStatusFilter !== 'all') {
        return msg.status === contactStatusFilter;
      }
      return true;
    });
  }, [contactMessages, contactSearchQuery, contactStatusFilter]);

  // Paginated contact messages (Tab 3)
  const paginatedContacts = useMemo(() => {
    const start = (contactPage - 1) * contactPageSize;
    return filteredContacts.slice(start, start + contactPageSize);
  }, [filteredContacts, contactPage, contactPageSize]);

  // Reset feedback page when search or feedback filter changes
  useEffect(() => {
    setFeedbackPage(1);
  }, [feedbackSearchQuery, feedbackFilter]);

  // Filtered feedbacks (Tab 4)
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const q = feedbackSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (f.userName && f.userName.toLowerCase().includes(q)) ||
        (f.userId && f.userId.toLowerCase().includes(q)) ||
        (f.message && f.message.toLowerCase().includes(q)) ||
        (f.adminReply && f.adminReply.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (feedbackFilter === 'unanswered') return !f.adminReply;
      if (feedbackFilter === 'answered') return !!f.adminReply;
      return true;
    });
  }, [feedbacks, feedbackSearchQuery, feedbackFilter]);

  // Paginated feedbacks (Tab 4)
  const paginatedFeedbacks = useMemo(() => {
    const start = (feedbackPage - 1) * feedbackPageSize;
    return filteredFeedbacks.slice(start, start + feedbackPageSize);
  }, [filteredFeedbacks, feedbackPage, feedbackPageSize]);

  // Format date helper
  const formatDateTime = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(val);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: Admin Login Screen
  // ───────────────────────────────────────────────────────────────────────────
  if (!token || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100 font-sans">
        <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-up">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
              🛡️
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Super Admin Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Authorized access only. Sign in with master credentials.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Full Name</label>
              <input
                type="text"
                value={loginForm.name}
                onChange={e => setLoginForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Arjun Kapoor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-white placeholder-slate-500 transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-white placeholder-slate-500 transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-white placeholder-slate-500 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying Master Access…
                </>
              ) : (
                'Secure Sign In ➔'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              ← Back to WA Scheduler Client
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: Admin Dashboard
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* ── Top Master Header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xl shadow-md shadow-emerald-500/20">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                WA Scheduler Admin
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Logged in as <strong className="text-slate-200">{adminUser.name}</strong> ({adminUser.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(p => !p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              autoRefresh
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Auto-refresh every 60 seconds (Click to toggle)"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            Live Auto-Sync
          </button>

          {/* Refresh Manual Button */}
          <button
            type="button"
            onClick={() => refreshData()}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className={loading ? 'animate-spin' : ''}>↻</span>
            Refresh
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/60 transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Main Container ──────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 sm:px-8 pt-6 max-w-7xl space-y-6">
        {/* ── Privacy Notice Banner ────────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-300 shadow-sm">
          <span className="text-base text-emerald-400 flex-shrink-0 mt-0.5">🔒</span>
          <div>
            <strong className="text-white">Strict Privacy Mode Active:</strong> You have full administrative control to manage user accounts, unlock/upgrade plans, and monitor live website presence.
            <span className="text-slate-400 block sm:inline sm:ml-1">
              Customer private message contents, scheduled texts, and phone contacts are end-to-end encrypted and completely hidden from Admin view.
            </span>
          </div>
        </div>

        {/* ── Stats Metric Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1: Total Users */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400">Total Users</span>
              <span className="text-base">👥</span>
            </div>
            <div className="text-2xl font-black text-white">
              {stats?.totalUsers ?? users.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Registered + Active</p>
          </div>

          {/* Card 2: Online Now */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-400">Online Now</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-2xl font-black text-emerald-300">
              {stats?.onlineUsers ?? users.filter(u => u.isOnline).length}
            </div>
            <p className="text-[11px] text-emerald-500/80 mt-0.5">Active on site right now</p>
          </div>

          {/* Card 3: Free Plan */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400">Free Tier</span>
              <span className="text-base">🌱</span>
            </div>
            <div className="text-2xl font-black text-slate-300">
              {stats?.plans?.free ?? users.filter(u => u.plan === 'free').length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Standard quota</p>
          </div>

          {/* Card 4: Starter & Pro Members */}
          <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-900/40 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-teal-400">Paid / Unlocked</span>
              <span className="text-base">💎</span>
            </div>
            <div className="text-2xl font-black text-teal-300">
              {(stats?.plans?.starter ?? 0) + (stats?.plans?.pro ?? 0)}
            </div>
            <p className="text-[11px] text-teal-400/80 mt-0.5">
              {stats?.plans?.starter ?? 0} Starter • {stats?.plans?.pro ?? 0} Pro
            </p>
          </div>

          {/* Card 5: Locked Accounts */}
          <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 shadow-md col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-red-400">Locked / Blocked</span>
              <span className="text-base">🔒</span>
            </div>
            <div className="text-2xl font-black text-red-300">
              {stats?.lockedUsers ?? users.filter(u => u.isLocked).length}
            </div>
            <p className="text-[11px] text-red-400/80 mt-0.5">Access suspended</p>
          </div>
        </div>

        {/* ── Navigation Tabs ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            👥 Users & Access Management ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'subscriptions'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            💳 UPI Payment Verification
            {subscriptions.filter(s => s.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                {subscriptions.filter(s => s.status === 'pending').length} Pending
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'inquiries'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            ✉️ Contact Inquiries ({contactMessages.length})
            {contactMessages.filter(m => m.status === 'new').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white">
                {contactMessages.filter(m => m.status === 'new').length} New
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'support'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            💬 Support & Feedback ({feedbacks.length})
            {feedbacks.filter(f => !f.adminReply).length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {feedbacks.filter(f => !f.adminReply).length} Awaiting Reply
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            📊 Analytics & Traffic
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: USERS LIST & ACCESS CONTROL                                  */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone (+91), email…"
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  🔍
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {[
                  { id: 'all', label: `All (${users.length})` },
                  { id: 'online', label: `🟢 Online (${users.filter(u => u.isOnline).length})` },
                  { id: 'free', label: 'Free Tier' },
                  { id: 'starter', label: 'Starter' },
                  { id: 'pro', label: 'Pro' },
                  { id: 'locked', label: `🔒 Locked (${users.filter(u => u.isLocked).length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPlanFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      planFilter === tab.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                    <th className="px-5 py-3.5">User Identity</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Presence & Activity</th>
                    <th className="px-5 py-3.5">Plan Management</th>
                    <th className="px-5 py-3.5">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No users match the selected search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map(u => {
                      const isBusy = actionLoadingId === u.id;

                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            u.isLocked ? 'bg-red-950/10' : ''
                          }`}
                        >
                          {/* 1. User Identity */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div
                              onClick={() => openUserDetails(u)}
                              className="flex items-center gap-3 cursor-pointer group p-1 -m-1 rounded-xl hover:bg-slate-800/60 transition-all"
                              title="Click to view schedule activity and dispatch statistics"
                            >
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 group-hover:from-emerald-600 group-hover:to-teal-500 transition-all flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-xs">
                                {(u.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-sm truncate max-w-[150px] group-hover:text-emerald-400 group-hover:underline transition-colors">
                                    {u.name || 'Unnamed User'}
                                  </span>
                                  {u.isLocked && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-900/60 text-red-300 border border-red-800">
                                      LOCKED
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400">
                                    Joined: {formatDateTime(u.createdAt)}
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-bold opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                                    📊 Activity ↗
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Contact Details */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1 font-mono text-xs text-emerald-400 font-semibold">
                                <span>📱</span>
                                <span>{u.phone ? `+${u.phone}` : 'No WhatsApp phone linked'}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={u.email}>
                                ✉ {u.email}
                              </div>
                            </div>
                          </td>

                          {/* 3. Presence & Activity */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {/* Live Presence Status */}
                              {u.isOnline ? (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Online Now (Active)
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400">
                                  ⚪ Offline (Last seen: {formatDateTime(u.lastSeenAt)})
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400">
                                Last Login: {formatDateTime(u.lastLoginAt)}
                              </div>
                            </div>
                          </td>

                          {/* 4. Plan Management (Unlock / Upgrade / Downgrade with Billing Cycle) */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="space-y-1.5">
                              {/* Current Plan Badge */}
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                  u.plan === 'pro'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : u.plan === 'starter'
                                    ? 'bg-teal-950 text-teal-300 border border-teal-800'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}>
                                  {u.plan === 'pro' ? '👑 Pro' : u.plan === 'starter' ? '⚡ Starter' : '🌱 Free Tier'}
                                </span>
                                {u.plan !== 'free' && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                    {u.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
                                  </span>
                                )}
                              </div>

                              {/* Expiry / Validity Status */}
                              {u.subscriptionExpiresAt && (
                                <div className="text-[10px] text-slate-400">
                                  {new Date(u.subscriptionExpiresAt) < new Date() ? (
                                    <span className="text-red-400 font-bold">⚠️ Expired: {formatDateTime(u.subscriptionExpiresAt)}</span>
                                  ) : (
                                    <span>Expires: {formatDateTime(u.subscriptionExpiresAt)}</span>
                                  )}
                                </div>
                              )}

                              {/* Quick Plan Switcher Dropdown */}
                              <div>
                                <select
                                  disabled={isBusy}
                                  value={`${u.plan}:${u.billingCycle || 'monthly'}`}
                                  onChange={(e) => {
                                    const [newPlan, newCycle] = e.target.value.split(':');
                                    handlePlanChange(u.id, newPlan, newCycle, u.name);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[10px] font-bold text-slate-300 hover:text-white outline-none focus:border-emerald-500 cursor-pointer"
                                >
                                  <option value="free:monthly">Set to: Free Tier</option>
                                  <option value="starter:monthly">Set to: ⚡ Starter (Monthly - ₹199)</option>
                                  <option value="starter:yearly">Set to: ⚡ Starter (Yearly - ₹1,999)</option>
                                  <option value="pro:monthly">Set to: 👑 Pro (Monthly - ₹499)</option>
                                  <option value="pro:yearly">Set to: 👑 Pro (Yearly - ₹4,999)</option>
                                </select>
                              </div>
                            </div>
                          </td>

                          {/* 5. Access Control (Lock / Unlock Switch) */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleLock(u.id, u.isLocked, u.name)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                u.isLocked
                                  ? 'bg-red-950/80 text-red-300 border-red-700 hover:bg-red-900'
                                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                              }`}
                            >
                              {isBusy ? (
                                'Updating…'
                              ) : u.isLocked ? (
                                <>
                                  <span>🔒</span>
                                  <span>Locked (Click to Unlock)</span>
                                </>
                              ) : (
                                <>
                                  <span>🔓</span>
                                  <span>Active (Click to Lock)</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Users Table */}
            <PaginationControl
              currentPage={userPage}
              totalItems={filteredUsers.length}
              pageSize={userPageSize}
              onPageChange={setUserPage}
              onPageSizeChange={setUserPageSize}
              pageSizeOptions={[5, 10, 15, 20, 25]}
            />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: UPI PAYMENT VERIFICATION                                     */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'subscriptions' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={subSearchQuery}
                  onChange={e => setSubSearchQuery(e.target.value)}
                  placeholder="Search by UTR, email, phone (+91), plan…"
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  🔍
                </span>
                {subSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSubSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {[
                  { id: 'all', label: `All (${subscriptions.length})` },
                  { id: 'pending', label: `⏳ Pending (${subscriptions.filter(s => s.status === 'pending').length})` },
                  { id: 'approved', label: `✓ Approved (${subscriptions.filter(s => s.status === 'approved').length})` },
                  { id: 'rejected', label: `✕ Rejected (${subscriptions.filter(s => s.status === 'rejected').length})` }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubStatusFilter(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      subStatusFilter === item.id
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Requested Plan</th>
                    <th className="px-5 py-3.5">Amount & UTR</th>
                    <th className="px-5 py-3.5">Screenshot</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        {subscriptions.length === 0
                          ? 'No subscription payment requests submitted yet.'
                          : 'No subscription requests match your search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedSubs.map(sub => {
                      const isBusy = actionLoadingId === sub._id;

                      return (
                        <tr key={sub._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="font-bold text-white">{sub.email}</div>
                            <div className="text-[11px] text-slate-400">+{sub.phone}</div>
                            <div className="text-[10px] text-slate-500">{formatDateTime(sub.createdAt)}</div>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase ${
                                sub.plan === 'pro'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-teal-950 text-teal-300 border border-teal-800'
                              }`}>
                                {sub.plan}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                sub.billingCycle === 'yearly'
                                  ? 'bg-purple-900/60 text-purple-200 border border-purple-700'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {sub.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="font-bold text-white">₹{sub.amount}</div>
                            <div className="font-mono text-[11px] text-emerald-400 select-all font-semibold">
                              UTR: {sub.utr}
                            </div>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            {sub.screenshotUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewScreenshot(sub.screenshotUrl)}
                                className="group relative rounded-lg overflow-hidden border border-slate-700 w-12 h-12 block bg-slate-950 cursor-pointer"
                              >
                                <img
                                  src={sub.screenshotUrl}
                                  alt="Receipt"
                                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Zoom
                                </span>
                              </button>
                            ) : (
                              <span className="text-slate-500">No image</span>
                            )}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : sub.status === 'rejected'
                                  ? 'bg-red-950 text-red-300 border border-red-800'
                                  : 'bg-yellow-950 text-yellow-300 border border-yellow-800 animate-pulse'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {sub.status === 'pending' ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleApproveSub(sub._id, sub.email, sub.plan, sub.billingCycle || 'monthly')}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleRejectSub(sub._id, sub.email)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-red-900/60 text-red-300 border border-slate-700 transition-colors"
                                  >
                                    ✕ Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-500">
                                  {sub.verifiedAt ? `Processed on ${formatDateTime(sub.verifiedAt)}` : 'Completed'}
                                </span>
                              )}

                              {/* Delete Payment Record Button to clean database */}
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeleteSub(sub._id, sub.email, sub.utr, sub.amount)}
                                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 transition-colors flex items-center gap-1"
                                title="Permanently delete payment record from database to free space"
                              >
                                <span>🗑️</span>
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Subscriptions Table */}
            <PaginationControl
              currentPage={subPage}
              totalItems={filteredSubs.length}
              pageSize={subPageSize}
              onPageChange={setSubPage}
              onPageSizeChange={setSubPageSize}
              pageSizeOptions={[5, 10, 15, 20, 25]}
            />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 3: CONTACT INQUIRIES & HELPDESK                                 */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">Customer Support & Contact Inquiries</h3>
                <p className="text-xs text-slate-400">
                  Messages submitted via the homepage contact form (routed to aniketchouhan243@gmail.com)
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                {contactMessages.length} Total Messages
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={e => setContactSearchQuery(e.target.value)}
                  placeholder="Search by name, email, WhatsApp, subject, message…"
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  🔍
                </span>
                {contactSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setContactSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {[
                  { id: 'all', label: `All (${contactMessages.length})` },
                  { id: 'new', label: `🔵 New (${contactMessages.filter(m => m.status === 'new').length})` },
                  { id: 'resolved', label: `✓ Resolved (${contactMessages.filter(m => m.status === 'resolved').length})` }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setContactStatusFilter(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      contactStatusFilter === item.id
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
                <span className="text-3xl">📭</span>
                <h4 className="text-sm font-bold text-slate-300">No Inquiries Found</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {contactMessages.length === 0
                    ? 'When users fill out the Contact Us form on the homepage, their messages will appear here.'
                    : 'No customer inquiries match your current search or filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {paginatedContacts.map((msg) => (
                    <div
                      key={msg._id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        msg.status === 'resolved'
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                          : 'bg-slate-900 border-slate-800 shadow-md'
                      }`}
                    >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          msg.status === 'resolved'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : 'bg-blue-950/60 text-blue-300 border border-blue-800 animate-pulse'
                        }`}>
                          {msg.status}
                        </span>
                        <span className="text-xs font-bold text-white">{msg.subject}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs border-b border-slate-800/60">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold">User Login Info:</span>
                        <span className="text-slate-200 font-medium">{msg.loginName || '—'}</span>
                        <span className="text-slate-400 block text-[11px]">{msg.loginEmail || 'No login email'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold">Connected WhatsApp:</span>
                        <span className="text-emerald-400 font-mono font-medium">{msg.whatsappNumber || 'Not connected'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold">Contact / Reply Email:</span>
                        <a
                          href={`mailto:${msg.contactEmail}?subject=Re: [WA Scheduler Support] ${encodeURIComponent(msg.subject)}`}
                          className="text-wa-teal hover:underline font-medium"
                        >
                          {msg.contactEmail} ↗
                        </a>
                      </div>
                    </div>

                    {/* Payment Info if marked as paid */}
                    {msg.paymentDetails?.hasPaid && (
                      <div className="my-2.5 p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/50 text-xs">
                        <span className="text-purple-300 font-bold block mb-1">💳 Payment Verification Details:</span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-purple-200">
                          {msg.paymentDetails.amountPaid && (
                            <span>Amount: <strong className="text-emerald-400 font-bold">{msg.paymentDetails.amountPaid}</strong></span>
                          )}
                          {msg.paymentDetails.paymentMethod && (
                            <span>Method/App: <strong className="text-blue-300 font-bold">{msg.paymentDetails.paymentMethod}</strong></span>
                          )}
                          <span>Payer Name: <strong>{msg.paymentDetails.payerName || '—'}</strong></span>
                          <span>Payer Email: <strong>{msg.paymentDetails.payerEmail || '—'}</strong></span>
                          <span>UPI Ref / UTR: <strong>{msg.paymentDetails.payerRef || '—'}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="pt-2">
                      <span className="text-slate-500 block text-[10px] font-semibold mb-1">User Message:</span>
                      <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        {msg.message}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${msg.contactEmail}?subject=Re: [WA Scheduler Support] ${encodeURIComponent(msg.subject)}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5"
                        >
                          <span>✉️</span>
                          <span>Reply to User</span>
                        </a>

                        <button
                          type="button"
                          onClick={async () => {
                            const nextStatus = msg.status === 'resolved' ? 'new' : 'resolved';
                            try {
                              await adminUpdateContactStatus(token, msg._id, { status: nextStatus });
                              setContactMessages(prev => prev.map(m => m._id === msg._id ? { ...m, status: nextStatus } : m));
                              toast.success(`Marked as ${nextStatus}!`);
                            } catch (err) {
                              toast.error('Failed to update status.');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            msg.status === 'resolved'
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                          }`}
                        >
                          {msg.status === 'resolved' ? 'Mark as Unresolved' : '✓ Mark as Resolved'}
                        </button>
                      </div>

                      {/* Delete Inquiry Button with confirmation */}
                      <button
                        type="button"
                        onClick={() => handleDeleteInquiry(msg._id, msg.loginName || msg.contactEmail)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/80 hover:bg-rose-900/80 transition-all flex items-center gap-1.5"
                        title="Permanently remove inquiry from database"
                      >
                        <span>🗑️</span>
                        <span>Delete Permanently</span>
                      </button>
                    </div>
                  </div>
                ))}
                </div>

                {/* Pagination for Contact Inquiries */}
                <PaginationControl
                  currentPage={contactPage}
                  totalItems={filteredContacts.length}
                  pageSize={contactPageSize}
                  onPageChange={setContactPage}
                  onPageSizeChange={setContactPageSize}
                  pageSizeOptions={[10, 20, 30]}
                />
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 4: IN-APP FEEDBACK & SUPPORT MESSAGES                           */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>💬</span> In-App User Support & Feedback
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct inquiries and feedback submitted via client support modal. Replies appear exclusively in the user's Personal Support feed.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                {feedbacks.length} Total Messages
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={feedbackSearchQuery}
                  onChange={e => setFeedbackSearchQuery(e.target.value)}
                  placeholder="Search by user name, message, reply, user ID…"
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  🔍
                </span>
                {feedbackSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setFeedbackSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setFeedbackFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    feedbackFilter === 'all'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({feedbacks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackFilter('unanswered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    feedbackFilter === 'unanswered'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Awaiting Reply ({feedbacks.filter(f => !f.adminReply).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackFilter('answered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    feedbackFilter === 'answered'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Replied ({feedbacks.filter(f => !!f.adminReply).length})
                </button>
              </div>
            </div>

            {/* List of Feedback Cards */}
            {(() => {
              if (filteredFeedbacks.length === 0) {
                return (
                  <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
                    <span className="text-3xl">🎉</span>
                    <h4 className="text-sm font-bold text-slate-300">No Support Queries Found</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {feedbacks.length === 0
                        ? 'No feedback messages recorded yet.'
                        : 'No support queries match your search or filter criteria.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {paginatedFeedbacks.map(item => {
                      const isBusy = actionLoadingId === item._id;
                      const draftValue = replyDrafts[item._id] !== undefined ? replyDrafts[item._id] : (item.adminReply || '');
                      const hasReplied = Boolean(item.adminReply);

                      return (
                        <div
                          key={item._id}
                          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl transition-all space-y-3.5 hover:border-slate-700/80 flex flex-col justify-between"
                        >
                        {/* Top Card Info Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-bold text-sm text-white flex items-center gap-1.5">
                              👤 {item.userName || 'Anonymous User'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              item.type === 'personal'
                                ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                                : 'bg-blue-950/70 text-blue-300 border border-blue-800'
                            }`}>
                              {item.type === 'personal' ? '🔒 Personal Support' : '👥 Community Post'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              hasReplied
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950/70 text-amber-300 border border-amber-800 animate-pulse'
                            }`}>
                              {hasReplied ? '✓ Replied' : '⏳ Needs Reply'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="text-[11px] font-mono text-slate-500">
                              {formatDateTime(item.createdAt)}
                            </span>
                            {item.likes?.length > 0 && (
                              <span className="text-pink-400 font-semibold flex items-center gap-1 text-[11px]">
                                ❤️ {item.likes.length}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* User Message Bubble */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-400 block">
                            User Inquiry / Message:
                          </span>
                          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-100 font-medium whitespace-pre-wrap leading-relaxed">
                            {item.message}
                          </div>
                        </div>

                        {/* Existing Admin Reply Banner (if replied) */}
                        {hasReplied && (
                          <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-900/50 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                🛡️ Current Private Reply (Visible to User in Personal Support)
                              </span>
                              <span className="text-[10px] text-emerald-500/80 font-normal lowercase">
                                private to {item.userName}
                              </span>
                            </div>
                            <p className="text-xs text-emerald-200/90 whitespace-pre-wrap">
                              {item.adminReply}
                            </p>
                          </div>
                        )}

                        {/* Reply Form & Actions */}
                        <div className="pt-2 space-y-2.5">
                          <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span>💬</span>
                              <span>{hasReplied ? 'Edit Private Reply:' : 'Send Private Reply to User:'}</span>
                            </span>
                            <span className="text-emerald-400 text-[10px] font-medium">
                              🔒 Only visible to {item.userName} in Personal Support tab
                            </span>
                          </label>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={draftValue}
                              onChange={(e) => setReplyDrafts(prev => ({ ...prev, [item._id]: e.target.value }))}
                              placeholder="e.g. Yes, your Pro Plan has been activated! Enjoy unlimited scheduling."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReplyFeedback(item._id, item.userName);
                                }
                              }}
                              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                            />
                            <button
                              type="button"
                              disabled={isBusy || !draftValue.trim()}
                              onClick={() => handleReplyFeedback(item._id, item.userName)}
                              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0"
                            >
                              {isBusy ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span>{hasReplied ? '✓ Update Reply' : 'Send Reply ➔'}</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-500 font-mono">
                              User ID: {item.userId}
                            </span>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDeleteFeedback(item._id, item.userName)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-colors flex items-center gap-1"
                              title="Permanently remove inquiry from database"
                            >
                              <span>🗑️</span>
                              <span>Delete Inquiry</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>

                  {/* Pagination for Feedback Cards */}
                  <PaginationControl
                    currentPage={feedbackPage}
                    totalItems={filteredFeedbacks.length}
                    pageSize={feedbackPageSize}
                    onPageChange={setFeedbackPage}
                    onPageSizeChange={setFeedbackPageSize}
                    pageSizeOptions={[10, 20, 30]}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 5: TRAFFIC & CONVERSION ANALYTICS                              */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <AdminAnalyticsTab token={token} />
        )}
      </main>

      {/* ── Screenshot Modal Viewer ─────────────────────────────────────────── */}
      {previewScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewScreenshot(null)}
        >
          <div
            className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white">Payment Screenshot Preview</h4>
              <button
                type="button"
                onClick={() => setPreviewScreenshot(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="py-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewScreenshot}
                alt="Full receipt"
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-lg"
              />
            </div>
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setPreviewScreenshot(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── User Activity & Schedules Overview Modal ────────────────────── */}
      {selectedUserForDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedUserForDetails(null)}
        >
          <div
            className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xl font-bold text-white shadow-md shadow-emerald-500/20">
                  {(selectedUserForDetails.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg text-white">
                      {selectedUserForDetails.name || 'User Activity'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedUserForDetails.plan === 'pro'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : selectedUserForDetails.plan === 'starter'
                        ? 'bg-teal-950 text-teal-300 border border-teal-700'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {selectedUserForDetails.plan} Plan
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedUserForDetails.email} • {selectedUserForDetails.phone ? `+${selectedUserForDetails.phone}` : 'No phone linked'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForDetails(null)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 overflow-y-auto custom-scroll space-y-4">
              {/* Privacy Notice Banner */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <span className="text-sm">🛡️</span>
                <span>
                  <strong className="text-slate-300">Privacy Safeguard Active:</strong> Private message captions, images, and contact names are end-to-end encrypted and hidden. Only schedule activity counts, timestamps, and delivery statuses are displayed.
                </span>
              </div>

              {loadingActivity ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading schedule records…</span>
                </div>
              ) : (
                <>
                  {/* Quick Activity Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Schedules</span>
                      <span className="text-xl font-black text-white mt-0.5 block">
                        {userActivity?.totalSchedules ?? 0}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-yellow-950/20 border border-yellow-900/40 text-center">
                      <span className="text-[10px] text-yellow-400 block font-semibold">Pending / In Queue</span>
                      <span className="text-xl font-black text-yellow-300 mt-0.5 block">
                        {userActivity?.statusBreakdown?.pending ?? 0}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-center">
                      <span className="text-[10px] text-emerald-400 block font-semibold">Sent / Delivered</span>
                      <span className="text-xl font-black text-emerald-300 mt-0.5 block">
                        {(userActivity?.statusBreakdown?.sent ?? 0) + (userActivity?.statusBreakdown?.delivered ?? 0) + (userActivity?.statusBreakdown?.read ?? 0)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-center">
                      <span className="text-[10px] text-red-400 block font-semibold">Failed</span>
                      <span className="text-xl font-black text-red-300 mt-0.5 block">
                        {userActivity?.statusBreakdown?.failed ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Activity Timeline List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                      Recent Activity Log ({userActivity?.recentActivities?.length ?? 0})
                    </h4>
                    {!userActivity?.recentActivities || userActivity.recentActivities.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/50 rounded-2xl border border-slate-800/60">
                        No scheduled messages found for this user account.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[35vh] overflow-y-auto custom-scroll pr-1">
                        {userActivity.recentActivities.map((act, idx) => (
                          <div
                            key={act.id || idx}
                            className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">
                                {act.mediaType === 'image' ? '📷' :
                                 act.mediaType === 'video' ? '🎥' :
                                 act.mediaType === 'audio' ? '🎵' :
                                 act.mediaType === 'multiple' ? '📁' : '💬'}
                              </span>
                              <div>
                                <div className="text-slate-300 font-semibold">
                                  Scheduled for: <strong className="text-white">{formatDateTime(act.scheduledAt)}</strong>
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Created: {formatDateTime(act.createdAt)}
                                  {act.mediaType && (
                                    <span className="ml-2 text-emerald-400">
                                      • {act.mediaType.toUpperCase()} ({act.mediaCount} file{act.mediaCount > 1 ? 's' : ''})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                act.status === 'read' || act.status === 'delivered' || act.status === 'sent'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : act.status === 'pending'
                                  ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                                  : act.status === 'failed'
                                  ? 'bg-red-950 text-red-300 border border-red-800'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {act.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserForDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
