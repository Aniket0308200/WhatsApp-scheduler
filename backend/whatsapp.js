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
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  BufferJSON,
  initAuthCreds,
  proto,
} = require('@whiskeysockets/baileys');

const QRCode = require('qrcode');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { Contact } = db;

const SESSIONS_ROOT = path.join(__dirname, '..', 'data', 'session');
if (!fs.existsSync(SESSIONS_ROOT)) {
  fs.mkdirSync(SESSIONS_ROOT, { recursive: true });
}

// In-memory sessions store: sessionId -> SessionObject
const sessions = new Map();

// Temporary toggle flag to disable personal contact sync.
// Set to true to re-enable syncing of personal contacts (@s.whatsapp.net).
const ENABLE_PERSONAL_CONTACT_SYNC = false;

let messageStatusListener = null;
const logger = pino({ level: 'silent' });

// ─── Helper Functions ────────────────────────────────────────────────────────

/** Returns true if a session is currently initialized in memory. */
function hasSession(sessionId) {
  return sessions.has(sessionId);
}

async function useMongoDBAuthState(sessionId) {
  const isProd = process.env.NODE_ENV === 'production';
  const nsSessionId = isProd ? `prod_${sessionId}` : `dev_${sessionId}`;

  const readData = async (key) => {
    try {
      const doc = await db.AuthSession.findOne({ sessionId: nsSessionId, key }).lean();
      if (!doc) return null;
      return JSON.parse(doc.value, BufferJSON.reviver);
    } catch (err) {
      console.error(`[Auth] [${sessionId}] Error reading key ${key}:`, err.message);
      return null;
    }
  };

  const writeData = async (key, value) => {
    try {
      if (value === null || value === undefined) {
        await db.AuthSession.deleteOne({ sessionId: nsSessionId, key });
      } else {
        const jsonStr = JSON.stringify(value, BufferJSON.replacer);
        await db.AuthSession.updateOne(
          { sessionId: nsSessionId, key },
          { $set: { value: jsonStr } },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error(`[Auth] [${sessionId}] Error writing key ${key}:`, err.message);
    }
  };

  let creds = await readData('creds');
  if (!creds) {
    creds = initAuthCreds();
    await writeData('creds', creds);
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}:${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}:${id}`;
              tasks.push(writeData(key, value));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      await writeData('creds', creds);
    }
  };
}

/** Check if session has saved credentials and extract the phone number from them. */
async function getPhoneFromSession(sessionId) {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const nsSessionId = isProd ? `prod_${sessionId}` : `dev_${sessionId}`;
    const doc = await db.AuthSession.findOne({ sessionId: nsSessionId, key: 'creds' }).lean();
    if (doc) {
      const creds = JSON.parse(doc.value, BufferJSON.reviver);
      if (creds?.me?.id) {
        return creds.me.id.split('@')[0].split(':')[0];
      }
    }
  } catch (_) { }
  return null;
}

function saveContactsCacheToFile(session) {
  try {
    const contactsPath = path.join(SESSIONS_ROOT, session.sessionId, 'contacts.json');
    fs.writeFileSync(contactsPath, JSON.stringify(session.contactCache, null, 2), 'utf8');
  } catch (err) {
    console.error(`[WA] [${session.sessionId}] Failed to save contacts cache to file:`, err.message);
  }
}

/**
 * Contact and message databases are owned by the connected WhatsApp number,
 * never by the browser-generated session id. A session id is only a transport
 * identifier and changes independently of a WhatsApp account.
 */
function getDatabaseOwner(session) {
  return session?.connectedProfile?.phone || getPhoneFromSession(session?.sessionId);
}

function queueContactForSync(session, contact) {
  if (!session.contactsBuffer) {
    session.contactsBuffer = new Map();
  }
  if (!session.pendingContactResolutions) {
    session.pendingContactResolutions = new Set();
  }

  const jid = contact.jid || contact.id;
  if (!jid || typeof jid !== 'string') return;

  const isUser = jid.endsWith('@s.whatsapp.net');
  const isGroup = jid.endsWith('@g.us');
  if (!isUser && !isGroup) return;

  const phone = isGroup ? jid : jid.split('@')[0].split(':')[0];
  if (!isGroup && phone.length < 7) return;

  let resolvedName = '';
  if (!isGroup) {
    if (contact.name && db.isValidPersonalContactName(contact.name, phone)) {
      resolvedName = contact.name;
    }
    if (!resolvedName) {
      const pushNameCandidate = contact.notify || contact.pushName || contact.verifiedName;
      if (pushNameCandidate && db.isValidPersonalContactName(pushNameCandidate, phone)) {
        resolvedName = pushNameCandidate;
      }
    }
  } else {
    resolvedName = contact.subject || contact.name || '';
  }

  const cleanName = db.getCleanContactName(resolvedName);
  const hasValidName = cleanName && (isGroup || db.isValidPersonalContactName(cleanName, phone));

  if (!hasValidName) {
    session.contactCache[jid] = session.contactCache[jid] || '';
    return;
  }

  session.contactCache[jid] = cleanName;
  session.contactsBuffer.set(jid, {
    phone,
    jid,
    name: cleanName,
    type: isGroup ? 'group' : 'personal',
    source: contact.source || (isGroup ? 'group_sync' : 'whatsapp_sync')
  });

  if (session.contactsBuffer.size >= 10) {
    flushContactsBuffer(session);
  } else {
    if (session.bufferTimeout) {
      clearTimeout(session.bufferTimeout);
    }
    session.bufferTimeout = setTimeout(() => {
      flushContactsBuffer(session);
    }, 2000);
  }
}


function queueVerifiedContact(session, contact) {
  if (!session.contactsBuffer) {
    session.contactsBuffer = new Map();
  }

  const { jid, phone, name, type, source } = contact;
  if (!jid || !name) return;

  session.contactCache[jid] = name;
  session.contactsBuffer.set(jid, { phone, jid, name, type, source });

  if (session.contactsBuffer.size >= 10) {
    flushContactsBuffer(session);
  } else {
    if (session.bufferTimeout) {
      clearTimeout(session.bufferTimeout);
    }
    session.bufferTimeout = setTimeout(() => {
      flushContactsBuffer(session);
    }, 2000);
  }
}

async function flushContactsBuffer(session) {
  if (session.bufferTimeout) {
    clearTimeout(session.bufferTimeout);
    session.bufferTimeout = null;
  }

  if (!session.contactsBuffer || session.contactsBuffer.size === 0) return;

  const contactsToSave = Array.from(session.contactsBuffer.values());
  session.contactsBuffer.clear();

  const sessionId = session.sessionId;
  console.log(`[WA] [${sessionId}] Flushing ${contactsToSave.length} buffered contacts to MongoDB (Encrypted)...`);

  const chunkSize = 10;
  for (let i = 0; i < contactsToSave.length; i += chunkSize) {
    const chunk = contactsToSave.slice(i, i + chunkSize);
    const operations = chunk.map(c => {
      const encryptedNumberOrJid = db.encrypt(c.type === 'group' ? c.jid : c.phone);
      const encryptedName = db.encrypt(c.name);
      console.log(`[DEBUG Sync] Saved contact in DB: ${c.name || 'null'} for JID: ${c.jid}`);
      return {
        updateOne: {
          filter: { sessionId, jid: c.jid },
          update: {
            $set: {
              encryptedNumberOrJid,
              encryptedName,
              type: c.type,
              source: c.source || 'whatsapp_sync',
              createdAt: new Date()
            }
          },
          upsert: true
        }
      };
    });

    try {
      await Contact.bulkWrite(operations, { ordered: false });
    } catch (err) {
      console.error(`[WA] [${sessionId}] MongoDB bulkWrite error:`, err.message);
    }
  }

  saveContactsCacheToFile(session);
}

function cacheContacts(session, contacts) {
  for (const c of contacts || []) {
    if (!c) continue;
    queueContactForSync(session, {
      id: c.id || c.jid,
      jid: c.jid || c.id,
      name: c.name,
      notify: c.notify,
      verifiedName: c.verifiedName,
      pushName: c.pushName,
      subject: c.subject,
      source: c.source || 'whatsapp_sync'
    });
  }
}

function processIncomingChats(session, chats) {
  for (const chat of chats || []) {
    if (!chat) continue;
    queueContactForSync(session, {
      id: chat.id,
      jid: chat.id,
      name: chat.name,
      notify: chat.notify,
      verifiedName: chat.verifiedName,
      pushName: chat.pushName,
      subject: chat.subject,
      source: chat.id?.endsWith('@g.us') ? 'group_sync' : 'chat_sync'
    });
  }
}

async function handleNewMessageContact(session, message) {
  const remoteJid = message.key.remoteJid;
  if (!remoteJid || typeof remoteJid !== 'string') return;

  const jids = [];
  if (remoteJid.endsWith('@s.whatsapp.net')) {
    jids.push({ jid: remoteJid, name: message.pushName || '' });
  }
  const participant = message.key.participant;
  if (participant && typeof participant === 'string' && participant.endsWith('@s.whatsapp.net')) {
    jids.push({ jid: participant, name: message.pushName || '' });
  }

  for (const item of jids) {
    const jid = item.jid;
    const phone = jid.split('@')[0].split(':')[0];
    if (phone.length < 7) continue;

    // Check memory cache first to avoid DB queries
    if (session.contactCache[jid]) continue;

    // Check MongoDB next
    try {
      const dbContact = await Contact.findOne({ sessionId: session.sessionId, jid }).lean();
      if (dbContact) {
        const dbName = dbContact.name || '';
        session.contactCache[jid] = dbName;

        const isDbNameEmpty = !dbName;
        const hasRealName = item.name && item.name !== phone && item.name !== `+${phone}`;
        if (isDbNameEmpty && hasRealName) {
          console.log(`[WA] [${session.sessionId}] Live update contact name from message: ${item.name} (${phone})`);
          queueContactForSync(session, {
            id: jid,
            jid,
            name: item.name,
            source: 'live_message_update'
          });
        }
      } else {
        const name = item.name || null;

        console.log(`[WA] [${session.sessionId}] Auto-adding contact from message stream: ${name || 'unknown'} (${phone})`);
        queueContactForSync(session, {
          id: jid,
          jid,
          name: name,
          source: 'live_message'
        });
      }
    } catch (err) {
      console.error(`[WA] [${session.sessionId}] DB query failed in handleNewMessageContact:`, err.message);
    }
  }
}

function cacheMessages(session, messages) {
  for (const message of messages || []) {
    if (!message?.key) continue;
    handleNewMessageContact(session, message).catch(err => {
      console.error(`[WA] [${session.sessionId}] handleNewMessageContact error:`, err.message);
    });
  }
}

function searchContactsSync(sessionId, query, limit = 10) {
  const session = sessions.get(sessionId);
  if (!session) return [];
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];

  const results = [];
  for (const [jid, name] of Object.entries(session.contactCache)) {
    const isGroup = jid.endsWith('@g.us');
    const phone = isGroup ? jid : jid.split('@')[0].split(':')[0];

    const nameMatch = name && name.toLowerCase().includes(q);
    const phoneMatch = phone.includes(q);

    if (nameMatch || phoneMatch) {
      results.push({ jid, phone, name, isGroup, is_group: isGroup ? 1 : 0 });
    }
  }

  return results
    .sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      return aName.localeCompare(bName);
    })
    .slice(0, limit);
}

function importContactsToCache(sessionId, contacts) {
  const session = sessions.get(sessionId);
  if (!session) return 0;
  let imported = 0;
  for (const c of contacts) {
    const isGroup = c.phone.endsWith('@g.us');
    const jid = isGroup ? c.phone : `${c.phone}@s.whatsapp.net`;
    const name = c.name ? String(c.name).trim() : '';

    queueContactForSync(session, {
      id: jid,
      jid,
      name,
      source: c.source || 'import'
    });
    imported++;
  }
  return imported;
}

// Active contact resolver for immediate name lookup
async function resolveContactLive(sessionId, phone) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'connected' || !session.sock) {
    return { exists: false, name: null, jid: null, isGroup: false };
  }

  const isGroup = phone.endsWith('@g.us');
  const cleaned = isGroup ? phone : phone.replace(/\D/g, '');
  const jid = isGroup ? phone : `${cleaned}@s.whatsapp.net`;

  try {
    // 1. Check cache first
    if (session.contactCache[jid]) {
      return { exists: true, name: session.contactCache[jid], jid, isGroup, source: 'cache' };
    }

    // 2. Check MongoDB next
    const dbContact = await Contact.findOne({ sessionId, jid }).lean();
    if (dbContact) {
      const storedName = db.decrypt(dbContact.encryptedName) || '';
      session.contactCache[jid] = storedName;
      const valid = isGroup || db.isValidPersonalContactName(storedName, cleaned);
      if (!valid) {
        return { exists: false, name: null, jid, isGroup, source: 'database' };
      }
      return { exists: true, name: storedName, jid: dbContact.jid || jid, isGroup, source: 'database' };
    }

    if (isGroup) {
      try {
        const metadata = await session.sock.groupMetadata(jid);
        const name = metadata.subject || '';
        if (name) {
          const trimmedName = name.trim();
          session.contactCache[jid] = trimmedName;
          await Contact.updateOne(
            { sessionId, jid },
            {
              $set: {
                encryptedNumberOrJid: db.encrypt(jid),
                encryptedName: db.encrypt(trimmedName),
                type: 'group',
                source: 'live_lookup',
                createdAt: new Date()
              }
            },
            { upsert: true }
          );
          return { exists: true, name: trimmedName, jid, isGroup: true, source: 'live_lookup' };
        }
      } catch (err) {
        console.error(`[WA] [${sessionId}] Failed to fetch group metadata live for ${jid}:`, err.message);
      }
      return { exists: false, name: null, jid: null, isGroup: true };
    }

    // 3. Active WhatsApp lookup (personal contacts)
    const results = await session.sock.onWhatsApp(jid).catch(() => []);
    const result = results?.find(r => r.exists && r.jid);
    if (!result) {
      return { exists: false, name: null, jid: null, isGroup: false };
    }

    let name = null;

    // Try multiple methods to get the name
    try {
      // Method 1: Get business profile
      const businessProfile = await session.sock.getBusinessProfile(jid).catch(() => null);
      if (businessProfile) {
        name = businessProfile.name || businessProfile.verifiedName || businessProfile.description || null;
      }
    } catch { }

    // Method 2: Check if it's in recent presence updates
    if (!name) {
      try {
        const presence = await session.sock.presenceSubscribe(jid).catch(() => null);
        if (presence?.name) {
          name = presence.name;
        }
      } catch { }
    }

    // Method 3: Use result pushName if available
    if (!name && result.pushName) {
      name = result.pushName;
    }

    // Cache the result (even if name is empty, record the verification)
    const finalName = name ? name.trim() : null;
    const isValid = db.isValidPersonalContactName(finalName, cleaned);
    if (isValid) {
      session.contactCache[jid] = finalName;
      await Contact.updateOne(
        { sessionId, jid },
        {
          $set: {
            encryptedNumberOrJid: db.encrypt(cleaned),
            encryptedName: db.encrypt(finalName),
            type: 'personal',
            source: 'live_lookup',
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    } else {
      session.contactCache[jid] = '';
    }
    saveContactsCacheToFile(session);

    return { exists: true, name: isValid ? finalName : null, jid: result.jid || jid, isGroup: false, source: 'live_lookup' };
  } catch (err) {
    console.error(`[WA] [${sessionId}] Live contact resolve error for ${cleaned}:`, err.message);
    return { exists: false, name: null, jid: null, isGroup };
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
      contactCache: {},
      isSyncing: false,
      contactsBuffer: new Map(),
      bufferTimeout: null
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

  session.contactCache = {};

  // Load contacts from MongoDB and decrypt them into in-memory cache
  try {
    const dbContactsList = await Contact.find({ sessionId }).lean();
    for (const c of dbContactsList) {
      if (c.jid) {
        session.contactCache[c.jid] = db.decrypt(c.encryptedName) || '';
      }
    }
    console.log(`[WA] [${sessionId}] Loaded ${dbContactsList.length} contacts from MongoDB (encrypted) to memory cache.`);
  } catch (err) {
    console.error(`[WA] [${sessionId}] Failed to load contacts from MongoDB:`, err.message);
  }

  const { state, saveCreds } = await useMongoDBAuthState(sessionId);
  if (state.creds?.me?.id) {
    session.connectedProfile.phone = state.creds.me.id.split('@')[0].split(':')[0];
  }
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    // Desktop identity is required by WhatsApp to deliver the largest history
    // sync available to a linked device.
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: true,
    generateHighQualityLinkPreview: false,
    keepAliveIntervalMs: 25_000,
    retryRequestDelayMs: 5_000,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 0,
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
        session.status = 'qr_ready';
        console.log(`[WA] [${sessionId}] QR code generated — waiting for scan.`);
      } catch (err) {
        console.error(`[WA] [${sessionId}] QR generation error:`, err.message);
      }
    }

    if (connection === 'open') {
      session.status = 'connected';
      session.qrBase64 = null;
      session.pairingCode = null;
      session.isSyncing = true;

      if (session.contactsBuffer) {
        session.contactsBuffer.clear();
      }
      if (session.pendingContactResolutions) {
        session.pendingContactResolutions.clear();
      }

      const groupSyncPromise = (async () => {
        try {
          console.log(`[WA] [${sessionId}] Fetching groups for single-pass sync...`);
          const groups = await sock.groupFetchAllParticipating().catch(() => ({}));
          const groupContacts = [];
          for (const [id, metadata] of Object.entries(groups)) {
            const subject = metadata.subject || metadata.name || '';
            if (subject) {
              groupContacts.push({
                id,
                name: subject.trim(),
                isGroup: true,
                source: 'group_sync'
              });
            }
          }
          if (groupContacts.length > 0) {
            console.log(`[WA] [${sessionId}] Syncing ${groupContacts.length} groups on connection.`);
            cacheContacts(session, groupContacts);
            await flushContactsBuffer(session);
          }
        } catch (groupErr) {
          console.error(`[WA] [${sessionId}] Failed to sync groups on connection:`, groupErr.message);
        }
      })();

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.warn(`[WA] [${sessionId}] Group sync timed out after 30s safety abort.`);
          resolve();
        }, 30000);
      });

      Promise.race([groupSyncPromise, timeoutPromise]).finally(() => {
        console.log(`[WA] [${sessionId}] Group sync finished or aborted. Halting background sync.`);
        session.isSyncing = false;
      });

      try {
        await updateConnectedProfile(sessionId);
        const currentPhone = session.connectedProfile.phone;
        console.log(`[WA] [${sessionId}] Connected as: ${session.connectedProfile.name || session.connectedProfile.phone} (+${currentPhone})`);
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
        console.log(`[WA] [${sessionId}] Disconnected (loggedOut) — preserving credentials and retrying in 5 seconds.`);
        session.status = 'disconnected';
        session.reconnectTimer = setTimeout(() => initWhatsApp(sessionId), 5_000);
      } else if (code === connectionReplaced) {
        // A 440 means another process/device has temporarily taken over this
        // exact linked-device session. Do not delete auth/contact files here:
        // doing so creates a re-pair loop and loses the fast local cache.
        session.status = 'disconnected';
        session.isSyncing = false;
        console.warn(`[WA] [${sessionId}] Session active elsewhere (Connection replaced/440 by another instance). Gracefully halting automatic reconnection to avoid conflicts.`);
        // Gracefully halt reconnection loops - do not set reconnectTimer
      } else if (code === multideviceMismatch) {
        // This is a genuine credential mismatch; data remains in the
        // phone-keyed database even though a new pairing will be required.
        console.log(`[WA] [${sessionId}] Connection closed with multideviceMismatch. Preserving session for retry.`);
        session.status = 'disconnected';
        session.isSyncing = false;
        session.reconnectTimer = setTimeout(() => initWhatsApp(sessionId), 5_000);
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

  // ── Contacts update — populate name cache ────────────────────────────────
  sock.ev.on('contacts.update', (contacts) => {
    let contactsList = Array.isArray(contacts) ? contacts : (contacts?.contacts || []);
    if (!ENABLE_PERSONAL_CONTACT_SYNC) {
      contactsList = contactsList.filter(c => {
        const jid = c?.id || c?.jid;
        return !jid || !jid.endsWith('@s.whatsapp.net');
      });
    }
    console.log(`[WA] [${sessionId}] contacts.update event: ${contactsList.length} contacts`);
    for (const c of contactsList) {
      if (!c) continue;
      const rawName = c.name || c.notify || c.pushName || c.verifiedName || '';
      console.log(`[DEBUG Sync] Raw name from WhatsApp: ${rawName} for JID: ${c.id || c.jid}`);
    }
    cacheContacts(session, contactsList);
  });

  sock.ev.on('contacts.upsert', (contacts) => {
    let contactsList = Array.isArray(contacts) ? contacts : (contacts?.contacts || []);
    if (!ENABLE_PERSONAL_CONTACT_SYNC) {
      contactsList = contactsList.filter(c => {
        const jid = c?.id || c?.jid;
        return !jid || !jid.endsWith('@s.whatsapp.net');
      });
    }
    console.log(`[WA] [${sessionId}] contacts.upsert event: ${contactsList.length} contacts`);
    for (const c of contactsList) {
      if (!c) continue;
      const rawName = c.name || c.notify || c.pushName || c.verifiedName || '';
      console.log(`[DEBUG Sync] Raw name from WhatsApp: ${rawName} for JID: ${c.id || c.jid}`);
    }
    cacheContacts(session, contactsList);
  });

  sock.ev.on('contacts.set', (payload) => {
    let contactsList = Array.isArray(payload) ? payload : (payload?.contacts || []);
    if (!ENABLE_PERSONAL_CONTACT_SYNC) {
      contactsList = contactsList.filter(c => {
        const jid = c?.id || c?.jid;
        return !jid || !jid.endsWith('@s.whatsapp.net');
      });
    }
    console.log(`[WA] [${sessionId}] contacts.set event: ${contactsList.length} contacts`);
    for (const c of contactsList) {
      if (!c) continue;
      const rawName = c.name || c.notify || c.pushName || c.verifiedName || '';
      console.log(`[DEBUG Sync] Raw name from WhatsApp: ${rawName} for JID: ${c.id || c.jid}`);
    }
    cacheContacts(session, contactsList);
  });

  sock.ev.on('chats.upsert', (chats) => {
    const chatsList = Array.isArray(chats) ? chats : (chats?.chats || []);
    console.log(`[WA] [${sessionId}] chats.upsert event: ${chatsList.length} chats`);
    processIncomingChats(session, chatsList);
  });

  sock.ev.on('chats.set', (payload) => {
    const chatsList = Array.isArray(payload) ? payload : (payload?.chats || []);
    console.log(`[WA] [${sessionId}] chats.set event: ${chatsList.length} chats`);
    processIncomingChats(session, chatsList);
  });

  sock.ev.on('chats.update', (chats) => {
    const chatsList = Array.isArray(chats) ? chats : (chats?.chats || []);
    console.log(`[WA] [${sessionId}] chats.update event: ${chatsList.length} chats`);
    processIncomingChats(session, chatsList);
  });

  sock.ev.on('messaging-history.set', (payload) => {
    const chats = payload?.chats || [];
    let contacts = payload?.contacts || [];
    let messages = payload?.messages || [];
    
    if (!ENABLE_PERSONAL_CONTACT_SYNC) {
      contacts = contacts.filter(c => {
        const jid = c?.id || c?.jid;
        return !jid || !jid.endsWith('@s.whatsapp.net');
      });
      messages = messages.filter(m => {
        const remoteJid = m?.key?.remoteJid;
        return !remoteJid || !remoteJid.endsWith('@s.whatsapp.net');
      });
    }

    console.log(`[WA] [${sessionId}] messaging-history.set: ${chats.length} chats, ${contacts.length} contacts, ${messages.length} messages`);
    session.isSyncing = false; // Syncing finished!
    if (chats.length > 0) processIncomingChats(session, chats);
    if (contacts.length > 0) cacheContacts(session, contacts);
    if (messages.length > 0) cacheMessages(session, messages);
    console.log(`[WA] [${sessionId}] Initial history sync completed. Total cached contacts: ${Object.keys(session.contactCache).length}`);
  });

  sock.ev.on('messages.upsert', ({ messages }) => {
    let filteredMessages = messages || [];
    if (!ENABLE_PERSONAL_CONTACT_SYNC) {
      filteredMessages = filteredMessages.filter(m => {
        const remoteJid = m?.key?.remoteJid;
        return !remoteJid || !remoteJid.endsWith('@s.whatsapp.net');
      });
    }
    cacheMessages(session, filteredMessages);
  });

  sock.ev.on('groups.upsert', (groups) => {
    console.log(`[WA] [${sessionId}] groups.upsert event: ${(groups || []).length} groups`);
    const groupContacts = [];
    for (const group of groups || []) {
      if (group.id && group.subject) {
        groupContacts.push({
          id: group.id,
          name: group.subject.trim(),
          isGroup: true
        });
      }
    }
    if (groupContacts.length > 0) {
      cacheContacts(session, groupContacts);
    }
  });

  sock.ev.on('groups.update', (updates) => {
    console.log(`[WA] [${sessionId}] groups.update event: ${(updates || []).length} updates`);
    const groupContacts = [];
    for (const update of updates || []) {
      if (update.id && update.subject) {
        groupContacts.push({
          id: update.id,
          name: update.subject.trim(),
          isGroup: true
        });
      }
    }
    if (groupContacts.length > 0) {
      cacheContacts(session, groupContacts);
    }
  });

  return sock;
}

// ─── Bootstrap Saved Sessions ─────────────────────────────────────────────────

async function bootstrapSessions() {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const expectedPrefix = isProd ? 'prod_' : 'dev_';
    const dbSessionIds = await db.AuthSession.distinct('sessionId');
    for (const dbSessionId of dbSessionIds) {
      if (dbSessionId && dbSessionId.startsWith(expectedPrefix)) {
        const originalSessionId = dbSessionId.substring(expectedPrefix.length);
        console.log(`[WA] Bootstrapping saved session: ${originalSessionId} (Namespace: ${expectedPrefix})`);
        initWhatsApp(originalSessionId).catch((err) => {
          console.error(`[WA] Error bootstrapping session ${originalSessionId}:`, err.message);
        });
      }
    }
  } catch (err) {
    console.error(`[WA] Error bootstrapping sessions from MongoDB:`, err.message);
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

  await clearSession(sessionId);

  await initWhatsApp(sessionId);
  await new Promise((r) => setTimeout(r, 3_000));
  session = sessions.get(sessionId);

  if (session.status === 'connected') throw new Error('Already connected to WhatsApp.');

  const cleaned = phoneNumber.replace(/\D/g, '');
  if (!cleaned) throw new Error('Invalid phone number.');

  try {
    const code = await session.sock.requestPairingCode(cleaned);
    session.pairingCode = code;
    session.status = 'qr_ready';
    console.log(`[WA] [${sessionId}] Pairing code for ${cleaned}: ${code}`);
    return code;
  } catch (err) {
    console.error(`[WA] [${sessionId}] Pairing code error:`, err.message);
    throw err;
  }
}

// ─── Fetch contact name ───────────────────────────────────────────────────────

async function getContactName(sessionId, phone) {
  const resolved = await resolveContactLive(sessionId, phone);
  return resolved.name;
}

function getContactNameSync(sessionId, phone) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const isGroup = phone.endsWith('@g.us');
  const jid = isGroup ? phone : `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
  return session.contactCache[jid] || null;
}

function getAllContacts(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return [];
  return Object.entries(session.contactCache)
    .filter(([jid]) => jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us'))
    .map(([jid, name]) => {
      const isGroup = jid.endsWith('@g.us');
      const phone = isGroup ? jid : jid.split('@')[0].split(':')[0];
      return { jid, phone, name, isGroup };
    });
}

// ─── Send message ─────────────────────────────────────────────────────────────

async function sendMessage(sessionId, phone, text) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'connected' || !session.sock) {
    throw new Error('WhatsApp is not connected for this session.');
  }

  const isGroup = phone.endsWith('@g.us');
  const jid = isGroup ? phone : await resolveRecipientJid(sessionId, phone.replace(/\D/g, ''));

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
  const resolved = await resolveContactLive(sessionId, phone);
  return {
    exists: resolved.exists,
    name: resolved.name,
    jid: resolved.jid
  };
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
      try { await session.sock.logout(); } catch (_) { }
      try {
        session.sock.ev.removeAllListeners();
        session.sock.end();
      } catch (_) { }
    }
    await clearSession(sessionId);
    session.status = 'disconnected';
    session.sock = null;
    session.connectedProfile = { name: null, phone: null, jid: null };
    session.contactCache = {};
    sessions.delete(sessionId);
  }
}

