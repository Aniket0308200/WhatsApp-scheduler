const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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

    console.log(`[Contact] New inquiry received from ${contactEmail} (Target: ${TARGET_ADMIN_EMAIL})`);

    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully! Our team will respond to your email soon.',
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
