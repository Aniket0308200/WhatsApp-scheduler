/**
 * scheduler.js — Cron-based message dispatcher (Multi-User support)
 *
 * Runs every minute. Scans data/ for all scheduler_*.db database files,
 * queries pending due messages for each user, and attempts delivery via Baileys.
 */

const cron     = require('node-cron');
const fs       = require('fs');
const path     = require('path');
const db       = require('./db');
const whatsapp = require('./whatsapp');

let isRunning = false;

async function processDueMessagesForPhone(phone) {
  try {
    const due = await db.getPendingDueMessages(phone);

    if (due.length === 0) {
      return;
    }

    console.log(`[Scheduler] [${phone}] ── Processing ${due.length} due message(s) ──`);
    const session = whatsapp.getSessionByPhone(phone);
    const isConnected = session && session.status === 'connected';

    await Promise.allSettled(
      due.map(async (msg) => {
        console.log(`[Scheduler] [${phone}] Attempting #${msg.id} → +${msg.phone} (scheduled: ${msg.scheduled_at})`);

        if (!isConnected) {
          const errMsg = `WhatsApp not connected for +${phone} (status: ${session ? session.status : 'disconnected'})`;
          console.error(`[Scheduler] [${phone}] ✗ #${msg.id}: ${errMsg}`);
          await db.updateMessageStatus(phone, msg.id, 'failed', errMsg);
          return;
        }

        try {
          const result = await whatsapp.sendMessage(session.sessionId, msg.phone, msg.message);
          await db.markMessageSubmitted(phone, msg.id, result.id);
          console.log(`[Scheduler] [${phone}] ✓ #${msg.id} sent to +${msg.phone}`);
        } catch (err) {
          const errMsg = err?.message || String(err) || 'Unknown send error';
          console.error(`[Scheduler] [${phone}] ✗ #${msg.id} FAILED: ${errMsg}`);
          await db.updateMessageStatus(phone, msg.id, 'failed', errMsg);
        }
      })
    );
  } catch (err) {
    console.error(`[Scheduler] [${phone}] Error processing messages:`, err?.message || err);
  }
}

async function processAllDueMessages() {
  if (isRunning) {
    console.log('[Scheduler] Previous run still in progress — skipping tick.');
    return;
  }
  isRunning = true;

  try {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      isRunning = false;
      return;
    }

    const files = fs.readdirSync(dataDir);
    const dbFiles = files.filter(f => f.startsWith('scheduler_') && f.endsWith('.db'));

    if (dbFiles.length === 0) {
      return;
    }

    for (const file of dbFiles) {
      // scheduler_918000000000.db -> phone is 918000000000
      const phone = file.replace('scheduler_', '').replace('.db', '');
      if (phone) {
        await processDueMessagesForPhone(phone);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Unexpected top-level error:', err?.message || err);
  } finally {
    isRunning = false;
  }
}

function startScheduler() {
  // Fire every minute at :00 seconds
  cron.schedule('* * * * *', async () => {
    const now = new Date().toISOString();
    console.log(`[Scheduler] ── Tick at ${now} ──`);
    await processAllDueMessages();
  });

  console.log('[Scheduler] Started — checking every minute.');
}

module.exports = { startScheduler, processAllDueMessages };
