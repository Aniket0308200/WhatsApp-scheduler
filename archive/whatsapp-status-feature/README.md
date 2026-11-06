# Archived Feature: WhatsApp Status (Story) Scheduler

This folder contains the complete, battle-tested code for the **WhatsApp Status (Story) Creator & Scheduler**.

## Why this feature was archived:
- Meta's official WhatsApp Web / Multi-Device companion protocol has an architectural restriction: statuses posted via companion sockets (`status@broadcast`) are accepted by WhatsApp servers, but Meta **does NOT synchronize companion-posted statuses back to the user's primary mobile phone app** ("My Status" circle).
- Furthermore, distribution to contacts often gets silently filtered out by WhatsApp server privacy rules if mutual contacts are not pre-synced.
- To keep WA Scheduler 100% reliable, production-ready, and confusion-free for users, the Status feature was cleanly detached from the active app until Meta/WhatsApp officially supports companion story synchronization.

## How to restore this feature in the future:
1. Move `StatusEditorModal.jsx` back to `frontend/src/components/StatusEditorModal.jsx`.
2. In `frontend/src/components/SchedulerForm.jsx`:
   - Import `StatusEditorModal`.
   - Restore `showStatusModal` and `attachedStatus` state hooks.
   - Re-enable the "Create WhatsApp Status" button and preview card.
3. The backend already supports `status@broadcast` handling in `backend/whatsapp.js` and `backend/server.js`.
