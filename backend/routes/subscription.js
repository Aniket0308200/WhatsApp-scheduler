const express = require('express');
const router = express.Router();
const db = require('../db');

// Plan configurations & Pricing
const PLANS_CONFIG = {
  starter: {
    key: 'starter',
    name: 'Starter Plan',
    amount: 199,
    currency: 'INR',
    symbol: '₹',
    interval: 'month',
    monthlyLimit: 250,
    badge: 'Popular',
    features: [
      '250 Scheduled Messages / month',
      'Send to up to 20 Contacts at once',
      'Send to up to 10 Groups at once',
      'Images, Audio & Stickers support',
      'Recurring Schedules (Daily / Weekly repeats)',
      'Smart Name Variables ({Name})',
      'Google Contacts Sync (up to 2 accounts)',
      'Priority Delivery Queue'
    ]
  },
  pro: {
    key: 'pro',
    name: 'Pro Plan',
    amount: 499,
    currency: 'INR',
    symbol: '₹',
    interval: 'month',
    monthlyLimit: 1000,
    badge: 'Ultimate Power',
    features: [
      'Unlimited / 1,000 Scheduled Messages / month',
      'Unlimited Contacts & Groups at once',
      'All Media (Videos, Documents, PDFs, Audio)',
      'WhatsApp Status & Story Scheduling',
      'WhatsApp Poll Scheduling',
      'Smart Timezone Auto-Adjustment',
      'Google Contacts Sync (Multi-Account)',
      'VIP 24/7 Priority Support & Advanced Delivery Analytics'
    ]
  }
};

/**
 * GET /api/subscription/config
 * Returns UPI configuration and available plans
 */
router.get('/config', (req, res) => {
  try {
    const upiId = process.env.UPI_ID || 'wascheduler@upi';
    const upiName = process.env.UPI_NAME || 'WhatsApp Scheduler';
    return res.json({
      success: true,
      upiId,
      upiName,
      plans: PLANS_CONFIG,
      currency: 'INR',
      supportedCurrencies: [
        { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee', active: true },
        { code: 'USD', symbol: '$', label: 'USD ($) - Coming Soon (Stripe / PayPal)', active: false }
      ],
      ruleNotice: 'Please upload a screenshot of a payment made within the last 30 minutes. Older or reused screenshots will be rejected.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/subscription/submit
 * Submits UPI payment details, 12-digit UTR, screenshot for manual verification
 */
router.post('/submit', async (req, res) => {
  try {
    const { email, phone, plan, utr, screenshotUrl } = req.body || {};

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'WhatsApp phone number with country code is required (e.g. +91 9876543210).' });
    }

    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return res.status(400).json({ error: 'Please enter a valid WhatsApp phone number with country code (e.g. +919876543210).' });
    }

    const planKey = (plan || '').toLowerCase().trim();
    if (!PLANS_CONFIG[planKey]) {
      return res.status(400).json({ error: 'Invalid plan selected. Please choose Starter or Pro.' });
    }

    // Validate 12-digit UTR
    const cleanUtr = String(utr || '').replace(/\s+/g, '').trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      return res.status(400).json({ error: 'UTR / Transaction Reference ID must be exactly 12 numeric digits.' });
    }

    // Validate screenshot is present
    if (!screenshotUrl || !screenshotUrl.trim()) {
      return res.status(400).json({ error: 'Payment screenshot is required. Please attach a screenshot of your successful UPI transaction.' });
    }

    // Check existing account if any
    const userAccount = await db.findAuthAccountByEmail(cleanEmail);
    if (userAccount) {
      // Disallow upgrading to a lower or same active plan
      if (userAccount.plan === 'pro') {
        return res.status(400).json({ error: 'Your account is already on the Pro Plan.' });
      }
      if (userAccount.plan === planKey) {
        return res.status(400).json({ error: `You already have an active ${PLANS_CONFIG[planKey].name}.` });
      }
    }

    const planDetails = PLANS_CONFIG[planKey];

    const subRequest = await db.createSubscriptionRequest({
      userId: userAccount?._id || null,
      email: cleanEmail,
      phone: cleanPhone,
      plan: planKey,
      amount: planDetails.amount,
      currency: 'INR',
      utr: cleanUtr,
      screenshotUrl
    });

    return res.json({
      success: true,
      message: 'Payment Details Received! Your plan will be activated shortly after admin verification.',
      request: {
        id: subRequest._id,
        plan: subRequest.plan,
        planName: planDetails.name,
        amount: subRequest.amount,
        currency: subRequest.currency,
        utr: subRequest.utr,
        status: subRequest.status,
        createdAt: subRequest.createdAt
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to submit payment verification request.' });
  }
});

/**
 * GET /api/subscription/status
 * Fetches the user's current subscription status and pending request if any
 */
router.get('/status', async (req, res) => {
  try {
    let email = req.query.email;

    // Check authorization token if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decryptedStr = db.decrypt(token);
        const decrypted = JSON.parse(decryptedStr);
        if (decrypted && decrypted.email) {
          email = decrypted.email;
        }
      } catch (e) {
        // Fall back to query param
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Email parameter or auth token is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userAccount = await db.findAuthAccountByEmail(cleanEmail);
    const latestRequest = await db.getLatestSubscriptionRequest(cleanEmail);

    return res.json({
      success: true,
      plan: userAccount?.plan || 'free',
      planStatus: userAccount?.planStatus || (userAccount?.plan || 'free'),
      pendingRequest: latestRequest && latestRequest.status === 'pending' ? {
        id: latestRequest._id,
        plan: latestRequest.plan,
        planName: PLANS_CONFIG[latestRequest.plan]?.name || latestRequest.plan,
        amount: latestRequest.amount,
        currency: latestRequest.currency,
        utr: latestRequest.utr,
        status: latestRequest.status,
        createdAt: latestRequest.createdAt
      } : null,
      latestRequest: latestRequest ? {
        id: latestRequest._id,
        plan: latestRequest.plan,
        planName: PLANS_CONFIG[latestRequest.plan]?.name || latestRequest.plan,
        amount: latestRequest.amount,
        currency: latestRequest.currency,
        utr: latestRequest.utr,
        status: latestRequest.status,
        createdAt: latestRequest.createdAt,
        verifiedAt: latestRequest.verifiedAt
      } : null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/subscription/admin/requests
 * Lists all subscription verification requests (for admin)
 */
router.get('/admin/requests', async (req, res) => {
  try {
    const status = req.query.status || null;
    const requests = await db.getAllSubscriptionRequests(status);
    return res.json({ success: true, requests });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/subscription/admin/:id/approve
 * Approves a payment and activates the user's plan
 */
router.post('/admin/:id/approve', async (req, res) => {
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
 * POST /api/subscription/admin/:id/reject
 * Rejects a payment verification request
 */
router.post('/admin/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body || {};
    const rejected = await db.rejectSubscriptionRequest(id, adminNotes);
    return res.json({
      success: true,
      message: `Payment request for ${rejected.email} was rejected.`,
      request: rejected
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
