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
const { Contact } = db;
const { startScheduler } = require('./scheduler');
const { parseContactsFile } = require('./contacts-import');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function toVerifiedContact(document) {
  const jid = document.jid;
  const phone = db.decrypt(document.encryptedNumberOrJid);
  const name = db.decrypt(document.encryptedName);
  const isGroup = document.type === 'group';
  if (!jid || !phone || !name) return null;
  if (!isGroup && !db.isValidPersonalContactName(name, phone)) return null;
  return {
    phone,
    jid,
    name,
    isGroup,
    is_group: isGroup ? 1 : 0,
    type: document.type,
    source: document.source || 'db'
  };
}

// ─── Keep-alive health route ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is awake' });
});

// ─── Session ID Validation Middleware ─────────────────────────────────────────
app.use((req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId || req.query.state;
  if (!sessionId && req.path.startsWith('/api')) {
    if (
      req.path === '/api/status' ||
      req.path === '/api/health' ||
      req.path.startsWith('/api/auth/google') ||
      req.path.startsWith('/api/auth/google-login')
    ) {
      return next();
    }
    return res.status(400).json({ error: 'X-Session-ID header is required.' });
  }
  req.sessionId = sessionId; 
  next();
});

// ─── Google OAuth & Contacts Sync Routes ──────────────────────────────────────
const googleContactsRouter = require('./routes/googleContacts');
app.use('/api/auth/google', googleContactsRouter);

// ─── Feedback & Support Routes ────────────────────────────────────────────────
const feedbackRouter = require('./routes/feedback');
app.use('/api/feedback', feedbackRouter);

// ─── User Authentication Routes (Sign Up, Sign In, Session) ────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !name.trim() || !email || !email.trim() || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid Gmail / Email address (e.g. name@gmail.com).' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (!/[a-zA-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one letter.' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number.' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one special character (!@#$%^&*...).' });
    }

    const user = await db.createAuthAccount({ name, email: cleanEmail, password });
    const token = db.encrypt(JSON.stringify({ id: user.id, email: user.email, timestamp: Date.now() }));
    return res.json({ success: true, user, token });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !email.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid Gmail / Email address (e.g. name@gmail.com).' });
    }
    const account = await db.findAuthAccountByEmail(cleanEmail);
    if (!account) {
      return res.status(400).json({ error: 'Account not found with this email. Please Sign Up.' });
    }
    const isValid = db.verifyAuthAccountPassword(password, account.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect password. Please try again.' });
    }
    const user = { id: account._id.toString(), name: account.name, email: account.email };
    const token = db.encrypt(JSON.stringify({ id: user.id, email: user.email, timestamp: Date.now() }));
    return res.json({ success: true, user, token });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Authentication failed.' });
  }
});

