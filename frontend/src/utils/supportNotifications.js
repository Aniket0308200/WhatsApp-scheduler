const STORAGE_KEY = 'wa_seen_admin_replies';

/**
 * Get all previously seen admin reply identifier keys from localStorage
 */
export function getSeenReplyKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Calculate how many admin replies in personal feedback list have not yet been viewed by the user
 */
export function computeUnreadReplyCount(personalFeedbacks) {
  if (!Array.isArray(personalFeedbacks) || personalFeedbacks.length === 0) return 0;
  const seenKeys = new Set(getSeenReplyKeys());
  let count = 0;
  for (const item of personalFeedbacks) {
    if (Array.isArray(item.adminReplies) && item.adminReplies.length > 0) {
      item.adminReplies.forEach((r, idx) => {
        const text = (r?.text || r || '').trim();
        if (text) {
          const key = `${item._id}_rep_${idx}_${text}`;
          if (!seenKeys.has(key)) count++;
        }
      });
    } else if (item.adminReply && item.adminReply.trim()) {
      const key = `${item._id}_${item.adminReply.trim()}`;
      if (!seenKeys.has(key)) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Mark all current admin replies in personal feedback list as seen
 */
export function markPersonalRepliesAsSeen(personalFeedbacks) {
  if (!Array.isArray(personalFeedbacks) || personalFeedbacks.length === 0) return;
  try {
    const seenKeys = new Set(getSeenReplyKeys());
    let hasChanges = false;
    for (const item of personalFeedbacks) {
      if (Array.isArray(item.adminReplies) && item.adminReplies.length > 0) {
        item.adminReplies.forEach((r, idx) => {
          const text = (r?.text || r || '').trim();
          if (text) {
            const key = `${item._id}_rep_${idx}_${text}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              hasChanges = true;
            }
          }
        });
      } else if (item.adminReply && item.adminReply.trim()) {
        const key = `${item._id}_${item.adminReply.trim()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          hasChanges = true;
        }
      }
    }
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(seenKeys)));
      window.dispatchEvent(new Event('wa_support_replies_updated'));
    }
  } catch (err) {
    console.error('Failed to mark replies as seen:', err);
  }
}
