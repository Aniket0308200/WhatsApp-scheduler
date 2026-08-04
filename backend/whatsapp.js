/**
 * whatsapp.js — Baileys WhatsApp client handler (Multi-Session support)
 *
 * Manages:
 *  - Multiple concurrent WhatsApp client connections mapped to sessionIds
 *  - Socket cleanup to prevent conflicts/reconnect loops
 *  - QR code and pairing code generation per session
 *  - Session-specific contact cache and DB sync
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');

const QRCode = require('qrcode');
const pino   = require('pino');
const path   = require('path');
const fs     = require('fs');
const db     = require('./db');

const SESSIONS_ROOT = path.join(__dirname, '..', 'data', 'session');
if (!fs.existsSync(SESSIONS_ROOT)) {
  fs.mkdirSync(SESSIONS_ROOT, { recursive: true });
}

// In-memory sessions store: sessionId -> SessionObject
const sessions = new Map();

let messageStatusListener = null;
const logger = pino({ level: 'silent' });

// ─── Helper Functions ────────────────────────────────────────────────────────

/** Returns true if a session is currently initialized in memory. */
function hasSession(sessionId) {
  return sessions.has(sessionId);
}

/** Check if session has saved credentials and extract the phone number from them. */
function getPhoneFromSession(sessionId) {
  try {
    const credsPath = path.join(SESSIONS_ROOT, sessionId, 'creds.json');
    if (fs.existsSync(credsPath)) {
      const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
      if (creds?.me?.id) {
        return creds.me.id.split('@')[0].split(':')[0];
      }
    }
  } catch (_) {}
  return null;
}

function getContactsFilePath(phoneOrSessionId) {
  return path.join(__dirname, '..', 'data', `contacts_${phoneOrSessionId}.json`);
}

function loadContactCacheForUser(phone) {
  try {
    const file = getContactsFilePath(phone);
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
  } catch (_) {}
  return {};
}

