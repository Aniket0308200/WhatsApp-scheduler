const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const dns = require('dns');

// Override DNS servers to Google & Cloudflare public DNS to bypass querySrv ECONNREFUSED issues on local network
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('[DNS Warning] Failed to set custom DNS servers:', err.message);
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsapp_scheduler';
const secretKey = process.env.ENCRYPTION_KEY || 'local-development-secret-key-123';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('[MongoDB] Connected successfully.');
    await cleanInvalidContactsFromDb();
  })
  .catch(err => console.error('[MongoDB] Connection error:', err.message));

// ─── Cryptography Helpers (Deterministic & Decryptable AES) ────────────────────
function encrypt(text) {
  if (!text) return '';
  const key = CryptoJS.enc.Utf8.parse(CryptoJS.SHA256(secretKey).toString().substring(0, 32));
  const iv = CryptoJS.enc.Utf8.parse(CryptoJS.SHA256(secretKey).toString().substring(32, 48));
  const encrypted = CryptoJS.AES.encrypt(String(text), key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

function decrypt(cipherText) {
  if (!cipherText) return '';
  try {
    const key = CryptoJS.enc.Utf8.parse(CryptoJS.SHA256(secretKey).toString().substring(0, 32));
    const iv = CryptoJS.enc.Utf8.parse(CryptoJS.SHA256(secretKey).toString().substring(32, 48));
    const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (!result && cipherText) {
      return cipherText;
    }
    return result;
  } catch (e) {
    return cipherText;
  }
}

// ─── Contact Model ───────────────────────────────────────────────────────────
const ContactSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  jid: { type: String, required: true },
  encryptedNumberOrJid: { type: String, required: true },
  encryptedName: { type: String, default: '' },
  type: { type: String, enum: ['personal', 'group'], required: true },
  source: { type: String, default: 'whatsapp_sync' },
  linkedEmail: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for fast upserts per session
ContactSchema.index({ sessionId: 1, jid: 1 }, { unique: true });
ContactSchema.index({ sessionId: 1, type: 1 });

const Contact = mongoose.model('Contact', ContactSchema);

// ─── LinkedGoogleAccount Model ────────────────────────────────────────────────
const LinkedGoogleAccountSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
LinkedGoogleAccountSchema.index({ sessionId: 1, email: 1 }, { unique: true });

const LinkedGoogleAccount = mongoose.model('LinkedGoogleAccount', LinkedGoogleAccountSchema);

// ─── User Model ──────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  name: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
UserSchema.index({ sessionId: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);

// ─── AuthSession Model ───────────────────────────────────────────────────────
const AuthSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  key: { type: String, required: true },
  value: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
AuthSessionSchema.index({ sessionId: 1, key: 1 }, { unique: true });

const AuthSession = mongoose.model('AuthSession', AuthSessionSchema);

// ─── AuthAccount Model (User Login & Sign Up) ──────────────────────────────
const AuthAccountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  linkedWhatsAppPhone: { type: String, default: null },
  linkedWhatsAppJid: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const AuthAccount = mongoose.model('AuthAccount', AuthAccountSchema);

async function createAuthAccount({ name, email, password }) {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await AuthAccount.findOne({ email: cleanEmail });
  if (existing) {
    throw new Error('Email is already registered. Please sign in instead.');
  }
  const passwordHash = encrypt(password);
  const account = await AuthAccount.create({
    name: name.trim(),
    email: cleanEmail,
    passwordHash
  });
  return { id: account._id.toString(), name: account.name, email: account.email };
}

async function findAuthAccountByEmail(email) {
  return await AuthAccount.findOne({ email: email.toLowerCase().trim() });
}

function verifyAuthAccountPassword(inputPassword, storedHash) {
  const decrypted = decrypt(storedHash);
  return decrypted === inputPassword;
}

// ─── Feedback Model ──────────────────────────────────────────────────────────
const FeedbackSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['public', 'personal'], default: 'public' },
  likes: { type: [String], default: [] }, // Array of userIds/sessionIds
  adminReply: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
FeedbackSchema.index({ type: 1, createdAt: -1 });

const Feedback = mongoose.model('Feedback', FeedbackSchema);

function cleanContactName(name) {
  if (!name) return null;
  const trimmed = String(name).trim();
  return trimmed || null;
}

function isPhoneMatchName(name, phone) {
  if (!name || !phone) return false;
  const normalizedName = String(name).trim();
  const normalizedPhone = String(phone).replace(/\D/g, '');
  return normalizedName === normalizedPhone || normalizedName === `+${normalizedPhone}`;
}

function isValidPersonalContactName(name, phone) {
  const cleaned = cleanContactName(name);
  if (!cleaned) return false;

  const lower = cleaned.toLowerCase();
  if (lower === 'null' || lower === 'undefined' || lower === 'unknown') return false;

  const plainPhone = String(phone).replace(/\D/g, '');
  if (!plainPhone) return false;

  if (cleaned.length < 2) return false;

  // If the name consists ONLY of digits, spaces, and phone symbols (+, -, (, ), etc.)
  if (/^\+?[\d\s\-()]+$/.test(cleaned)) return false;

  // If the name contains the phone number digits
  const nameDigits = cleaned.replace(/\D/g, '');
  if (plainPhone && nameDigits === plainPhone) return false;

  if (isPhoneMatchName(cleaned, plainPhone)) return false;

  return true;
}

async function cleanInvalidContactsFromDb() {
  try {
    const personalContacts = await Contact.find({ type: 'personal' }).lean();
    const idsToDelete = [];
    for (const c of personalContacts) {
      const name = decrypt(c.encryptedName);
      const phone = decrypt(c.encryptedNumberOrJid);
      if (!isValidPersonalContactName(name, phone)) {
        idsToDelete.push(c._id);
      }
    }
    if (idsToDelete.length > 0) {
      const res = await Contact.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`[DB Cleanup] Deleted ${res.deletedCount} invalid personal contacts (null/empty/only-number names).`);
    } else {
      console.log('[DB Cleanup] No invalid personal contacts found in database.');
    }
  } catch (err) {
    console.error('[DB Cleanup] Error cleaning invalid contacts:', err.message);
  }
}

function getCleanContactName(name) {
  return cleanContactName(name);
}

// ─── Scheduled Message Model ──────────────────────────────────────────────────
const ScheduledMessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  encryptedNumber: { type: String, required: true }, // Encrypted recipient
  encryptedRecipientName: { type: String, default: '' }, // Encrypted display name
  encryptedMessageText: { type: String, required: true }, // Encrypted message body
  scheduledAt: { type: Date, required: true },
  status: { type: String, default: 'pending' }, // 'pending' | 'submitted' | 'sent' | 'failed' | 'cancelled'
  error: { type: String, default: null },
  waMessageId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

ScheduledMessageSchema.index({ sessionId: 1, scheduledAt: 1 });
ScheduledMessageSchema.index({ status: 1, scheduledAt: 1 });

const ScheduledMessage = mongoose.model('ScheduledMessage', ScheduledMessageSchema);

// ─── Rolling Cap Helper ───────────────────────────────────────────────────────
async function enforceRollingCap(sessionId) {
  try {
    const count = await ScheduledMessage.countDocuments({ sessionId });
    if (count > 50) {
      const keepList = await ScheduledMessage.find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('_id')
        .lean();
      const keepIds = keepList.map(m => m._id);
      await ScheduledMessage.deleteMany({
        sessionId,
        _id: { $nin: keepIds }
      });
    }
  } catch (err) {
    console.error('[DB] Error enforcing rolling cap:', err.message);
  }
}

// ─── Convert Date to UTC string for compatibility ────────────────────────────
function toSqliteUtc(dateInput) {
  const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}

// ─── Message Query Functions ──────────────────────────────────────────────────

async function insertMessage(sessionId, phone, message, scheduledAt, recipientName = null) {
  const schedDate = new Date(scheduledAt);
  const msg = new ScheduledMessage({
    sessionId,
    encryptedNumber: encrypt(phone),
    encryptedRecipientName: encrypt(recipientName),
    encryptedMessageText: encrypt(message),
    scheduledAt: schedDate,
    status: 'pending'
  });
  await msg.save();
  await enforceRollingCap(sessionId);
  return msg._id.toString();
}

async function getAllMessages(sessionId) {
  const docs = await ScheduledMessage.find({ sessionId }).sort({ createdAt: -1 }).lean();
  
  // Fetch contacts for the session to resolve names dynamically
  const contacts = await Contact.find({ sessionId }).lean();
  const contactMap = {};
  for (const c of contacts) {
    const decName = decrypt(c.encryptedName);
    const decPhone = decrypt(c.encryptedNumberOrJid);
    if (decName && decName !== decPhone && decName !== `+${decPhone}`) {
      contactMap[decPhone] = decName;
    }
  }

  return docs.map(m => {
    const phone = decrypt(m.encryptedNumber);
    let name = decrypt(m.encryptedRecipientName) || null;
    if (!name || name === phone || name === `+${phone}`) {
      name = contactMap[phone] || null;
    }
    return {
      id: m._id.toString(),
      phone,
      recipient_name: name,
      message: decrypt(m.encryptedMessageText),
      scheduled_at: toSqliteUtc(m.scheduledAt),
      status: m.status,
      error: m.error,
      wa_message_id: m.waMessageId,
      created_at: toSqliteUtc(m.createdAt)
    };
  });
}

async function getPendingDueMessages() {
  const now = new Date();
  const docs = await ScheduledMessage.find({
    status: 'pending',
    scheduledAt: { $lte: now }
  }).lean();

  return docs.map(m => ({
    id: m._id.toString(),
    sessionId: m.sessionId,
    phone: decrypt(m.encryptedNumber),
    recipient_name: decrypt(m.encryptedRecipientName) || null,
    message: decrypt(m.encryptedMessageText),
    scheduled_at: toSqliteUtc(m.scheduledAt),
    status: m.status,
    error: m.error,
    wa_message_id: m.waMessageId,
    created_at: toSqliteUtc(m.createdAt)
  }));
}

async function updateMessageStatus(sessionId, id, status, error = null) {
  await ScheduledMessage.updateOne(
    { _id: id },
    { $set: { status, error } }
  );
}

async function markMessageSubmitted(sessionId, id, waMessageId) {
  await ScheduledMessage.updateOne(
    { _id: id },
    { $set: { status: 'submitted', error: null, waMessageId } }
  );
}

async function updateMessageStatusByWhatsAppId(senderPhone, waMessageId, status) {
  const permitted = status === 'read' ? ['submitted', 'delivered', 'read'] : ['submitted'];
  const res = await ScheduledMessage.updateOne(
    { waMessageId, status: { $in: permitted } },
    { $set: { status } }
  );
  return res.modifiedCount;
}

async function cancelMessage(sessionId, id) {
  const res = await ScheduledMessage.updateOne(
    { _id: id, status: 'pending' },
    { $set: { status: 'cancelled' } }
  );
  return res.modifiedCount;
}

async function deleteMessage(sessionId, id) {
  const res = await ScheduledMessage.deleteOne({ _id: id });
  return res.deletedCount;
}

async function purgeSessionData(sessionId) {
  try {
    await Contact.deleteMany({ sessionId });
    await ScheduledMessage.deleteMany({ sessionId });
    await User.deleteMany({ sessionId });
    console.log(`[DB] Purged session data for ${sessionId}.`);
  } catch (err) {
    console.error(`[DB] Error purging session data for ${sessionId}:`, err.message);
  }
}

module.exports = {
  User,
  Contact,
  ScheduledMessage,
  AuthSession,
  LinkedGoogleAccount,
  AuthAccount,
  createAuthAccount,
  findAuthAccountByEmail,
  verifyAuthAccountPassword,
  encrypt,
  decrypt,
  insertMessage,
  getAllMessages,
  getPendingDueMessages,
  updateMessageStatus,
  markMessageSubmitted,
  updateMessageStatusByWhatsAppId,
  cancelMessage,
  deleteMessage,
  toSqliteUtc,
  Feedback,
  purgeSessionData,
  isValidPersonalContactName,
  getCleanContactName,
  cleanInvalidContactsFromDb,
};
