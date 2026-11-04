const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
const db = require('../db');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'wa_admin_jwt_secret_dev_key_2026';
const TARGET_ADMIN_EMAIL = 'aniketchouhan243@gmail.com';

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (!decoded || !decoded.isAdmin) {
      return res.status(403).json({ error: 'Access denied: not an admin.' });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin token.' });
  }
}

// ─── Direct Background Email Dispatcher ──────────────────────────────────────
async function dispatchDirectEmail({ loginName, loginEmail, whatsappNumber, contactEmail, paymentDetails, subject, message }) {
  const mailSubject = `[WA Scheduler] ${subject} - ${loginName || contactEmail}`;
  const textContent = `
NEW SUPPORT INQUIRY RECEIVED ON WA SCHEDULER:
=============================================
Login Name: ${loginName || 'Guest'}
Login Email: ${loginEmail || 'Guest'}
Connected WhatsApp: ${whatsappNumber || 'Not connected'}
Reply-To Email: ${contactEmail}

PAYMENT DETAILS:
Payment Made: ${paymentDetails.hasPaid ? 'YES' : 'NO'}
Amount Paid: ${paymentDetails.amountPaid || 'N/A'}
Payment Method/App: ${paymentDetails.paymentMethod || 'N/A'}
Payer Name: ${paymentDetails.payerName || 'N/A'}
Payer Email: ${paymentDetails.payerEmail || 'N/A'}
UPI Ref / UTR: ${paymentDetails.payerRef || 'N/A'}

USER MESSAGE:
${message}
=============================================
`;

  const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
    <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px; margin-top: 0;">📩 New Support Request - WA Scheduler</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
      <tr><td style="padding: 7px 0; font-weight: bold; width: 170px; color: #475569;">Login Name:</td><td style="color: #0f172a;">${loginName || 'Guest'}</td></tr>
      <tr><td style="padding: 7px 0; font-weight: bold; color: #475569;">Login Email:</td><td style="color: #0f172a;">${loginEmail || 'Guest'}</td></tr>
      <tr><td style="padding: 7px 0; font-weight: bold; color: #475569;">Connected WhatsApp:</td><td style="color: #059669; font-weight: bold;">${whatsappNumber || 'Not connected'}</td></tr>
      <tr><td style="padding: 7px 0; font-weight: bold; color: #475569;">Contact / Reply Email:</td><td><a href="mailto:${contactEmail}" style="color: #0284c7; font-weight: bold;">${contactEmail}</a></td></tr>
      <tr><td style="padding: 7px 0; font-weight: bold; color: #475569;">Topic / Category:</td><td style="color: #0f172a;">${subject}</td></tr>
    </table>

    ${paymentDetails.hasPaid ? `
    <div style="margin-top: 18px; padding: 14px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px;">
      <h4 style="margin: 0 0 10px 0; color: #7e22ce; font-size: 14px;">💳 Payment Verification Details:</h4>
      <p style="margin: 5px 0; font-size: 13px;"><strong>Amount Paid:</strong> <span style="color: #15803d; font-weight: bold;">${paymentDetails.amountPaid || '—'}</span></p>
      <p style="margin: 5px 0; font-size: 13px;"><strong>Payment Method / UPI App:</strong> <span style="color: #1d4ed8; font-weight: bold;">${paymentDetails.paymentMethod || '—'}</span></p>
      <p style="margin: 5px 0; font-size: 13px;"><strong>Payer Name:</strong> ${paymentDetails.payerName || '—'}</p>
      <p style="margin: 5px 0; font-size: 13px;"><strong>Payer Email:</strong> ${paymentDetails.payerEmail || '—'}</p>
      <p style="margin: 5px 0; font-size: 13px;"><strong>UPI Ref / UTR No:</strong> ${paymentDetails.payerRef || '—'}</p>
    </div>
    ` : ''}

    <div style="margin-top: 20px;">
      <h4 style="color: #334155; margin-bottom: 8px; font-size: 14px;">💬 User Message:</h4>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 10px; font-size: 14px; color: #1e293b; white-space: pre-wrap; line-height: 1.5;">${message}</div>
    </div>
  </div>
  `;

  // 1. Try Nodemailer if SMTP configured
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASS;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        auth: { user: smtpUser, pass: smtpPass }
      });

      await transporter.sendMail({
        from: `"${loginName || 'WA Scheduler User'}" <${smtpUser}>`,
        to: TARGET_ADMIN_EMAIL,
        replyTo: contactEmail,
        subject: mailSubject,
        text: textContent,
        html: htmlContent
      });
      console.log(`[Contact Mailer] Sent via SMTP to ${TARGET_ADMIN_EMAIL}`);
      return true;
    } catch (smtpErr) {
      console.warn('[Contact Mailer] SMTP delivery failed:', smtpErr.message);
    }
  }

  // 2. Direct HTTP Delivery to FormSubmit (Zero config direct to target inbox)
  try {
    await axios.post(`https://formsubmit.co/ajax/${TARGET_ADMIN_EMAIL}`, {
      _subject: mailSubject,
      _replyto: contactEmail,
      loginName: loginName || 'Guest',
      loginEmail: loginEmail || 'Guest',
      whatsappNumber: whatsappNumber || 'Not connected',
      replyToEmail: contactEmail,
      amountPaid: paymentDetails.amountPaid || 'None',
      paymentMethod: paymentDetails.paymentMethod || 'None',
      payerName: paymentDetails.payerName || 'None',
      payerEmail: paymentDetails.payerEmail || 'None',
      payerRef: paymentDetails.payerRef || 'None',
      message: message
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 8000
    });
    console.log(`[Contact Mailer] Dispatched directly via HTTP to ${TARGET_ADMIN_EMAIL}`);
    return true;
  } catch (httpErr) {
    console.warn('[Contact Mailer] Direct HTTP delivery failed:', httpErr.message);
  }

  return false;
}

