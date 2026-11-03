const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── Super Admin Credentials ────────────────────────────────────────────────
const ADMIN_NAME = 'Aniket Chouhan';
const ADMIN_EMAIL = 'aniketchouhan314@gmail.com';
const ADMIN_PASS = 'ac0308';

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
    const isPassMatch = inputPass === ADMIN_PASS;

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
 * POST /api/admin/users/:id/plan
 * Unlocks or changes user plan (free, starter, pro) with 1 click.
 */
router.post('/users/:id/plan', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body || {};

    if (!plan || !['free', 'starter', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Valid plan required: free, starter, or pro.' });
    }

    const updated = await db.updateUserPlanByAdmin(id, plan);
    return res.json({
      success: true,
      message: `Plan successfully set to ${plan.toUpperCase()}`,
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

module.exports = router;
