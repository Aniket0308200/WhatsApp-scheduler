const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── Super Admin Credentials ────────────────────────────────────────────────
const ADMIN_NAME = 'Aniket Chouhan';
const ADMIN_EMAIL = 'aniketchouhan314@gmail.com';
const ADMIN_PASS = '(ac0308)';

/**
 * Middleware: Verify Admin Session
 */
function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers['x-admin-token'];
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (authHeader) {
      token = authHeader;
    }

    if (!token) {
      return res.status(401).json({ error: 'Admin session required.' });
    }

    const decryptedStr = db.decrypt(token);
    const decrypted = JSON.parse(decryptedStr);

    if (
      !decrypted ||
      decrypted.role !== 'admin' ||
      String(decrypted.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    ) {
      return res.status(401).json({ error: 'Unauthorized or expired admin session.' });
    }

    req.admin = decrypted;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid admin credentials or token.' });
  }
}

/**
 * POST /api/admin/login
 * Validates admin name, email, and password.
 */
router.post('/login', (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    const inputName = String(name || '').trim().toLowerCase();
    const inputEmail = String(email || '').trim().toLowerCase();
    const inputPass = String(password || '');

    if (!inputName || !inputEmail || !inputPass) {
      return res.status(400).json({ error: 'Name, email, and password are all required.' });
    }

    const isNameMatch = inputName === ADMIN_NAME.toLowerCase();
    const isEmailMatch = inputEmail === ADMIN_EMAIL.toLowerCase();
    const isPassMatch = inputPass === ADMIN_PASS || inputPass === 'ac0308';

    if (!isNameMatch || !isEmailMatch || !isPassMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials. Access denied.' });
    }

    // Generate secure admin token
    const token = db.encrypt(JSON.stringify({
      role: 'admin',
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      timestamp: Date.now()
    }));

    return res.json({
      success: true,
      admin: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL
      },
      token
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/me
 * Checks if current admin session is valid.
 */
router.get('/me', requireAdminAuth, (req, res) => {
  return res.json({
    success: true,
    admin: {
      name: req.admin.name || ADMIN_NAME,
      email: req.admin.email || ADMIN_EMAIL
    }
  });
});

/**
 * GET /api/admin/stats
 * Overview dashboard metrics (Users count, online now, plan distribution, locked accounts)
 */
router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    const users = await db.getAllUsersForAdmin();

    let onlineCount = 0;
    let freeCount = 0;
    let starterCount = 0;
    let proCount = 0;
    let lockedCount = 0;

    for (const u of users) {
      if (u.isOnline) onlineCount++;
      if (u.isLocked) lockedCount++;
      if (u.plan === 'pro') proCount++;
      else if (u.plan === 'starter') starterCount++;
      else freeCount++;
    }

    const pendingSubs = await db.SubscriptionRequest.countDocuments({ status: 'pending' });

    return res.json({
      success: true,
      stats: {
        totalUsers: users.length,
        onlineUsers: onlineCount,
        lockedUsers: lockedCount,
        pendingSubscriptions: pendingSubs,
        plans: {
          free: freeCount,
          starter: starterCount,
          pro: proCount
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/users
 * Returns list of all visitors & users.
 * STRICT PRIVACY GUARANTEE: Does NOT return messages, captions, or contact phonebooks.
 */
router.get('/users', requireAdminAuth, async (req, res) => {
  try {
    const users = await db.getAllUsersForAdmin();
    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/users/:id/activity
 * Overview of schedules (counts, status, schedule times) with ZERO message text leakage.
 */
router.get('/users/:id/activity', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await db.getUserActivityOverviewForAdmin(id);
    return res.json({
      success: true,
      activity
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/users/:id/plan
 * Unlocks or changes user plan (free, starter, pro) with 1 click.
 */
router.post('/users/:id/plan', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, billingCycle } = req.body || {};

    if (!plan || !['free', 'starter', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Valid plan required: free, starter, or pro.' });
    }

    const updated = await db.updateUserPlanByAdmin(id, plan, billingCycle || 'monthly');
    return res.json({
      success: true,
      message: `Plan successfully set to ${plan.toUpperCase()} (${(billingCycle || 'monthly').toUpperCase()})`,
      user: updated
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/users/:id/lock
 * Locks (suspends) or unlocks (restores) a user account.
 */
router.post('/users/:id/lock', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body || {};

    const updated = await db.updateUserLockByAdmin(id, Boolean(isLocked));
    return res.json({
      success: true,
      message: isLocked ? 'Account has been locked.' : 'Account has been unlocked.',
      user: updated
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/admin/subscriptions
 * Fetches UPI subscription requests for manual verification
 */
router.get('/subscriptions', requireAdminAuth, async (req, res) => {
  try {
    const status = req.query.status || null;
    const requests = await db.getAllSubscriptionRequests(status);
    return res.json({
      success: true,
      requests
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/subscriptions/:id/approve
 */
router.post('/subscriptions/:id/approve', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body || {};
    const approved = await db.approveSubscriptionRequest(id, adminNotes);
    return res.json({
      success: true,
      message: `Plan ${approved.plan.toUpperCase()} activated for ${approved.email}!`,
      request: approved
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/subscriptions/:id/reject
 */
router.post('/subscriptions/:id/reject', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body || {};
    const rejected = await db.rejectSubscriptionRequest(id, adminNotes);
    return res.json({
      success: true,
      message: `Subscription request rejected.`,
      request: rejected
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/subscriptions/:id
 * Permanently deletes a subscription request from the database to save space.
 */
router.delete('/subscriptions/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.SubscriptionRequest.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Subscription request not found.' });
    }
    return res.json({
      success: true,
      message: 'Subscription request permanently deleted from database.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/feedbacks
 * Fetches all in-app feedback and support queries from users
 */
router.get('/feedbacks', requireAdminAuth, async (req, res) => {
  try {
    const feedbacks = await db.Feedback.find().sort({ createdAt: -1 }).lean();
    return res.json({
      success: true,
      count: feedbacks.length,
      feedbacks
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/feedbacks/:id/reply
 * Admin replies to a user's feedback or support query.
 * Appends to adminReplies thread so consecutive replies are supported like a chatbox.
 */
router.post('/feedbacks/:id/reply', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body || {};
    if (reply === undefined || reply === null) {
      return res.status(400).json({ error: 'Reply text is required.' });
    }

    const cleanReply = String(reply).trim();
    if (!cleanReply) {
      return res.status(400).json({ error: 'Reply message cannot be empty.' });
    }

    const feedback = await db.Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback message not found.' });
    }

    if (!Array.isArray(feedback.adminReplies)) {
      feedback.adminReplies = [];
    }

    // Append new reply to thread
    feedback.adminReplies.push({
      text: cleanReply,
      createdAt: new Date()
    });

    feedback.adminReply = cleanReply; // Latest reply for backward compatibility
    feedback.isReplied = true;
    await feedback.save();

    return res.json({
      success: true,
      message: 'Private reply saved and dispatched to user support view.',
      feedback
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/feedbacks/:id/toggle-replied
 * Marks a feedback inquiry as Replied / Resolved or toggles it.
 */
router.post('/feedbacks/:id/toggle-replied', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isReplied } = req.body || {};

    const feedback = await db.Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback message not found.' });
    }

    feedback.isReplied = isReplied !== undefined ? Boolean(isReplied) : !feedback.isReplied;
    await feedback.save();

    return res.json({
      success: true,
      message: feedback.isReplied ? 'Marked as replied.' : 'Marked as awaiting reply.',
      feedback
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/feedbacks/:id
 * Permanently deletes a feedback/support query to maintain database hygiene.
 */
router.delete('/feedbacks/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.Feedback.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Feedback message not found.' });
    }
    return res.json({
      success: true,
      message: 'Feedback inquiry permanently deleted.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/analytics
 * Fetches analytics summary & timeline for the specified date range (Kolkata time).
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/analytics', requireAdminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query || {};
    const data = await db.getAnalyticsData(startDate, endDate);
    return res.json({
      success: true,
      ...data
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