// ─── Public Submit Contact Form ──────────────────────────────────────────────
// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const {
      loginName = '',
      loginEmail = '',
      whatsappNumber = '',
      contactEmail = '',
      paymentDetails = {},
      subject = 'General Support',
      message = ''
    } = req.body || {};

    if (!contactEmail || !contactEmail.trim()) {
      return res.status(400).json({ error: 'Contact / Reply Email is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message description cannot be empty.' });
    }

    const newContact = new db.ContactMessage({
      loginName: String(loginName).trim(),
      loginEmail: String(loginEmail).trim(),
      whatsappNumber: String(whatsappNumber).trim(),
      contactEmail: String(contactEmail).trim(),
      paymentDetails: {
        hasPaid: Boolean(paymentDetails?.hasPaid),
        amountPaid: String(paymentDetails?.amountPaid || '').trim(),
        paymentMethod: String(paymentDetails?.paymentMethod || '').trim(),
        payerName: String(paymentDetails?.payerName || '').trim(),
        payerEmail: String(paymentDetails?.payerEmail || '').trim(),
        payerRef: String(paymentDetails?.payerRef || '').trim()
      },
      subject: String(subject).trim() || 'General Support',
      message: String(message).trim(),
      sessionId: req.sessionId || '',
      ip: req.ip || ''
    });

    await newContact.save();

    // Automatically trigger direct email dispatch to target admin
    dispatchDirectEmail({
      loginName: String(loginName).trim(),
      loginEmail: String(loginEmail).trim(),
      whatsappNumber: String(whatsappNumber).trim(),
      contactEmail: String(contactEmail).trim(),
      paymentDetails: newContact.paymentDetails,
      subject: String(subject).trim() || 'General Support',
      message: String(message).trim()
    }).catch(e => console.warn('[Contact] Background email dispatch error:', e.message));

    console.log(`[Contact] Inquiry saved & dispatched for ${contactEmail} (Target: ${TARGET_ADMIN_EMAIL})`);

    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully and dispatched directly to support!',
      targetEmail: TARGET_ADMIN_EMAIL,
      contactId: newContact._id
    });
  } catch (err) {
    console.error('[Contact Error]', err);
    res.status(500).json({ error: 'Failed to record contact request: ' + err.message });
  }
});

// ─── Admin View All Contact Messages ─────────────────────────────────────────
// GET /api/contact/messages
router.get('/messages', authenticateAdmin, async (req, res) => {
  try {
    const messages = await db.ContactMessage.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Update Message Status ─────────────────────────────────────────────
// PUT /api/contact/messages/:id
router.put('/messages/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminReply !== undefined) update.adminReply = adminReply;

    const updated = await db.ContactMessage.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ error: 'Contact message not found.' });

    res.json({ success: true, message: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
