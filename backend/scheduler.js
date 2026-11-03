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
          let lastResult = null;

          // Personalize smart name variables ({Name}, {FirstName})
          const recipientDisplayName = (msg.recipient_name && !msg.recipient_name.includes('@')) ? msg.recipient_name : '';
          const personalizedText = (msg.message || '')
            .replace(/\{Name\}/gi, recipientDisplayName || '')
            .replace(/\{FirstName\}/gi, recipientDisplayName ? recipientDisplayName.split(' ')[0] : '');

          if (msg.mediaList && Array.isArray(msg.mediaList) && msg.mediaList.length > 0) {
            console.log(`[Scheduler] [${sessionId}] Sending batch of ${msg.mediaList.length} media items to ${msg.phone}`);
            for (let i = 0; i < msg.mediaList.length; i++) {
              const item = msg.mediaList[i];
              // First item carries the text caption; subsequent items send clean media
              const caption = i === 0 ? personalizedText : '';

              const sendPromise = whatsapp.sendMessage(
                sessionId,
                msg.phone,
                caption,
                item.type,
                item.data,
                item.name
              );
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Media item #${i + 1} (${item.type}) timed out after 30s`)), 30_000)
              );

              lastResult = await Promise.race([sendPromise, timeoutPromise]);

              // Small delay between items to ensure order & avoid socket congestion
              if (i < msg.mediaList.length - 1) {
                await new Promise(r => setTimeout(r, 800));
              }
            }
          } else {
            // Single media or pure text message
            const sendPromise = whatsapp.sendMessage(
              sessionId,
              msg.phone,
              personalizedText,
              msg.mediaType,
              msg.mediaData,
              msg.mediaName
            );
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('WhatsApp message delivery timed out after 30s')), 30_000)
            );

            lastResult = await Promise.race([sendPromise, timeoutPromise]);
          }

          const waId = lastResult?.id || lastResult?.key?.id || null;
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

  // 2-Day Data Cleanup Cron: Runs on startup and every 1 hour
  // Purges heavy raw media payloads older than 48 hours for sent messages
  if (typeof db.purgeOldMediaData === 'function') {
    db.purgeOldMediaData();
    setInterval(() => {
      db.purgeOldMediaData();
    }, 60 * 60 * 1000); // every 1 hour
  }

  // Also run immediately on startup
  processAllDueMessages();

  console.log('[Scheduler] Started — high-precision check active every 5 seconds.');
}

module.exports = { startScheduler, processAllDueMessages };