function persistContactCacheForUser(phone, cache) {
  try {
    const file = getContactsFilePath(phone);
    fs.writeFileSync(file, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error(`[WA] [${phone}] Could not persist contacts:`, err.message);
  }
}

function migrateOldContacts(phone) {
  const oldContactsFile = path.join(__dirname, '..', 'data', 'contacts.json');
  const userContactsFile = getContactsFilePath(phone);
  if (fs.existsSync(oldContactsFile) && !fs.existsSync(userContactsFile)) {
    console.log(`[WA] Migrating old global contacts.json to user-specific contacts_${phone}.json`);
    try {
      fs.renameSync(oldContactsFile, userContactsFile);
    } catch (e) {
      console.error('[WA] Error migrating contacts file:', e.message);
    }
  }
}

function cacheContacts(phone, cache, contacts) {
  const normalized = [];
  let changed = 0;
  for (const c of contacts || []) {
    if (!c?.id || !c.id.endsWith('@s.whatsapp.net')) continue;
    const name = c.notify || c.name || c.verifiedName || c.pushName;
    const phonePart = c.id.split('@')[0].split(':')[0];
    normalized.push({ phone: phonePart, jid: c.id, name: name || '', source: 'whatsapp' });
    if (name && cache[c.id] !== name) {
      cache[c.id] = name;
      changed++;
    }
  }
  if (changed) {
    persistContactCacheForUser(phone, cache);
    console.log(`[WA] [${phone}] Contacts cache updated: ${Object.keys(cache).length} saved.`);
  }
  if (normalized.length) {
    db.upsertContacts(phone, normalized).catch((err) => console.error(`[WA] [${phone}] Contact DB sync error:`, err.message));
  }
}

function processIncomingChats(phone, cache, chats) {
  const normalized = [];
  let changed = 0;
  for (const chat of chats || []) {
    if (!chat?.id) continue;
    const isUser = chat.id.endsWith('@s.whatsapp.net');
    const isGroup = chat.id.endsWith('@g.us');
    if (!isUser && !isGroup) continue;

    const name = chat.name || chat.notify || chat.verifiedName || chat.pushName || '';
    const phonePart = chat.id.split('@')[0].split(':')[0];

    normalized.push({
      phone: phonePart,
      jid: chat.id,
      name: name ? name.trim() : '',
      source: isGroup ? 'group_sync' : 'chat_sync'
    });

    if (name) {
      const trimmed = name.trim();
      if (cache[chat.id] !== trimmed) {
        cache[chat.id] = trimmed;
        changed++;
      }
    }
  }
  if (changed) {
    persistContactCacheForUser(phone, cache);
    console.log(`[WA] [${phone}] Contacts cache updated from chats/groups: ${Object.keys(cache).length} saved.`);
  }
  if (normalized.length) {
    db.upsertContacts(phone, normalized).catch((err) => console.error(`[WA] [${phone}] Contact DB sync error (chats/groups):`, err.message));
  }
}

function cacheMessages(phone, cache, messages) {
  const contacts = [];
  for (const message of messages || []) {
    if (message?.key?.fromMe || !message?.pushName) continue;
    const jid = message.key.participant || message.key.remoteJid;
    if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;
    contacts.push({ id: jid, pushName: message.pushName });
  }
  cacheContacts(phone, cache, contacts);
}

async function hydrateContactCacheForUser(phone, cache) {
  const saved = await db.getAllContacts(phone);
  if (saved.length === 0 && Object.keys(cache).length > 0) {
    console.log(`[WA] [${phone}] Repopulating SQLite contacts table from JSON cache...`);
    const normalized = Object.entries(cache).map(([jid, name]) => {
      const phonePart = jid.split('@')[0].split(':')[0];
      return { phone: phonePart, jid, name, source: 'whatsapp' };
    });
    await db.upsertContacts(phone, normalized);
  } else {
    for (const contact of saved) {
      const jid = contact.jid || `${contact.phone}@s.whatsapp.net`;
      cache[jid] = contact.name;
    }
  }
  if (saved.length) console.log(`[WA] [${phone}] Restored ${saved.length} contacts from SQLite.`);
}

async function extractContactsFromChats(sessionId, phone) {
  const session = sessions.get(sessionId);
  if (!session || !session.sock) return;

  try {
    console.log(`[WA] [${sessionId}] Extracting contacts from chat history...`);
    
    // Try to get recent chats for contact extraction
    const chats = await session.sock.getChats().catch(() => []);
    const contacts = [];
    
    for (const chat of chats.slice(0, 50)) { // Limit to recent 50 chats
      if (chat.id && chat.id.endsWith('@s.whatsapp.net')) {
        const phonePart = chat.id.split('@')[0].split(':')[0];
        const name = chat.name || chat.notify || chat.pushName;
        if (name && phonePart) {
          contacts.push({
            phone: phonePart,
            jid: chat.id,
            name: name.trim(),
            source: 'chat_history'
          });
          session.contactCache[chat.id] = name.trim();
        }
      }
    }

    if (contacts.length > 0) {
      await db.upsertContacts(phone, contacts);
      persistContactCacheForUser(phone, session.contactCache);
      console.log(`[WA] [${sessionId}] Extracted ${contacts.length} contacts from chat history`);
    }
  } catch (err) {
    console.log(`[WA] [${sessionId}] Chat history extraction error:`, err.message);
  }
}

// Active contact resolver for immediate name lookup
async function resolveContactLive(sessionId, phone) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'connected' || !session.sock) {
    return { exists: false, name: null, jid: null };
  }

  const cleaned = phone.replace(/\D/g, '');
  const jid = `${cleaned}@s.whatsapp.net`;

  try {
    // 1. Check cache first
    if (session.contactCache[jid]) {
      return { exists: true, name: session.contactCache[jid], jid, source: 'cache' };
    }

    // 2. Check SQLite DB next
    const senderPhone = session.connectedProfile.phone || getPhoneFromSession(sessionId);
    if (senderPhone) {
      const dbContact = await db.getContactByPhone(senderPhone, cleaned);
      if (dbContact && dbContact.name) {
        session.contactCache[jid] = dbContact.name;
        return { exists: true, name: dbContact.name, jid: dbContact.jid || jid, source: 'database' };
      }
    }

    // 3. Active WhatsApp lookup
    const results = await session.sock.onWhatsApp(jid).catch(() => []);
    const result = results?.find(r => r.exists && r.jid);
    if (!result) {
      return { exists: false, name: null, jid: null };
    }

    let name = null;

    // Try multiple methods to get the name
    try {
      // Method 1: Get business profile
      const businessProfile = await session.sock.getBusinessProfile(jid).catch(() => null);
      if (businessProfile) {
        name = businessProfile.name || businessProfile.verifiedName || businessProfile.description || null;
      }
    } catch {}

    // Method 2: Check if it's in recent presence updates
    if (!name) {
      try {
        const presence = await session.sock.presenceSubscribe(jid).catch(() => null);
        if (presence?.name) {
          name = presence.name;
        }
      } catch {}
    }

    // Method 3: Use result pushName if available
    if (!name && result.pushName) {
      name = result.pushName;
    }

    // Cache the result (even if name is empty, record the verification)
    if (senderPhone) {
      session.contactCache[jid] = name ? name.trim() : '';
      await db.upsertContacts(senderPhone, [{
        phone: cleaned,
        jid: result.jid || jid,
        name: name ? name.trim() : '',
        source: 'live_lookup'
      }]);
      persistContactCacheForUser(senderPhone, session.contactCache);
    }

    return { exists: true, name: name ? name.trim() : null, jid: result.jid || jid, source: 'live_lookup' };
  } catch (err) {
    console.error(`[WA] [${sessionId}] Live contact resolve error for ${cleaned}:`, err.message);
    return { exists: false, name: null, jid: null };
  }
}

