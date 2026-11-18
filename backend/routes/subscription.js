const express = require('express');
const router = express.Router();
const db = require('../db');
let contactRouter = null;
try {
  contactRouter = require('./contact');
} catch (_) {}

// Plan configurations & Pricing (Monthly & Yearly with Offers)
const PLANS_CONFIG = {
  starter: {
    key: 'starter',
    name: 'Starter Plan',
    pricing: {
      monthly: {
        amount: 199,
        originalAmount: 249,
        interval: 'month',
        durationDays: 30,
        label: '₹199 / month'
      },
      yearly: {
        amount: 1999,
        originalAmount: 2400,
        interval: 'year',
        durationDays: 365,
        discountText: 'Save ₹401 (Special Offer)',
        label: '₹1,999 / year'
      }
    },
    amount: 199,
    currency: 'INR',
    symbol: '₹',
    monthlyLimit: 250,
    badge: 'Popular',
    icon: '⚡',
    features: [
      '250 Scheduled Messages / month (Auto-renews every month)',
      'Send to up to 20 Contacts at once',
      'Send to up to 10 Groups at once',
      'Images, Audio, Docs & Stickers support',
      'Recurring Schedules (Daily / Weekly repeats)',
      'Smart Name Variables ({Name})',
      'Google Contacts Sync (up to 2 accounts)',
      'Priority Delivery Queue'
    ]
  },
  pro: {
    key: 'pro',
    name: 'Pro Plan',
    pricing: {
      monthly: {
        amount: 499,
        originalAmount: 599,
        interval: 'month',
        durationDays: 30,
        label: '₹499 / month'
      },
      yearly: {
        amount: 4999,
        originalAmount: 6000,
        interval: 'year',
        durationDays: 365,
        discountText: 'Save ₹1,001 (Mega Offer)',
        label: '₹4,999 / year'
      }
    },
    amount: 499,
    currency: 'INR',
    symbol: '₹',
    monthlyLimit: 100000,
    isUnlimited: true,
    badge: 'Ultimate Power',
    icon: '🚀',
    features: [
      '👑 100% Unlimited Scheduled Messages',
      'Unlimited Contacts & Groups at once',
      'All Media (Videos, Documents, PDFs, Audio)',
      'Smart Media Editor (Draw, Shapes, Arrows, Blur & Text)',
      'WhatsApp Status & Story Scheduling',
      'WhatsApp Poll Scheduling',
      'Smart Timezone Auto-Adjustment',
      'Google Contacts Multi-Account Sync',
      'VIP 24/7 Priority Support & Fast Server Dispatch'
    ]
  }
};

const TARGET_ADMIN_EMAILS = ['aniketchouhan243@gmail.com', 'aniketchouhan314@gmail.com'];

