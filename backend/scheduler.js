/**
 * scheduler.js — Cron-based message dispatcher (Multi-User support via MongoDB)
 *
 * Runs every 5 seconds. Queries pending due messages from MongoDB,
 * and attempts delivery via Baileys with safety timeouts and recovery guards.
 */

const db       = require('./db');
const whatsapp = require('./whatsapp');

let isRunning = false;
let lastRunStart = 0;

async function processAllDueMessages() {
  const now = Date.now();
  // Prevent parallel runs, but auto-recover after 45 seconds if a previous run hung
  if (isRunning && (now - lastRunStart < 45_000)) {
    console.log('[Scheduler] Previous run still in progress — skipping tick.');
    return;
  }
  isRunning = true;
  lastRunStart = now;

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
          // 30-second timeout per message send so socket deadlocks cannot freeze the scheduler
          const sendPromise = whatsapp.sendMessage(
            sessionId,
            msg.phone,
            msg.message,
            msg.mediaType,
            msg.mediaData,
            msg.mediaName
          );
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('WhatsApp message delivery timed out after 30s')), 30_000)
          );

          const result = await Promise.race([sendPromise, timeoutPromise]);
          const waId = result?.id || result?.key?.id || null;
          // Atomically mark as sent and store WhatsApp message id
          await db.ScheduledMessage.updateOne(
            { _id: msg.id },
            { $set: { status: 'sent', waMessageId: waId, error: null } }
          );
          console.log(`[Scheduler] [${sessionId}] ✓ #${msg.id} sent to +${msg.phone} (waId: ${waId})`);
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
