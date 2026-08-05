/**
 * db.js — MongoDB Atlas integration via mongoose
 *
 * Isolated and structured for multi-user session management.
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[DB] MONGODB_URI is not defined in environment variables. Please check your .env file.');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('[DB] Connected to MongoDB Atlas successfully.'))
    .catch((err) => console.error('[DB] MongoDB Atlas connection error:', err.message));
}

// ─── Schemas & Models ─────────────────────────────────────────────────────────

// User Schema: Store ONLY name, phoneNumber, sessionId, and createdAt.
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// ScheduledMessage Schema: Store userId/sessionId, recipientName, recipientNumber, messageText, scheduleTime, and status.
const ScheduledMessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  recipientName: { type: String, default: null },
  recipientNumber: { type: String, required: true },
  messageText: { type: String, required: true },
  scheduleTime: { type: Date, required: true },
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'submitted', 'delivered', 'read', 'failed', 'cancelled'] 
  },
  error: { type: String, default: null },
  waMessageId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const ScheduledMessage = mongoose.model('ScheduledMessage', ScheduledMessageSchema);

// ─── Public API ───────────────────────────────────────────────────────────────

/** Upsert user profile when they connect to WhatsApp. */
async function upsertUser(sessionId, phoneNumber, name) {
  try {
    return await User.findOneAndUpdate(
      { sessionId },
      { name, phoneNumber, sessionId },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error(`[DB] Error upserting user for session ${sessionId}:`, err.message);
    throw err;
  }
}

/** Insert a new scheduled message. */
async function insertMessage(sessionId, recipientNumber, messageText, scheduleTime, recipientName = null) {
  const user = await User.findOne({ sessionId });
  const msg = new ScheduledMessage({
    sessionId,
    userId: user ? user._id : null,
    recipientName,
    recipientNumber,
    messageText,
    scheduleTime: new Date(scheduleTime),
    status: 'pending'
  });
  const saved = await msg.save();
  return saved._id.toString();
}

/** All messages for a specific session ordered by scheduleTime. */
async function getAllMessages(sessionId) {
  const raw = await ScheduledMessage.find({ sessionId }).sort({ scheduleTime: 1 });
  return raw.map(msg => ({
    id: msg._id.toString(),
    phone: msg.recipientNumber,
    recipient_name: msg.recipientName,
    message: msg.messageText,
    scheduled_at: msg.scheduleTime.toISOString(),
    status: msg.status,
    error: msg.error
  }));
}

/** All pending messages across all sessions whose scheduleTime has arrived. */
async function getPendingDueMessages() {
  const now = new Date();
  return await ScheduledMessage.find({
    status: 'pending',
    scheduleTime: { $lte: now }
  });
}

/** Update status and optional error for a message. */
async function updateMessageStatus(id, status, error = null) {
  return await ScheduledMessage.findByIdAndUpdate(
    id,
    { status, error },
    { new: true }
  );
}

/** Delete a message record by sessionId and id (for API validation). */
async function deleteMessage(sessionId, id) {
  const result = await ScheduledMessage.deleteOne({ _id: id, sessionId });
  return result.deletedCount > 0;
}

/** Delete a message record by ID directly (for scheduler). */
async function deleteMessageById(id) {
  const result = await ScheduledMessage.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

/** Cancel a pending message. Returns boolean. */
async function cancelMessage(sessionId, id) {
  const result = await ScheduledMessage.findOneAndUpdate(
    { _id: id, sessionId, status: 'pending' },
    { status: 'cancelled' },
    { new: true }
  );
  return !!result;
}

/** Dummy contact persistence methods - contacts are kept in-memory to maintain privacy */
async function upsertContacts(senderPhone, contacts) {
  return 0;
}

async function getAllContacts(senderPhone) {
  return [];
}

async function searchContacts(senderPhone, query, limit = 10) {
  return [];
}

async function getContactByPhone(senderPhone, phone) {
  return null;
}

async function resetContacts(phone) {
  // no-op
}

async function markMessageSubmitted(senderPhone, id, waMessageId) {
  return await ScheduledMessage.findByIdAndUpdate(
    id,
    { status: 'submitted', waMessageId },
    { new: true }
  );
}

async function updateMessageStatusByWhatsAppId(senderPhone, waMessageId, status) {
  const result = await ScheduledMessage.updateMany(
    { waMessageId },
    { status }
  );
  return result.modifiedCount;
}

function toSqliteUtc(dateInput) {
  const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  return d.toISOString();
}

module.exports = {
  upsertUser,
  insertMessage,
  getAllMessages,
  getPendingDueMessages,
  updateMessageStatus,
  deleteMessage,
  deleteMessageById,
  cancelMessage,
  upsertContacts,
  getAllContacts,
  searchContacts,
  getContactByPhone,
  resetContacts,
  markMessageSubmitted,
  updateMessageStatusByWhatsAppId,
  toSqliteUtc,
};
