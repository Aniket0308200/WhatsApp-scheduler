/**
 * db.js — SQLite database via sql.js (pure JS, no native compilation needed)
 *
 * Isolated per connected user (sender phone number).
 */

const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Map of active SQLite databases: phone (digits) -> SQL.Database instance
const dbs = new Map();

// ─── Convert any date input to "YYYY-MM-DD HH:MM:SS" UTC string ──────────────
function toSqliteUtc(dateInput) {
  const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}

// ─── Ensure User DB is ready ──────────────────────────────────────────────────
async function getDb(phone) {
  if (!phone) {
    throw new Error('[DB] Phone number is required to access database.');
  }

  const cleaned = String(phone).replace(/\D/g, '');
  if (dbs.has(cleaned)) {
    return dbs.get(cleaned);
  }

  const SQL = await initSqlJs();
  const dbFile = path.join(dataDir, `scheduler_${cleaned}.db`);
  let dbInstance = null;

  if (fs.existsSync(dbFile)) {
    dbInstance = new SQL.Database(fs.readFileSync(dbFile));
  } else {
    // Migration: If old scheduler.db exists, rename/migrate it to the phone-specific db
    const oldDbFile = path.join(dataDir, 'scheduler.db');
    if (fs.existsSync(oldDbFile)) {
      console.log(`[DB] Migrating old global database scheduler.db to user-specific scheduler_${cleaned}.db`);
      try {
        fs.renameSync(oldDbFile, dbFile);
        dbInstance = new SQL.Database(fs.readFileSync(dbFile));
      } catch (err) {
        console.error('[DB] Migration failed, creating fresh database:', err.message);
        dbInstance = new SQL.Database();
      }
    } else {
      dbInstance = new SQL.Database();
    }
  }

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS scheduled_messages (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      phone          TEXT NOT NULL,
      recipient_name TEXT,                              -- WhatsApp display name at schedule time
      message        TEXT NOT NULL,
      scheduled_at   TEXT NOT NULL,   -- "YYYY-MM-DD HH:MM:SS" UTC
      status         TEXT NOT NULL DEFAULT 'pending',
      error          TEXT,
      wa_message_id  TEXT,
      created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
    );
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      phone      TEXT PRIMARY KEY,
      jid        TEXT,
      name       TEXT,
      source     TEXT NOT NULL DEFAULT 'whatsapp',
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
    );
  `);

  // Column migrations if necessary
  try { dbInstance.run(`ALTER TABLE scheduled_messages ADD COLUMN recipient_name TEXT`); } catch (_) {}
  try { dbInstance.run(`ALTER TABLE scheduled_messages ADD COLUMN wa_message_id TEXT`); } catch (_) {}

  dbs.set(cleaned, dbInstance);
  persist(cleaned);
  return dbInstance;
}

function persist(phone) {
  const cleaned = String(phone).replace(/\D/g, '');
  const dbInstance = dbs.get(cleaned);
  if (!dbInstance) return;
  const dbFile = path.join(dataDir, `scheduler_${cleaned}.db`);
  fs.writeFileSync(dbFile, Buffer.from(dbInstance.export()));
}

function runAndPersist(phone, sql, params = {}) {
  const cleaned = String(phone).replace(/\D/g, '');
  const dbInstance = dbs.get(cleaned);
  if (dbInstance) {
    dbInstance.run(sql, params);
    persist(cleaned);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Insert a new scheduled message. Returns the new row id. */
async function insertMessage(senderPhone, phone, message, scheduledAt, recipientName = null) {
  const dbInstance = await getDb(senderPhone);
  const sqliteTime = toSqliteUtc(scheduledAt);

  console.log(`[DB] [${senderPhone}] Inserting message for ${phone} (${recipientName || 'unknown'}) at ${sqliteTime} (UTC)`);

  runAndPersist(
    senderPhone,
    `INSERT INTO scheduled_messages (phone, recipient_name, message, scheduled_at)
     VALUES (:phone, :recipientName, :message, :scheduledAt)`,
    { ':phone': phone, ':recipientName': recipientName, ':message': message, ':scheduledAt': sqliteTime }
  );

  const res = dbInstance.exec('SELECT last_insert_rowid() AS id');
  return res[0].values[0][0];
}

/** All messages ordered by scheduled_at. */
async function getAllMessages(senderPhone) {
  const dbInstance = await getDb(senderPhone);
  return sqlResultToObjects(
    dbInstance.exec('SELECT * FROM scheduled_messages ORDER BY scheduled_at ASC')
  );
}

/** All pending messages whose scheduled_at has arrived (UTC comparison). */
async function getPendingDueMessages(senderPhone) {
  const dbInstance = await getDb(senderPhone);
  const nowUtc = toSqliteUtc(new Date());
  console.log(`[DB] [${senderPhone}] Checking due messages. Server UTC now: ${nowUtc}`);

  const res = dbInstance.exec(
    `SELECT * FROM scheduled_messages
     WHERE status = 'pending'
       AND scheduled_at <= strftime('%Y-%m-%d %H:%M:%S', 'now')`
  );

  const rows = sqlResultToObjects(res);
  if (rows.length > 0) {
    console.log(`[DB] [${senderPhone}] Found ${rows.length} due message(s):`, rows.map(r => `#${r.id} at ${r.scheduled_at}`));
  }
  return rows;
}