// ─── Initialise Session Socket ────────────────────────────────────────────────

async function initWhatsApp(sessionId) {
  if (!sessionId) {
    console.error('[WA] Cannot initWhatsApp: sessionId is undefined');
    return null;
  }

  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      sessionId,
      sock: null,
      qrBase64: null,
      pairingCode: null,
      reconnectTimer: null,
      status: 'disconnected',
      connectedProfile: { name: null, phone: null, jid: null },
      contactCache: {}
    };
    sessions.set(sessionId, session);
  }

  // Clear any existing reconnect timer
  if (session.reconnectTimer) {
    clearTimeout(session.reconnectTimer);
    session.reconnectTimer = null;
  }

  // CRITICAL: Close previous socket if it exists to prevent socket leaks and conflicts
  if (session.sock) {
    console.log(`[WA] [${sessionId}] Cleaning up existing socket before re-initialization.`);
    try {
      session.sock.ev.removeAllListeners();
      session.sock.end();
    } catch (e) {
      console.error(`[WA] [${sessionId}] Error ending old socket:`, e.message);
    }
    session.sock = null;
  }

  session.status = 'connecting';
  session.qrBase64 = null;
  session.pairingCode = null;

  // Resolve phone number if already logged in previously
  const savedPhone = getPhoneFromSession(sessionId);
  if (savedPhone) {
    migrateOldContacts(savedPhone);
    session.connectedProfile.phone = savedPhone;
    session.contactCache = loadContactCacheForUser(savedPhone);
    await hydrateContactCacheForUser(savedPhone, session.contactCache);
  } else {
    session.contactCache = {};
  }

  const sessionDir = path.join(SESSIONS_ROOT, sessionId);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version }          = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys:  makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal:            false,
    browser:                      ['Ubuntu', 'Chrome', '20.0.04'],
    syncFullHistory:              true,
    generateHighQualityLinkPreview: false,
    keepAliveIntervalMs:          60_000,
    retryRequestDelayMs:          5_000,
    connectTimeoutMs:             60_000,
    defaultQueryTimeoutMs:        0,
  });

  session.sock = sock;

  // ── Persist credentials ───────────────────────────────────────────────────
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.update', (updates) => {
    for (const { key, update } of updates) {
      if (!key?.fromMe || !key.id || typeof update?.status !== 'number') continue;
      const receiptStatus = update.status >= 4 ? 'read' : update.status === 3 ? 'delivered' : null;
      if (receiptStatus && messageStatusListener) {
        const currentPhone = session.connectedProfile.phone || getPhoneFromSession(sessionId);
        if (currentPhone) {
          Promise.resolve(messageStatusListener(currentPhone, key.id, receiptStatus))
            .catch((err) => console.error(`[WA] [${sessionId}] Receipt persistence error:`, err.message));
        }
      }
    }
  });

  // ── Connection events ─────────────────────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // New QR code emitted
    if (qr) {
      try {
        session.qrBase64 = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
        session.status   = 'qr_ready';
        console.log(`[WA] [${sessionId}] QR code generated — waiting for scan.`);
      } catch (err) {
        console.error(`[WA] [${sessionId}] QR generation error:`, err.message);
      }
    }

    if (connection === 'open') {
      session.status   = 'connected';
      session.qrBase64 = null;
      session.pairingCode = null;

      try {
        await updateConnectedProfile(sessionId);
        const currentPhone = session.connectedProfile.phone;
        console.log(`[WA] [${sessionId}] Connected as: ${session.connectedProfile.name || session.connectedProfile.phone} (+${currentPhone})`);

        if (currentPhone) {
          migrateOldContacts(currentPhone);
          // Reload contact cache for the user
          session.contactCache = loadContactCacheForUser(currentPhone);
          await hydrateContactCacheForUser(currentPhone, session.contactCache);
          
          // Deep chat history parsing for personal contacts
          await extractContactsFromChats(sessionId, currentPhone);
        }
      } catch (err) {
        console.error(`[WA] [${sessionId}] Could not read connected profile:`, err.message);
      }
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log(`[WA] [${sessionId}] Connection closed. Code: ${code}`);

      // Reset profile on disconnect
      session.connectedProfile = { name: null, phone: null, jid: null };

      const { loggedOut, connectionReplaced, multideviceMismatch, timedOut } = DisconnectReason;

      if (code === loggedOut) {
        console.log(`[WA] [${sessionId}] Logged out — clearing session.`);
        clearSession(sessionId);
        session.status = 'disconnected';
        session.reconnectTimer = setTimeout(() => initWhatsApp(sessionId), 3_000);
      } else if (code === connectionReplaced || code === multideviceMismatch) {
        console.log(`[WA] [${sessionId}] Session replaced/mismatch — clearing session.`);
        clearSession(sessionId);
        session.status = 'disconnected';
        session.reconnectTimer = setTimeout(() => initWhatsApp(sessionId), 3_000);
      } else if (code === timedOut || code === 408) {
        // Handle timeout more gracefully - don't reconnect too aggressively
        session.status = 'disconnected';
        console.log(`[WA] [${sessionId}] Connection timeout — waiting longer before retry...`);
        session.reconnectTimer = setTimeout(() => initWhatsApp(sessionId), 15_000); // Wait 15 seconds instead of 5
      } else {
        session.status = 'disconnected';
        console.log(`[WA] [${sessionId}] Transient disconnect — reconnecting in 5 s…`);
        session.reconnectTimer = setTimeout(() => initWhatsApp(sessionId), 5_000);
      }
    }
  });

  // Helper to get phone number from session/sock in event listeners to prevent I/O race conditions
  const getPhone = () => {
    return session.connectedProfile.phone || (sock.authState?.creds?.me?.id ? sock.authState.creds.me.id.split('@')[0].split(':')[0] : null) || getPhoneFromSession(sessionId);
  };

  // ── Contacts update — populate name cache ────────────────────────────────
  sock.ev.on('contacts.update', (contacts) => {
    const currentPhone = getPhone();
    if (currentPhone) cacheContacts(currentPhone, session.contactCache, contacts);
  });

  sock.ev.on('contacts.upsert', (contacts) => {
    const currentPhone = getPhone();
    if (currentPhone) cacheContacts(currentPhone, session.contactCache, contacts);
  });

  sock.ev.on('chats.upsert', (chats) => {
    const currentPhone = getPhone();
    if (currentPhone) processIncomingChats(currentPhone, session.contactCache, chats);
  });

  sock.ev.on('messaging-history.set', ({ chats, contacts, messages }) => {
    const currentPhone = getPhone();
    if (currentPhone) {
      if (chats) processIncomingChats(currentPhone, session.contactCache, chats);
      if (contacts) cacheContacts(currentPhone, session.contactCache, contacts);
      if (messages) cacheMessages(currentPhone, session.contactCache, messages);
      console.log(`[WA] [${sessionId}] Initial history sync received: ${(chats || []).length} chats, ${(contacts || []).length} contacts, ${(messages || []).length} messages.`);
    }
  });

  sock.ev.on('messages.upsert', ({ messages }) => {
    const currentPhone = getPhone();
    if (currentPhone) cacheMessages(currentPhone, session.contactCache, messages);
  });

  return sock;
}