// ─── 1-Click Google Authentication (Sign Up & Sign In) ───────────────────────
app.get('/api/auth/google-login/url', (req, res) => {
  try {
    const { google } = require('googleapis');
    const redirectUri = process.env.GOOGLE_REDIRECT_URI.replace('/api/auth/google/callback', '/api/auth/google-login/callback');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
      prompt: 'select_account'
    });
    return res.json({ url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/google-login/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('<script>if(window.opener){window.opener.postMessage({ type: "GOOGLE_AUTH_ERROR", error: "No auth code" }, "*"); window.close();}else{window.location.href="https://www.wascheduler.site";}</script>');
  }

  try {
    const { google } = require('googleapis');
    const redirectUri = process.env.GOOGLE_REDIRECT_URI.replace('/api/auth/google/callback', '/api/auth/google-login/callback');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    const name = userInfo.data.name || email.split('@')[0];

    if (!email) {
      throw new Error('Google did not return an email address.');
    }

    let account = await db.findAuthAccountByEmail(email);
    if (!account) {
      // Auto register account from verified Google profile
      const randomPassword = 'GoogleAuth_' + Math.random().toString(36).substring(2, 12) + '!9A';
      await db.createAuthAccount({ name, email, password: randomPassword });
      account = await db.findAuthAccountByEmail(email);
    }

    const user = { id: account._id.toString(), name: account.name, email: account.email };
    const token = db.encrypt(JSON.stringify({ id: user.id, email: user.email, timestamp: Date.now() }));
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.wascheduler.site';
    const redirectTarget = `${frontendUrl}/?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;

    return res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h3 style="color: #059669;">Verified by Google!</h3>
          <p>Logged in as <strong>${email}</strong>.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: ${JSON.stringify(user)}, token: '${token}' }, '*');
              setTimeout(() => window.close(), 1000);
            } else {
              window.location.href = '${redirectTarget}';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    return res.send(`<script>if(window.opener){window.opener.postMessage({ type: "GOOGLE_AUTH_ERROR", error: "${err.message}" }, "*"); setTimeout(() => window.close(), 2000);}else{window.location.href="https://www.wascheduler.site";}</script>`);
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decryptedStr = db.decrypt(token);
    const decrypted = JSON.parse(decryptedStr);
    if (!decrypted || !decrypted.email) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const account = await db.findAuthAccountByEmail(decrypted.email);
    if (!account) {
      return res.status(401).json({ error: 'Account not found' });
    }
    return res.json({
      user: { id: account._id.toString(), name: account.name, email: account.email }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
});

// ─── WhatsApp status ──────────────────────────────────────────────────────────

/**
 * GET /api/status
 * Returns connection state, QR, pairing code, and connected profile info.
 * If no session ID is provided, returns { status: "ok" } (for deployment/health checks).
 */
app.get('/api/status', (req, res) => {
  if (!req.sessionId) {
    return res.json({ status: "ok" });
  }

  // Auto-initialize WhatsApp for this session if it's completely new/untracked
  if (!whatsapp.hasSession(req.sessionId)) {
    console.log(`[Server] Initializing untracked session: ${req.sessionId}`);
    whatsapp.initWhatsApp(req.sessionId).catch((err) => {
      console.error(`[Server] Error initializing session ${req.sessionId}:`, err.message);
    });
  }

  const profile = whatsapp.getConnectedProfile(req.sessionId);

  res.json({
    status:      whatsapp.getStatus(req.sessionId),
    qr:          whatsapp.getQR(req.sessionId),
    pairingCode: whatsapp.getPairingCode(req.sessionId),
    profile: {
      id: req.sessionId,
      phoneNumber: profile.phone,
      name: profile.name,
      phone: profile.phone,
      jid: profile.jid
    },
    isSyncing:   whatsapp.getSyncStatus(req.sessionId),
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
 * PUT /api/user/profile-name
 * Updates user's profile name in MongoDB and WhatsApp memory cache.
 */
app.put('/api/user/profile-name', async (req, res) => {
  const { name } = req.body;
  if (name === undefined || name === null) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  const cleanName = name.trim();

  try {
    const profile = whatsapp.getConnectedProfile(req.sessionId);
    const phoneNumber = profile ? (profile.phone || 'unknown') : 'unknown';

    // Update in MongoDB
    await db.User.updateOne(
      { sessionId: req.sessionId },
      { $set: { phoneNumber, name: cleanName } },
      { upsert: true }
    );

    // Update memory cache
    whatsapp.updateProfileName(req.sessionId, cleanName);

    res.json({ success: true, name: cleanName });
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
app.get('/api/contacts/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);

  try {
    const contacts = await Contact.find({ sessionId: req.sessionId }).lean();
    const decrypted = contacts.map(toVerifiedContact).filter(Boolean);

    const filtered = decrypted.filter(c => {
      const matchesName = c.name && c.name.toLowerCase().includes(q.toLowerCase());
      const matchesPhone = c.phone && c.phone.includes(q.replace(/\D/g, ''));
      return matchesName || matchesPhone;
    });

    res.json(filtered.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/contacts/import
 * Upload the contents of a .vcf/.csv file as a raw body with X-File-Name.
 */
app.post('/api/contacts/import', express.raw({ type: ['text/*', 'application/octet-stream'] }), async (req, res) => {
  try {
    if (whatsapp.getStatus(req.sessionId) !== 'connected') {
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
    const imported = whatsapp.importContactsToCache(req.sessionId, contacts);
    res.json({ imported, parsed: contacts.length });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not import contacts.' });
  }
});

/**
 * GET /api/contacts
 * Returns all contacts for the current user's phone number.
 */
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find({ sessionId: req.sessionId }).lean();
    const decrypted = (contacts || []).map(toVerifiedContact).filter(Boolean);

    decrypted.sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      return aName.localeCompare(bName);
    });

    const payload = {
      all: decrypted,
      personal: decrypted.filter(c => c.type === 'personal'),
      groups: decrypted.filter(c => c.type === 'group')
    };

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/contacts/sync-groups
 * Triggers a one-time manually initiated group sync.
 */
app.post('/api/contacts/sync-groups', async (req, res) => {
  try {
    if (whatsapp.getStatus(req.sessionId) !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp must be connected to sync groups.' });
    }
    await whatsapp.syncGroups(req.sessionId);
    res.json({ success: true, isSyncing: whatsapp.getSyncStatus(req.sessionId) });
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

  try {
    const cachedName = whatsapp.getContactNameSync(req.sessionId, phone);
    if (cachedName) return res.json({ name: cachedName, exists: true, source: 'cache' });

    const verified = await whatsapp.verifyContact(req.sessionId, phone);
    res.json({ name: verified.name, exists: verified.exists, source: verified.exists ? 'whatsapp' : null });
  } catch (err) {
    res.json({ name: null, exists: false });
  }
});

// ─── Messages ─────────────────────────────────────────────────────────────────

app.get('/api/messages', async (req, res) => {
  try {
    res.json(await db.getAllMessages(req.sessionId));
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

  if (whatsapp.getStatus(req.sessionId) !== 'connected') {
    return res.status(400).json({ error: 'WhatsApp is not connected for this session.' });
  }

  const isGroup = phone && phone.endsWith('@g.us');
  if (isGroup) {
    if (!/^\d+@g\.us$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid group JID.' });
    }
  } else {
    if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number (digits only, 7–15 chars).' });
    }
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
    const senderPhone = await getSenderPhoneFromSession(req);
    if (!senderPhone) {
      return res.status(400).json({ error: 'Connected WhatsApp number could not be identified.' });
    }
    const cleanPhone = isGroup ? phone : phone.replace(/\D/g, '');
    let cleanName  = recipientName ? String(recipientName).trim().slice(0, 100) : null;

    if (!cleanName) {
      try {
        cleanName = whatsapp.getContactNameSync(req.sessionId, cleanPhone) || await whatsapp.getContactName(req.sessionId, cleanPhone);
      } catch (e) {
        console.error('[Server] Could not auto-resolve name:', e.message);
      }
    }

    const id = await db.insertMessage(req.sessionId, cleanPhone, message.trim(), schedDate, cleanName);

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
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Invalid ID.' });
  const senderPhone = await getSenderPhoneFromSession(req);
  if (!senderPhone) return res.status(400).json({ error: 'WhatsApp number could not be identified.' });

  try {
    if (req.query.permanent === 'true') {
      const deleted = await db.deleteMessage(req.sessionId, id);
      if (!deleted) {
        return res.status(404).json({ error: 'Message not found.' });
      }
      res.json({ success: true, action: 'deleted' });
    } else {
      const changes = await db.cancelMessage(req.sessionId, id);
      if (!changes) {
        return res.status(400).json({ error: 'Message not found or not pending.' });
      }
      res.json({ success: true, action: 'cancelled' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

async function getSenderPhoneFromSession(req) {
  const profile = whatsapp.getConnectedProfile(req.sessionId);
  if (profile && profile.phone) return profile.phone;
  return await whatsapp.getPhoneFromSession(req.sessionId);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function bootstrap() {
  // Never clear data at startup. SQLite files are the durable store for both
  // contacts and scheduled messages and must survive a restart/reconnect.
  console.log('[Boot] Initializing sessions and persistent databases...');

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

  // Seed initial feedbacks
  const { seedFeedbackData } = require('./seedFeedback');
  seedFeedbackData().catch(err => console.error('[Seed Error] Feedback seeding failed:', err.message));

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

  const availablePort = process.env.PORT ? parseInt(process.env.PORT, 10) : await findAvailablePort(PORT);
  
  const server = app.listen(availablePort, () => {
    console.log(`[Server] Running on http://localhost:${availablePort}`);
    
    if (!process.env.PORT && availablePort !== PORT) {
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