/** Update status and optional error for a message. */
async function updateMessageStatus(senderPhone, id, status, error = null) {
  await getDb(senderPhone);
  runAndPersist(
    senderPhone,
    `UPDATE scheduled_messages SET status = :status, error = :error WHERE id = :id`,
    { ':status': status, ':error': error, ':id': id }
  );
  console.log(`[DB] [${senderPhone}] Message #${id} status → ${status}${error ? ` (${error})` : ''}`);
}

/** Upsert WhatsApp contacts discovered from history, contact events, or live messages. */
async function upsertContacts(senderPhone, contacts) {
  const dbInstance = await getDb(senderPhone);
  let changed = 0;
  for (const contact of contacts || []) {
    const phone = String(contact.phone || '').replace(/\D/g, '');
    const name = typeof contact.name === 'string' ? contact.name.trim().slice(0, 100) : '';
    if (phone.length < 7) continue;

    dbInstance.run(
      `INSERT INTO contacts (phone, jid, name, source, updated_at)
       VALUES (:phone, :jid, :name, :source, strftime('%Y-%m-%d %H:%M:%S', 'now'))
       ON CONFLICT(phone) DO UPDATE SET
         jid = COALESCE(excluded.jid, contacts.jid),
         name = CASE WHEN excluded.name <> '' THEN excluded.name ELSE contacts.name END,
         source = excluded.source,
         updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now')`,
      { ':phone': phone, ':jid': contact.jid || null, ':name': name, ':source': contact.source || 'whatsapp' }
    );
    changed += dbInstance.getRowsModified();
  }
  if (changed) persist(senderPhone);
  return changed;
}

async function getAllContacts(senderPhone) {
  const dbInstance = await getDb(senderPhone);
  return sqlResultToObjects(dbInstance.exec(
    `SELECT phone, jid, name, source, updated_at FROM contacts
     ORDER BY CASE WHEN name IS NOT NULL AND trim(name) <> '' THEN 0 ELSE 1 END, name COLLATE NOCASE ASC, phone ASC`
  ));
}

async function searchContacts(senderPhone, query, limit = 10) {
  const dbInstance = await getDb(senderPhone);
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, '');
  const likeName = `%${q.replace(/[%_]/g, '\\$&')}%`;
  const likePhone = `%${digits}%`;
  const stmt = dbInstance.prepare(
    `SELECT phone, jid, name FROM contacts
     WHERE lower(name) LIKE :likeName ESCAPE '\\'
        OR (:digits <> '' AND phone LIKE :likePhone)
     ORDER BY name COLLATE NOCASE ASC LIMIT :limit`
  );
  stmt.bind({ ':likeName': likeName, ':digits': digits, ':likePhone': likePhone, ':limit': limit });
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

async function getContactByPhone(senderPhone, phone) {
  const dbInstance = await getDb(senderPhone);
  const cleaned = String(phone || '').replace(/\D/g, '');
  const stmt = dbInstance.prepare('SELECT phone, jid, name FROM contacts WHERE phone = :phone LIMIT 1');
  stmt.bind({ ':phone': cleaned });
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

async function markMessageSubmitted(senderPhone, id, waMessageId) {
  await getDb(senderPhone);
  runAndPersist(
    senderPhone,
    `UPDATE scheduled_messages SET status = 'submitted', error = NULL, wa_message_id = :waMessageId WHERE id = :id`,
    { ':id': id, ':waMessageId': waMessageId }
  );
}

async function updateMessageStatusByWhatsAppId(senderPhone, waMessageId, status) {
  const dbInstance = await getDb(senderPhone);
  const permitted = status === 'read' ? "status IN ('submitted', 'delivered', 'read')" : "status = 'submitted'";
  runAndPersist(
    senderPhone,
    `UPDATE scheduled_messages SET status = :status WHERE wa_message_id = :waMessageId AND ${permitted}`,
    { ':status': status, ':waMessageId': waMessageId }
  );
  return dbInstance.getRowsModified();
}

/** Cancel a pending message. Returns number of rows changed. */
async function cancelMessage(senderPhone, id) {
  const dbInstance = await getDb(senderPhone);
  dbInstance.run(
    `UPDATE scheduled_messages SET status = 'cancelled'
     WHERE id = :id AND status = 'pending'`,
    { ':id': id }
  );
  const changes = dbInstance.getRowsModified();
  persist(senderPhone);
  return changes;
}

/** Hard-delete a message record. */
async function deleteMessage(senderPhone, id) {
  await getDb(senderPhone);
  runAndPersist(
    senderPhone,
    `DELETE FROM scheduled_messages WHERE id = :id`,
    { ':id': id }
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function sqlResultToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

async function resetContacts(phone) {
  const dbInstance = await getDb(phone);
  dbInstance.run('DELETE FROM contacts');
  persist(phone);
}

module.exports = {
  getDb,
  insertMessage,
  getAllMessages,
  upsertContacts,
  getAllContacts,
  searchContacts,
  getContactByPhone,
  getPendingDueMessages,
  updateMessageStatus,
  markMessageSubmitted,
  updateMessageStatusByWhatsAppId,
  cancelMessage,
  deleteMessage,
  toSqliteUtc,
  resetContacts,
};