// ─── Bootstrap Saved Sessions ─────────────────────────────────────────────────

async function bootstrapSessions() {
  if (!fs.existsSync(SESSIONS_ROOT)) {
    fs.mkdirSync(SESSIONS_ROOT, { recursive: true });
    return;
  }
  const entries = fs.readdirSync(SESSIONS_ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sessionId = entry.name;
      console.log(`[WA] Bootstrapping saved session: ${sessionId}`);
      initWhatsApp(sessionId).catch((err) => {
        console.error(`[WA] Error bootstrapping session ${sessionId}:`, err.message);
      });
    }
  }
}

// ─── Pairing code ─────────────────────────────────────────────────────────────

async function requestPairingCode(sessionId, phoneNumber) {
  console.log(`[WA] [${sessionId}] Stopping existing socket and clearing old credentials before requesting pairing code`);
  
  let session = sessions.get(sessionId);
  if (session) {
    if (session.sock) {
      try {
        session.sock.ev.removeAllListeners();
        session.sock.end();
      } catch (e) {
        console.error(`[WA] [${sessionId}] Error ending old socket:`, e.message);
      }
      session.sock = null;
    }
    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }
  }

  clearSession(sessionId);

  await initWhatsApp(sessionId);
  await new Promise((r) => setTimeout(r, 3_000));
  session = sessions.get(sessionId);

  if (session.status === 'connected') throw new Error('Already connected to WhatsApp.');

  const cleaned = phoneNumber.replace(/\D/g, '');
  if (!cleaned) throw new Error('Invalid phone number.');

  try {
    const code  = await session.sock.requestPairingCode(cleaned);
    session.pairingCode = code;
    session.status      = 'qr_ready';
    console.log(`[WA] [${sessionId}] Pairing code for ${cleaned}: ${code}`);
    return code;
  } catch (err) {
    console.error(`[WA] [${sessionId}] Pairing code error:`, err.message);
    throw err;
  }
}

