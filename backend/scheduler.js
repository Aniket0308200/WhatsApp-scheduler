/**
 * scheduler.js — Cron-based message dispatcher (MongoDB support)
 *
 * Runs every minute. Queries all pending due messages across all sessions
 * from MongoDB Atlas and attempts delivery via Baileys.
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
    // Fetch all pending due messages across all sessions in a single query
    const due = await db.getPendingDueMessages();

    if (due.length === 0) {
      return;
    }

    console.log(`[Scheduler] ── Processing ${due.length} due message(s) ──`);

    await Promise.allSettled(
      due.map(async (msg) => {
        const phone = msg.recipientNumber;
        const sessionId = msg.sessionId;
        const msgId = msg._id;

        console.log(`[Scheduler] [Session: ${sessionId}] Attempting #${msgId} → +${phone}`);

        const sessionStatus = whatsapp.getStatus(sessionId);
        const isConnected = sessionStatus === 'connected';

        if (!isConnected) {
          const errMsg = `WhatsApp not connected for session ${sessionId} (status: ${sessionStatus})`;
          console.error(`[Scheduler] [Session: ${sessionId}] ✗ #${msgId}: ${errMsg}`);
          await db.updateMessageStatus(msgId, 'failed', errMsg);
          return;
        }

        try {
          // Send message
          await whatsapp.sendMessage(sessionId, phone, msg.messageText);
          
          // Delete scheduled messages from MongoDB upon successful dispatch to maintain end-to-end privacy
          await db.deleteMessageById(msgId);
          console.log(`[Scheduler] [Session: ${sessionId}] ✓ #${msgId} sent to +${phone} and deleted from MongoDB`);
        } catch (err) {
          const errMsg = err?.message || String(err) || 'Unknown send error';
          console.error(`[Scheduler] [Session: ${sessionId}] ✗ #${msgId} FAILED: ${errMsg}`);
          await db.updateMessageStatus(msgId, 'failed', errMsg);
        }
      })
    );
  } catch (err) {
    console.error('[Scheduler] Unexpected top-level error during message processing:', err?.message || err);
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

  console.log('[Scheduler] Started — checking MongoDB every minute.');
}

module.exports = { startScheduler, processAllDueMessages };
