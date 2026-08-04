/**
 * server.js — Express API server (Multi-Session support)
 *
 * Endpoints:
 *  GET  /api/status              → WA status + QR/pairing code + connected profile
 *  POST /api/pairing-code        → Request pairing code
 *  POST /api/logout              → Logout
 *  GET  /api/contact/:phone      → Look up a contact's display name
 *
 *  GET  /api/messages            → All scheduled messages
 *  POST /api/messages            → Create a scheduled message
 *  DELETE /api/messages/:id      → Cancel or delete a message
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors    = require('cors');

const db       = require('./db');
const whatsapp = require('./whatsapp');
const { startScheduler } = require('./scheduler');
const { parseContactsFile } = require('./contacts-import');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ─── Session ID Validation Middleware ─────────────────────────────────────────
app.use((req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  if (!sessionId && req.path.startsWith('/api')) {
    return res.status(400).json({ error: 'X-Session-ID header is required.' });
  }
  req.sessionId = sessionId;
  next();
});

// Helper to retrieve the sender's phone number from session state or session credentials
function getSenderPhoneFromSession(req) {
  if (!req.sessionId) return null;
  const profile = whatsapp.getConnectedProfile(req.sessionId);
  if (profile?.phone) return profile.phone;
  return whatsapp.getPhoneFromSession(req.sessionId);
}

// ─── WhatsApp status ──────────────────────────────────────────────────────────

/**
 * GET /api/status
 * Returns connection state, QR, pairing code, and connected profile info.
 */
app.get('/api/status', (req, res) => {
  // Auto-initialize WhatsApp for this session if it's completely new/untracked
  if (!whatsapp.hasSession(req.sessionId)) {
    console.log(`[Server] Initializing untracked session: ${req.sessionId}`);
    whatsapp.initWhatsApp(req.sessionId).catch((err) => {
      console.error(`[Server] Error initializing session ${req.sessionId}:`, err.message);
    });
  }

  res.json({
    status:      whatsapp.getStatus(req.sessionId),
    qr:          whatsapp.getQR(req.sessionId),
    pairingCode: whatsapp.getPairingCode(req.sessionId),
    profile:     whatsapp.getConnectedProfile(req.sessionId),
  });
});

/**
 * POST /api/pairing-code
 * Body: { phone: "628123456789" }
 */