// ─── Fetch contact name ───────────────────────────────────────────────────────

async function getContactName(sessionId, phone) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'connected' || !session.sock) return null;

  const cleaned = phone.replace(/\D/g, '');
  const jid     = `${cleaned}@s.whatsapp.net`;

  if (session.contactCache[jid]) return session.contactCache[jid];

  try {
    const [result] = await session.sock.onWhatsApp(jid);
    if (result && result.exists) {
      const profile = await session.sock.getBusinessProfile(jid).catch(() => null);
      if (profile?.description) {
        session.contactCache[jid] = profile.description;
        return profile.description;
      }
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

function getContactNameSync(sessionId, phone) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const jid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
  return session.contactCache[jid] || null;
}

function getAllContacts(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return [];
  return Object.entries(session.contactCache)
    .filter(([jid]) => jid.endsWith('@s.whatsapp.net'))
    .map(([jid, name]) => {
      const phone = jid.split('@')[0].split(':')[0];
      return { jid, phone, name };
    });
}

// ─── Send message ─────────────────────────────────────────────────────────────

async function sendMessage(sessionId, phone, text) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'connected' || !session.sock) {
    throw new Error('WhatsApp is not connected for this session.');
  }

  const cleaned = phone.replace(/\D/g, '');
  const jid     = await resolveRecipientJid(sessionId, cleaned);

  try {
    const result = await session.sock.sendMessage(jid, { text });
    if (!result?.key?.id) throw new Error('WhatsApp did not return a message id.');
    console.log(`[WA] [${sessionId}] Message submitted to ${jid}; id=${result.key.id}`);
    return { id: result.key.id, jid };
  } catch (err) {
    console.error(`[WA] [${sessionId}] ✗ Failed to send to ${jid}: ${err.message}`);
    throw err;
  }
}

async function verifyContact(sessionId, phone) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'connected' || !session.sock) return { exists: false, name: null, jid: null };
  const cleaned = phone.replace(/\D/g, '');
  const cached = getContactNameSync(sessionId, cleaned);
  if (cached) return { exists: true, name: cached, jid: `${cleaned}@s.whatsapp.net` };

  const results = await session.sock.onWhatsApp(cleaned);
  const result = results?.find((entry) => entry?.exists && entry?.jid);
  if (!result) return { exists: false, name: null, jid: null };

  const name = result.pushName || result.notify || result.name || null;
  const currentPhone = session.connectedProfile.phone || getPhoneFromSession(sessionId);
  if (currentPhone) {
    cacheContacts(currentPhone, session.contactCache, [{ id: result.jid, name: name || '' }]);
  }
  return { exists: true, name, jid: result.jid };
}

