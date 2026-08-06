const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsapp_scheduler';
const secretKey = process.env.ENCRYPTION_KEY || 'local-development-secret-key-123';

mongoose.connect(mongoUri)
  .then(() => console.log('[MongoDB] Connected successfully.'))
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
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return '';
  }
}

// ─── Contact Model ───────────────────────────────────────────────────────────
const ContactSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  jid: { type: String, required: true }, // Encrypted JID
  encryptedName: { type: String, default: '' },
  encryptedNumberOrJid: { type: String, required: true },
  type: { type: String, enum: ['personal', 'group'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for fast upserts per session
ContactSchema.index({ sessionId: 1, jid: 1 }, { unique: true });
ContactSchema.index({ sessionId: 1, encryptedName: 1 });

const Contact = mongoose.model('Contact', ContactSchema);

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
  return docs.map(m => ({
    id: m._id.toString(),
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
    if (mongoose.models.User) {
      await mongoose.models.User.deleteMany({ sessionId });
    }
    console.log(`[DB] Purged session data for ${sessionId}.`);
  } catch (err) {
    console.error(`[DB] Error purging session data for ${sessionId}:`, err.message);
  }
}

module.exports = {
  Contact,
  ScheduledMessage,
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
  purgeSessionData,
};