async function clearSession(sessionId) {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const nsSessionId = isProd ? `prod_${sessionId}` : `dev_${sessionId}`;
    await db.AuthSession.deleteMany({ sessionId: nsSessionId });
    const sessionDir = path.join(SESSIONS_ROOT, sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    console.log(`[WA] [${sessionId}] Cleared persistent session from MongoDB and disk.`);
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
      const rawJid = user.id || '';
      const phonePart = rawJid.split('@')[0].split(':')[0];
      const selfJid = `${phonePart}@s.whatsapp.net`;

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

      // Load/save from MongoDB User document
      try {
        const userDoc = await db.User.findOne({ sessionId });
        if (userDoc && userDoc.name) {
          displayName = userDoc.name;
        } else {
          await db.User.updateOne(
            { sessionId },
            { $set: { phoneNumber: phonePart, name: displayName || '' } },
            { upsert: true }
          );
        }
      } catch (dbErr) {
        console.error(`[WA] [${sessionId}] User DB load/save error:`, dbErr.message);
      }

      session.connectedProfile = {
        name: displayName || `User +${phonePart}`,
        phone: phonePart,
        jid: rawJid,
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

function getSyncStatus(sessionId) {
  const session = sessions.get(sessionId);
  return session ? Boolean(session.isSyncing) : false;
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

async function syncGroups(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'connected' || !session.sock) {
    throw new Error('WhatsApp is not connected.');
  }

  session.isSyncing = true;
  
  const groupSyncPromise = (async () => {
    try {
      console.log(`[WA] [${sessionId}] Starting manual group sync...`);
      const groups = await session.sock.groupFetchAllParticipating();
      const groupContacts = [];
      for (const [id, metadata] of Object.entries(groups)) {
        const subject = metadata.subject || metadata.name || '';
        if (subject) {
          groupContacts.push({
            id,
            name: subject.trim(),
            isGroup: true,
            source: 'manual_group_sync'
          });
        }
      }
      if (groupContacts.length > 0) {
        console.log(`[WA] [${sessionId}] Manually syncing ${groupContacts.length} groups.`);
        cacheContacts(session, groupContacts);
        await flushContactsBuffer(session);
      }
    } catch (err) {
      console.error(`[WA] [${sessionId}] Manual group sync error:`, err.message);
      throw err;
    }
  })();

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Group sync timed out after 30 seconds.'));
    }, 30000);
  });

  try {
    await Promise.race([groupSyncPromise, timeoutPromise]);
  } finally {
    session.isSyncing = false;
  }
}

function updateProfileName(sessionId, name) {
  const session = sessions.get(sessionId);
  if (session) {
    session.connectedProfile.name = name;
  }
}

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
  getSyncStatus,
  searchContactsSync,
  importContactsToCache,
  syncGroups,
  updateProfileName,
};