async function resolveRecipientJid(sessionId, phone) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'connected' || !session.sock) throw new Error('WhatsApp is not connected.');
  const cleaned = phone.replace(/\D/g, '');
  const results = await session.sock.onWhatsApp(cleaned);
  const recipient = results?.find((entry) => entry?.exists && entry?.jid);
  if (!recipient) throw new Error(`The number +${cleaned} is not registered on WhatsApp.`);
  return recipient.jid;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

async function logout(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    if (session.sock) {
      try { await session.sock.logout(); } catch (_) {}
      try {
        session.sock.ev.removeAllListeners();
        session.sock.end();
      } catch (_) {}
    }
    clearSession(sessionId);
    session.status = 'disconnected';
    session.sock   = null;
    session.connectedProfile = { name: null, phone: null, jid: null };
    session.contactCache = {};
    sessions.delete(sessionId);
  }
}

function clearSession(sessionId) {
  try {
    const sessionDir = path.join(SESSIONS_ROOT, sessionId);
    fs.rmSync(sessionDir, { recursive: true, force: true });
    fs.mkdirSync(sessionDir, { recursive: true });
  } catch (err) {
    console.error(`[WA] [${sessionId}] clearSession error:`, err.message);
  }
}

// ─── Getters / State ──────────────────────────────────────────────────────────

function getStatus(sessionId) {
  const session = sessions.get(sessionId);
  return session ? session.status : 'disconnected';
}

function getQR(sessionId) {
  const session = sessions.get(sessionId);
  return session ? session.qrBase64 : null;
}

function getPairingCode(sessionId) {
  const session = sessions.get(sessionId);
  return session ? session.pairingCode : null;
}

async function updateConnectedProfile(sessionId) {
  const session = sessions.get(sessionId);
  if (session && session.status === 'connected' && session.sock) {
    const user = session.sock.user || session.sock.authState?.creds?.me;
    if (user) {
      const rawJid    = user.id || '';
      const phonePart = rawJid.split('@')[0].split(':')[0];
      const selfJid   = `${phonePart}@s.whatsapp.net`;
      
      // Enhanced profile name fallback chain
      let displayName = user.name || user.notify || user.verifiedName || user.pushName;
      
      if (!displayName && session.sock.authState?.creds?.me?.name) {
        displayName = session.sock.authState.creds.me.name;
      }
      
      // Try cached contacts
      if (!displayName) {
        displayName = session.contactCache[selfJid] || session.contactCache[rawJid];
      }
      
      // Try to fetch self profile if still no name
      if (!displayName && session.sock) {
        try {
          const profile = await session.sock.getBusinessProfile(selfJid).catch(() => null);
          if (profile?.description) {
            displayName = profile.description;
          }
        } catch (err) {
          console.log(`[WA] [${sessionId}] Could not fetch self profile:`, err.message);
        }
      }

      session.connectedProfile = {
        name:  displayName || `User +${phonePart}`,
        phone: phonePart,
        jid:   rawJid,
      };
      
      console.log(`[WA] [${sessionId}] Profile updated: ${session.connectedProfile.name} (+${phonePart})`);
    }
  }
}

function getConnectedProfile(sessionId) {
  updateConnectedProfile(sessionId);
  const session = sessions.get(sessionId);
  return session ? session.connectedProfile : { name: null, phone: null, jid: null };
}

function getSessionByPhone(phone) {
  const cleaned = String(phone).replace(/\D/g, '');
  for (const session of sessions.values()) {
    const currentPhone = session.connectedProfile.phone || getPhoneFromSession(session.sessionId);
    if (currentPhone && currentPhone.replace(/\D/g, '') === cleaned) {
      return session;
    }
  }
  return null;
}

function getAllActiveSessions() {
  return Array.from(sessions.values()).map(session => ({
    sessionId: session.sessionId,
    status: session.status,
    phone: session.connectedProfile.phone,
    name: session.connectedProfile.name
  }));
}

function setMessageStatusListener(listener) { messageStatusListener = listener; }

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  hasSession,
  initWhatsApp,
  bootstrapSessions,
  sendMessage,
  resolveRecipientJid,
  setMessageStatusListener,
  requestPairingCode,
  getContactName,
  verifyContact,
  getContactNameSync,
  getAllContacts,
  resolveContactLive,
  getAllActiveSessions,
  logout,
  getStatus,
  getQR,
  getPairingCode,
  getConnectedProfile,
  getSessionByPhone,
  getPhoneFromSession,
};
