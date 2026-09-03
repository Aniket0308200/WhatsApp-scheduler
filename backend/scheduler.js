/**
 * scheduler.js — Cron-based message dispatcher (Multi-User support via MongoDB)
 *
 * Runs every minute. Queries pending due messages from MongoDB,
 * and attempts delivery via Baileys.
 */

const cron     = require('node-cron');
const db       = require('./db');
const whatsapp = require('./whatsapp');

let isRunning = false;

async function processAllDueMessages() {
  if (isRunning) {
    console.log('[Scheduler] Previous run still in progress — skipping tick.');
    return;
  }
  isRunning = true;

  try {
    const due = await db.getPendingDueMessages();

    if (due.length === 0) {
      isRunning = false;
      return;
    }

    console.log(`[Scheduler] ── Processing ${due.length} due message(s) ──`);

    await Promise.allSettled(
      due.map(async (msg) => {
        const sessionId = msg.sessionId;
        const activeSessions = whatsapp.getAllActiveSessions();
        const sessionInfo = activeSessions.find(s => s.sessionId === sessionId);
        const isConnected = sessionInfo && sessionInfo.status === 'connected';

        console.log(`[Scheduler] [${sessionId}] Attempting #${msg.id} → +${msg.phone} (scheduled: ${msg.scheduled_at})`);

        if (!isConnected) {
          const errMsg = `WhatsApp not connected (status: ${sessionInfo ? sessionInfo.status : 'disconnected'})`;
          console.error(`[Scheduler] [${sessionId}] ✗ #${msg.id}: ${errMsg}`);
          await db.updateMessageStatus(sessionId, msg.id, 'failed', errMsg);
          return;
        }

        try {
          const result = await whatsapp.sendMessage(sessionId, msg.phone, msg.message);
          // Set status to 'sent' and save waMessageId
          await db.updateMessageStatus(sessionId, msg.id, 'sent');
          await db.ScheduledMessage.updateOne(
            { _id: msg.id },
            { $set: { waMessageId: result.id } }
          );
          console.log(`[Scheduler] [${sessionId}] ✓ #${msg.id} sent to +${msg.phone}`);
        } catch (err) {
          const errMsg = err?.message || String(err) || 'Unknown send error';
          console.error(`[Scheduler] [${sessionId}] ✗ #${msg.id} FAILED: ${errMsg}`);
          await db.updateMessageStatus(sessionId, msg.id, 'failed', errMsg);
        }
      })
    );
  } catch (err) {
    console.error('[Scheduler] Error processing due messages:', err?.message || err);
  } finally {
    isRunning = false;
  }
}

function startScheduler() {
  // Fire high-precision check every 5 seconds
  setInterval(async () => {
    await processAllDueMessages();
  }, 5_000);

  // Also run immediately on startup
  processAllDueMessages();

  console.log('[Scheduler] Started — high-precision check active every 5 seconds.');
}

module.exports = { startScheduler, processAllDueMessages };