async function notifyAdminSubscriptionAlert({ name, email, phone, plan, billingCycle, amount, utr, screenshotUrl }) {
  try {
    const planLabel = `${plan === 'pro' ? 'Pro Plan' : 'Starter Plan'} (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`;
    const subject = `🔔 [Payment Alert] New Subscription: ${planLabel} by ${name || email}`;

    // 1. Dispatch via the established Contact Mailer Pipeline (Same engine delivering Contact Us to aniketchouhan243@gmail.com)
    if (contactRouter && typeof contactRouter.dispatchDirectEmail === 'function') {
      try {
        await contactRouter.dispatchDirectEmail({
          loginName: name || 'User',
          loginEmail: email,
          whatsappNumber: phone,
          contactEmail: email,
          paymentDetails: {
            hasPaid: true,
            amountPaid: `₹${amount}`,
            paymentMethod: `UPI QR Scanner (${billingCycle.toUpperCase()})`,
            payerName: name || 'User',
            payerEmail: email,
            payerRef: utr
          },
          subject: `💳 Payment Alert: New ${planLabel} by ${name || email}`,
          message: `NEW SUBSCRIPTION PAYMENT VERIFICATION REQUEST:\n\nPlan: ${planLabel}\nAmount Paid: ₹${amount}\n12-Digit UTR: ${utr}\nUser Name: ${name || 'N/A'}\nUser Email: ${email}\nWhatsApp: +${phone}\nBilling Cycle: ${billingCycle.toUpperCase()}\n\nPlease visit the Admin Panel to review the screenshot and approve: https://www.wascheduler.site/admin`
        });
        console.log(`[Subscription Mailer] ✅ Successfully dispatched via Contact mailer pipeline to aniketchouhan243@gmail.com`);
      } catch (dispErr) {
        console.warn(`[Subscription Mailer] Contact mailer dispatch notice:`, dispErr.message);
      }
    }

    // 2. Direct SMTP attempt for both admin emails
    let nodemailer = null;
    try { nodemailer = require('nodemailer'); } catch (_) {}
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || process.env.GMAIL_PASS;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 24px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 22px;">💳 New Subscription Payment Received</h2>
          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">A user has submitted payment proof for verification.</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #64748b;">Plan:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${planLabel}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Amount Paid:</td><td style="padding: 8px 0; font-weight: bold; color: #059669; font-size: 16px;">₹${amount}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">12-Digit UTR:</td><td style="padding: 8px 0; font-weight: bold; font-family: monospace; font-size: 15px; color: #2563eb;">${utr}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">User Name:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${name || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">User Email:</td><td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">WhatsApp Phone:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">+${phone}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Billing Cycle:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${billingCycle.toUpperCase()}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Submission Time:</td><td style="padding: 8px 0; color: #64748b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td></tr>
          </table>

          ${screenshotUrl ? `
            <div style="margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              <p style="font-weight: bold; margin-bottom: 8px; color: #334155;">Payment Screenshot:</p>
              <img src="${screenshotUrl}" alt="Payment Proof" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;" />
            </div>
          ` : ''}

          <div style="margin-top: 24px; text-align: center;">
            <a href="https://www.wascheduler.site/admin" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; font-size: 14px;">
              Open Admin Panel to Verify & Approve →
            </a>
          </div>
        </div>
      </div>
    `;

    if (nodemailer && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass }
      });
      await transporter.sendMail({
        from: `"WA Scheduler Billing" <${smtpUser}>`,
        to: TARGET_ADMIN_EMAILS.join(', '),
        subject,
        html
      });
      console.log(`[Subscription Mailer] ✅ Email alert sent to ${TARGET_ADMIN_EMAILS.join(', ')}`);
    } else {
      console.log(`[Subscription Alert] New payment recorded for ${email} (Plan: ${planLabel}, UTR: ${utr}).`);
    }
  } catch (err) {
    console.error('[Subscription Mailer Error]:', err.message);
  }
}

/**
 * GET /api/subscription/config
 * Returns UPI configuration and available plans
 */
router.get('/config', (req, res) => {
  try {
    const upiId = process.env.UPI_ID || 'aniketchouhan314@okicici';
    const upiName = process.env.UPI_NAME || 'WA Scheduler';
    return res.json({
      success: true,
      upiId,
      upiName,
      scannerImageUrl: '/upi-qr-scanner.png',
      plans: PLANS_CONFIG,
      currency: 'INR',
      supportedCurrencies: [
        { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee', active: true },
        { code: 'USD', symbol: '$', label: 'USD ($) - Coming Soon (Stripe / PayPal)', active: false }
      ],
      ruleNotice: 'Please upload a screenshot of a payment made via the scanner within 30 minutes of activation.'
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
    const { name, email, phone, plan, billingCycle = 'monthly', utr, screenshotUrl, scannerActivatedAt } = req.body || {};

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

    const cycleKey = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const planDetails = PLANS_CONFIG[planKey];
    const pricingInfo = planDetails.pricing[cycleKey] || planDetails.pricing.monthly;

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

    const subRequest = await db.createSubscriptionRequest({
      userId: userAccount?._id || null,
      email: cleanEmail,
      phone: cleanPhone,
      plan: planKey,
      billingCycle: cycleKey,
      durationDays: pricingInfo.durationDays,
      amount: pricingInfo.amount,
      currency: 'INR',
      utr: cleanUtr,
      screenshotUrl
    });

    // Send email alert to admin with all details & screenshot preview
    notifyAdminSubscriptionAlert({
      name: name || userAccount?.name || '',
      email: cleanEmail,
      phone: cleanPhone,
      plan: planKey,
      billingCycle: cycleKey,
      amount: pricingInfo.amount,
      utr: cleanUtr,
      screenshotUrl
    }).catch(e => console.warn('[Subscription Alert] Failed to send email alert:', e.message));

    // Optional 5-minute auto-approval fallback
    setTimeout(async () => {
      try {
        const checkReq = await db.SubscriptionRequest.findById(subRequest._id);
        if (checkReq && checkReq.status === 'pending') {
          await db.approveSubscriptionRequest(subRequest._id, 'Auto-verified after queue window');
          console.log(`[Subscription] Auto-approved request ${subRequest._id} for ${cleanEmail} -> ${planKey} (${cycleKey})`);
        }
      } catch (err) {
        console.error('[Subscription] Auto-approval error:', err.message);
      }
    }, 5 * 60 * 1000);

    return res.json({
      success: true,
      message: '🎉 Congratulations! Your payment details have been submitted. If your plan does not activate immediately, our team will verify and activate it within 24 hours. Don’t worry!',
      request: {
        id: subRequest._id,
        plan: subRequest.plan,
        billingCycle: cycleKey,
        planName: `${planDetails.name} (${cycleKey.toUpperCase()})`,
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