app.post('/api/pairing-code', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Provide a valid phone number (digits only, 7–15 chars).' });
  }
  try {
    const code = await whatsapp.requestPairingCode(req.sessionId, phone);
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/logout
 */
app.post('/api/logout', async (req, res) => {
  try {
    await whatsapp.logout(req.sessionId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/contacts/search?q=John
 * Search contacts by name or phone for autosuggest.
 * Returns array of { phone, name }
 */
app.get('/api/contacts/search', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q || q.length < 2) return res.json([]);

  const senderPhone = getSenderPhoneFromSession(req);
  if (!senderPhone) return res.json([]);

  db.searchContacts(senderPhone, q, 10)
    .then(res.json.bind(res))
    .catch((err) => res.status(500).json({ error: err.message }));
});

/**
 * POST /api/contacts/import
 * Upload the contents of a .vcf/.csv file as a raw body with X-File-Name.
 */
app.post('/api/contacts/import', express.raw({ type: ['text/*', 'application/octet-stream'] }), async (req, res) => {
  try {
    const senderPhone = getSenderPhoneFromSession(req);
    if (!senderPhone) {
      return res.status(400).json({ error: 'WhatsApp must be connected to import contacts.' });
    }

    const filename = req.get('x-file-name') || req.body?.filename;
    let content = '';
    if (Buffer.isBuffer(req.body)) {
      const buffer = req.body;
      if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        content = buffer.toString('utf16le');
      } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
        const swapped = Buffer.from(buffer);
        for (let i = 0; i < swapped.length - 1; i += 2) {
          const temp = swapped[i];
          swapped[i] = swapped[i + 1];
          swapped[i + 1] = temp;
        }
        content = swapped.toString('utf16le');
      } else {
        content = buffer.toString('utf8');
      }
    } else {
      content = req.body?.content || '';
    }

    if (!filename || !content) return res.status(400).json({ error: 'Choose a non-empty .vcf or .csv contact file.' });

    const contacts = parseContactsFile(filename, content);
    if (!contacts.length) return res.status(400).json({ error: 'No valid phone numbers were found in this file.' });
    const imported = await db.upsertContacts(senderPhone, contacts);
    res.json({ imported, parsed: contacts.length });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not import contacts.' });
  }
});

/**
 * GET /api/contacts
 * Returns all contacts in SQLite DB for this user.
 */
app.get('/api/contacts', async (req, res) => {
  const senderPhone = getSenderPhoneFromSession(req);
  if (!senderPhone) return res.json([]);

  try {
    const contacts = await db.getAllContacts(senderPhone);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/contacts/resolve
 * Body: { phone: "918123456789" }
 * Active live contact resolution for immediate name lookup
 */
app.post('/api/contacts/resolve', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }

  if (whatsapp.getStatus(req.sessionId) !== 'connected') {
    return res.json({ name: null, exists: false, source: 'not_connected' });
  }

  try {
    const result = await whatsapp.resolveContactLive(req.sessionId, phone);
    res.json(result);
  } catch (err) {
    console.error('[Server] Live contact resolve error:', err.message);
    res.json({ name: null, exists: false, error: err.message });
  }
});

/**
 * GET /api/contact/:phone
 * Look up the WhatsApp display name for a single phone number.
 */
app.get('/api/contact/:phone', async (req, res) => {
  const phone = req.params.phone.replace(/\D/g, '');
  if (!phone || phone.length < 7) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }

  if (whatsapp.getStatus(req.sessionId) !== 'connected') {
    return res.json({ name: null, exists: false });
  }

  const senderPhone = getSenderPhoneFromSession(req);
  if (!senderPhone) return res.json({ name: null, exists: false });

  try {
    const cached = await db.getContactByPhone(senderPhone, phone);
    if (cached?.name) return res.json({ name: cached.name, exists: true, source: 'cache' });

    const verified = await whatsapp.verifyContact(req.sessionId, phone);
    res.json({ name: verified.name, exists: verified.exists, source: verified.exists ? 'whatsapp' : null });
  } catch (err) {
    res.json({ name: null, exists: false });
  }
});

// ─── Messages ─────────────────────────────────────────────────────────────────

app.get('/api/messages', async (req, res) => {
  const senderPhone = getSenderPhoneFromSession(req);
  if (!senderPhone) {
    return res.json([]);
  }
  try {
    res.json(await db.getAllMessages(senderPhone));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/messages
 * Body: { phone, message, scheduledAt, recipientName? }
 */
app.post('/api/messages', async (req, res) => {
  const { phone, message, scheduledAt, recipientName } = req.body;

  const senderPhone = getSenderPhoneFromSession(req);
  if (!senderPhone) {
    return res.status(400).json({ error: 'WhatsApp is not connected for this session.' });
  }

  if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number (digits only, 7–15 chars).' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }
  if (!scheduledAt || isNaN(Date.parse(scheduledAt))) {
    return res.status(400).json({ error: 'Invalid scheduledAt datetime.' });
  }

  const schedDate = new Date(scheduledAt);
  if (schedDate <= new Date()) {
    return res.status(400).json({ error: 'Scheduled time must be in the future.' });
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    let cleanName  = recipientName ? String(recipientName).trim().slice(0, 100) : null;

    if (!cleanName && whatsapp.getStatus(req.sessionId) === 'connected') {
      try {
        const contact = await db.getContactByPhone(senderPhone, cleanPhone);
        cleanName = contact?.name || whatsapp.getContactNameSync(req.sessionId, cleanPhone) || await whatsapp.getContactName(req.sessionId, cleanPhone);
      } catch (e) {
        console.error('[Server] Could not auto-resolve name:', e.message);
      }
    }

    const id = await db.insertMessage(senderPhone, cleanPhone, message.trim(), schedDate, cleanName);

    res.status(201).json({
      id,
      phone:          cleanPhone,
      recipient_name: cleanName,
      message:        message.trim(),
      scheduled_at:   db.toSqliteUtc(schedDate),
      status:         'pending',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/messages/:id
 * ?permanent=true → hard delete, otherwise cancels pending
 */
app.delete('/api/messages/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID.' });

  const senderPhone = getSenderPhoneFromSession(req);
  if (!senderPhone) {
    return res.status(400).json({ error: 'WhatsApp is not connected.' });
  }

  try {
    if (req.query.permanent === 'true') {
      await db.deleteMessage(senderPhone, id);
      res.json({ success: true, action: 'deleted' });
    } else {
      const changes = await db.cancelMessage(senderPhone, id);
      if (changes === 0) {
        return res.status(400).json({ error: 'Message not found or not pending.' });
      }
      res.json({ success: true, action: 'cancelled' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function performCleanSlate() {
  const fs = require('fs');
  const path = require('path');
  
  console.log('[Clean Slate] Performing one-time cleanup...');

  // 1. Delete files inside data/session/ (but keep subdirectories)
  const sessionRoot = path.join(__dirname, '..', 'data', 'session');
  if (fs.existsSync(sessionRoot)) {
    const entries = fs.readdirSync(sessionRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        try {
          fs.unlinkSync(path.join(sessionRoot, entry.name));
          console.log(`[Clean Slate] Deleted old unified session file: ${entry.name}`);
        } catch (e) {
          console.error(`[Clean Slate] Error deleting file ${entry.name}:`, e.message);
        }
      }
    }
  }

  // 2. Wipe the old global contacts.json and global scheduler.db if they still exist
  const oldContactsFile = path.join(__dirname, '..', 'data', 'contacts.json');
  if (fs.existsSync(oldContactsFile)) {
    try {
      fs.unlinkSync(oldContactsFile);
      console.log('[Clean Slate] Deleted old global contacts.json');
    } catch (_) {}
  }
  const oldDbFile = path.join(__dirname, '..', 'data', 'scheduler.db');
  if (fs.existsSync(oldDbFile)) {
    try {
      fs.unlinkSync(oldDbFile);
      console.log('[Clean Slate] Deleted old global scheduler.db');
    } catch (_) {}
  }
}

async function bootstrap() {
  await performCleanSlate();
  console.log('[Boot] Initializing sessions and databases...');

  whatsapp.setMessageStatusListener(async (senderPhone, waMessageId, status) => {
    try {
      const changed = await db.updateMessageStatusByWhatsAppId(senderPhone, waMessageId, status);
      if (changed) console.log(`[Delivery] [${senderPhone}] ${waMessageId} -> ${status}`);
    } catch (err) {
      console.error(`[Delivery] Error updating message status:`, err.message);
    }
  });

  // Only restore sessions if no current sessions exist to avoid conflicts
  const existingSessions = whatsapp.getAllActiveSessions() || [];
  if (existingSessions.length === 0) {
    whatsapp.bootstrapSessions().catch((err) => {
      console.error('[Boot] WhatsApp bootstrap sessions error:', err.message);
    });
  } else {
    console.log('[Boot] Skipping session bootstrap - active sessions detected');
  }

  startScheduler();

  // Find available port starting from 3001
  const findAvailablePort = (port) => {
    return new Promise((resolve, reject) => {
      const server = require('http').createServer();
      server.listen(port, () => {
        const actualPort = server.address().port;
        server.close(() => resolve(actualPort));
      });
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(findAvailablePort(port + 1));
        } else {
          reject(err);
        }
      });
    });
  };

  const availablePort = await findAvailablePort(PORT);
  
  const server = app.listen(availablePort, () => {
    console.log(`[Server] Running on http://localhost:${availablePort}`);
    
    if (availablePort !== PORT) {
      console.log(`[Server] Note: Using port ${availablePort} instead of ${PORT}`);
    }
  });

  server.on('error', (err) => {
    console.error('[Server] Server error:', err.message);
  });
}

bootstrap();

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Anti-Crash] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err, origin) => {
  console.error(`[Anti-Crash] Caught exception: ${err}\nException origin: ${origin}`);
});
