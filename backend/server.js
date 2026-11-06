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

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'Accept', 'Origin']
}));
app.options('*', cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

function toVerifiedContact(document) {
  const jid = document.jid;
  const phone = db.decrypt(document.encryptedNumberOrJid);
  let name = db.decrypt(document.encryptedName);
  if (!name && phone) {
    name = `Contact +${phone}`;
  }
  const isGroup = document.type === 'group';
  if (!jid || !phone) return null;
  if (!isGroup && document.source !== 'google_contacts' && name && !db.isValidPersonalContactName(name, phone)) return null;
  return {
    phone,
    jid,
    name: name || phone,
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

// ─── Server-side keep-alive: ping self every 5 minutes to prevent Render sleep ───
// Render.com free tier spins down services after 15 minutes of no inbound HTTP traffic.
// Render injects RENDER=true and RENDER_EXTERNAL_URL automatically.
const isRenderOrProd = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER) || Boolean(process.env.RENDER_EXTERNAL_URL);
if (isRenderOrProd) {
  const selfPingUrl = process.env.SELF_PING_URL || 
    (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api/health` : 'https://whatsapp-scheduler-backend-ubkz.onrender.com/api/health');
  
  setInterval(async () => {
    try {
      const http = require('https');
      http.get(selfPingUrl, (res) => {
        console.log(`[KeepAlive] Self-ping OK: ${res.statusCode}`);
      }).on('error', (err) => {
        console.warn(`[KeepAlive] Self-ping failed: ${err.message}`);
      });
    } catch (err) {
      console.warn('[KeepAlive] Self-ping error:', err.message);
    }
  }, 5 * 60 * 1000); // every 5 minutes (well under Render 15-min idle timeout)
  console.log(`[KeepAlive] Self-ping scheduler active (every 5 min) for: ${selfPingUrl}`);
}

// ─── Session ID Validation Middleware ─────────────────────────────────────────
app.use((req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId || req.query.state;
  if (!sessionId && req.path.startsWith('/api')) {
    if (
      req.path === '/api/status' ||
      req.path === '/api/health' ||
      req.path.startsWith('/api/auth') ||
      req.path.startsWith('/api/admin') ||
      req.path.startsWith('/api/subscription') ||
      req.path.startsWith('/api/contact')
    ) {
      return next();
    }
    return res.status(400).json({ error: 'X-Session-ID header is required.' });
  }
  req.sessionId = sessionId; 
  next();
});

// ─── Super Admin Routes (/api/admin) ─────────────────────────────────────────
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

// ─── Subscription & Payment Verification Routes ───────────────────────────────
const subscriptionRouter = require('./routes/subscription');
app.use('/api/subscription', subscriptionRouter);

// ─── Google OAuth & Contacts Sync Routes ──────────────────────────────────────
const googleContactsRouter = require('./routes/googleContacts');
app.use('/api/auth/google', googleContactsRouter);

// ─── Feedback & Support Routes ────────────────────────────────────────────────
const feedbackRouter = require('./routes/feedback');
app.use('/api/feedback', feedbackRouter);

// ─── Contact Us & Helpdesk Routes ────────────────────────────────────────────
const contactRouter = require('./routes/contact');
app.use('/api/contact', contactRouter);

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
    if (account.isLocked) {
      return res.status(403).json({ error: 'Your account has been locked by Administrator. Please contact support.' });
    }
    // Update login timestamp & presence
    await db.AuthAccount.updateOne(
      { _id: account._id },
      { $set: { lastLoginAt: new Date(), lastSeenAt: new Date() } }
    );
    const user = {
      id: account._id.toString(),
      name: account.name,
      email: account.email,
      plan: account.plan || 'free',
      planStatus: account.planStatus || (account.plan || 'free')
    };
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
    if (account.isLocked) {
      return res.status(403).json({ error: 'Your account has been locked by Administrator.' });
    }
    // Update live presence
    await db.AuthAccount.updateOne({ _id: account._id }, { $set: { lastSeenAt: new Date() } });

    return res.json({
      user: {
        id: account._id.toString(),
        name: account.name,
        email: account.email,
        plan: account.plan || 'free',
        planStatus: account.planStatus || (account.plan || 'free')
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
});

// ─── Live Presence Heartbeat ─────────────────────────────────────────────────
app.post('/api/auth/heartbeat', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decryptedStr = db.decrypt(token);
      const decrypted = JSON.parse(decryptedStr);
      if (decrypted && decrypted.email) {
        await db.updateUserHeartbeat(decrypted.email);
        return res.json({ success: true, timestamp: Date.now() });
      }
    }
    // If WhatsApp session presence
    const sessionId = req.headers['x-session-id'] || req.sessionId;
    if (sessionId) {
      await db.User.updateOne({ sessionId }, { $set: { lastSeenAt: new Date() } });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false });
  }
});

// ─── User Plan & Monthly Message Quota ────────────────────────────────────────
app.get('/api/user/quota', async (req, res) => {
  try {
    const quota = await db.getUserMonthlyQuota(req.sessionId);
    res.json(quota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── WhatsApp status ──────────────────────────────────────────────────────────

const initializingSessions = new Set();
// Tracks last time a session was auto-initialized from status polling
// to prevent re-init storm when frontend polls every 4 seconds.
const lastAutoInitTime = new Map();
const AUTO_INIT_THROTTLE_MS = 15_000; // minimum 15 seconds between auto-inits

/**
 * GET /api/status
 * Returns connection state, QR, pairing code, and connected profile info.
 * If no session ID is provided, returns { status: "ok" } (for deployment/health checks).
 */
app.get('/api/status', async (req, res) => {
  if (!req.sessionId) {
    return res.json({ status: "ok" });
  }

  // If session is untracked in memory:
  // Auto-restore ONLY if this session has saved, registered credentials in MongoDB.
  // Anonymous visitors or unauthenticated sessions are NEVER auto-initialized here,
  // preventing phantom Baileys socket floods and resource exhaustion.
  if (!whatsapp.hasSession(req.sessionId)) {
    const hasCreds = await whatsapp.hasSavedCredentials(req.sessionId);
    if (hasCreds) {
      const now = Date.now();
      const lastInit = lastAutoInitTime.get(req.sessionId) || 0;
      if (now - lastInit > AUTO_INIT_THROTTLE_MS && !initializingSessions.has(req.sessionId)) {
        initializingSessions.add(req.sessionId);
        lastAutoInitTime.set(req.sessionId, now);
        console.log(`[Server] Restoring saved authenticated session from DB: ${req.sessionId}`);
        whatsapp.initWhatsApp(req.sessionId)
          .catch((err) => {
            console.error(`[Server] Error restoring session ${req.sessionId}:`, err.message);
          })
          .finally(() => {
            initializingSessions.delete(req.sessionId);
          });
      }
    }
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
 * POST /api/reconnect
 * Force-reinitializes WhatsApp session to generate a fresh QR code immediately.
 */
app.post('/api/reconnect', async (req, res) => {
  if (!req.sessionId) {
    return res.status(400).json({ error: 'X-Session-ID header is required.' });
  }

  console.log(`[Server] Force-reconnecting session on user request: ${req.sessionId}`);
  try {
    await whatsapp.initWhatsApp(req.sessionId);
    res.json({
      status: whatsapp.getStatus(req.sessionId),
      qr: whatsapp.getQR(req.sessionId),
      pairingCode: whatsapp.getPairingCode(req.sessionId)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  const { phone, message, scheduledAt, recipientName, mediaType, mediaData, mediaName, mediaList, pollData, mentions } = req.body;

  const status = whatsapp.getStatus(req.sessionId);
  const profile = whatsapp.getConnectedProfile(req.sessionId);
  const isLinked = Boolean(profile?.phone);
  if (status !== 'connected' && !(status === 'connecting' && isLinked)) {
    return res.status(400).json({ error: 'WhatsApp is not connected for this session. Please connect your WhatsApp first.' });
  }

  // Check if session or user account is locked by Administrator
  const userDoc = await db.User.findOne({ sessionId: req.sessionId }).lean();
  if (userDoc?.isLocked) {
    return res.status(403).json({ error: 'Your account has been locked by Administrator. Message scheduling is disabled.' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decrypted = JSON.parse(db.decrypt(authHeader.split(' ')[1]));
      if (decrypted?.email) {
        const acc = await db.findAuthAccountByEmail(decrypted.email);
        if (acc?.isLocked) {
          return res.status(403).json({ error: 'Your account has been locked by Administrator. Message scheduling is disabled.' });
        }
      }
    } catch (e) {}
  }

  let targetPhone = phone;
  const isStatus = phone === 'status@broadcast' || phone === 'status' || phone === '__status__';
  const isGroup = phone && phone.endsWith('@g.us');

  if (isStatus) {
    targetPhone = 'status@broadcast';
  } else if (isGroup) {
    if (!/^\d+@g\.us$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid group JID.' });
    }
  } else {
    if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number (digits only, 7–15 chars).' });
    }
  }

  // If there's no media and no poll, message cannot be empty. If media or poll is attached, caption (message) is optional.
  const hasMultipleMedia = Array.isArray(mediaList) && mediaList.length > 0;
  const hasSingleMedia = Boolean(mediaType && mediaData);
  const hasMedia = hasMultipleMedia || hasSingleMedia;
  const hasPoll = Boolean(pollData && pollData.question && Array.isArray(pollData.options) && pollData.options.filter(Boolean).length >= 2);
  if (!hasMedia && !hasPoll && (!message || !message.trim())) {
    return res.status(400).json({ error: 'Message or Poll cannot be empty.' });
  }

  if (!scheduledAt || isNaN(Date.parse(scheduledAt))) {
    return res.status(400).json({ error: 'Invalid scheduledAt datetime.' });
  }

  const schedDate = new Date(scheduledAt);
  if (schedDate <= new Date()) {
    return res.status(400).json({ error: 'Scheduled time must be in the future.' });
  }

  try {
    // ─── Enforce Monthly Message Limit (50 for Free, 250 for Starter, 1000 for Pro) ───
    const quota = await db.getUserMonthlyQuota(req.sessionId);
    const isPro = quota && (quota.plan === 'pro' || quota.isUnlimited);
    if (!isPro && quota && typeof quota.remaining === 'number' && quota.remaining <= 0) {
      return res.status(403).json({
        error: `Monthly quota reached (${quota.monthlyLimit}/${quota.monthlyLimit} scheduled messages used for ${quota.monthName}). Your quota resets on ${quota.resetsOnFormatted}. Upgrade your plan for higher limits.`,
        quotaExceeded: true,
        quota
      });
    }

    // Media & Sticker is an exclusive feature for Starter & Pro plans (Status stories exempt)
    if (hasMedia && !isStatus) {
      const userPlan = (quota?.plan || 'free').toLowerCase();
      if (userPlan === 'free') {
        return res.status(403).json({
          error: 'Image, Video & Sticker scheduling is an exclusive Starter and Pro feature. Please upgrade your plan to attach media.',
          planUpgradeRequired: true
        });
      }
    }

    const senderPhone = await getSenderPhoneFromSession(req);
    if (!senderPhone) {
      return res.status(400).json({ error: 'Connected WhatsApp number could not be identified.' });
    }
    const cleanPhone = isStatus ? 'status@broadcast' : (isGroup ? targetPhone : targetPhone.replace(/\D/g, ''));
    let cleanName  = recipientName ? String(recipientName).trim().slice(0, 100) : (isStatus ? 'WhatsApp Status (Story)' : null);

    if (!cleanName) {
      try {
        cleanName = whatsapp.getContactNameSync(req.sessionId, cleanPhone) || await whatsapp.getContactName(req.sessionId, cleanPhone);
      } catch (e) {
        console.error('[Server] Could not auto-resolve name:', e.message);
      }
    }

    // Prepare standardized mediaList and primary media metadata
    let finalMediaList = [];
    let finalMediaType = mediaType || null;
    let finalMediaData = mediaData || null;
    let finalMediaName = mediaName || null;

    if (hasMultipleMedia) {
      finalMediaList = mediaList;
      if (mediaList.length === 1) {
        finalMediaType = mediaList[0].type;
        finalMediaData = mediaList[0].data;
        finalMediaName = mediaList[0].name;
      } else {
        finalMediaType = 'multiple';
        finalMediaData = null;
        finalMediaName = `${mediaList.length} items`;
      }
    } else if (hasSingleMedia) {
      finalMediaList = [{
        type: mediaType,
        data: mediaData,
        name: mediaName || `${mediaType}_file`
      }];
    } else if (hasPoll) {
      finalMediaType = 'poll';
    }

    const id = await db.insertMessage(
      req.sessionId,
      cleanPhone,
      message ? message.trim() : '',
      schedDate,
      cleanName,
      finalMediaType,
      finalMediaData,
      finalMediaName,
      finalMediaList,
      hasPoll ? pollData : null,
      Array.isArray(mentions) ? mentions : []
    );

    res.status(201).json({
      id,
      phone:          cleanPhone,
      recipient_name: cleanName,
      message:        message ? message.trim() : '',
      mediaType:      finalMediaType,
      mediaName:      finalMediaName,
      mediaList:      finalMediaList,
      pollData:       hasPoll ? pollData : null,
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

  // Sessions are loaded on demand (when user accesses site or when scheduler dispatches messages)
  // to keep server RAM strictly below 150MB and prevent Render 512MB memory limit restarts.
  console.log('[Boot] Sockets configured for on-demand initialization (zero startup RAM spike).');

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
