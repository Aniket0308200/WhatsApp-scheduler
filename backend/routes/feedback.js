const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/feedback
// Submit new feedback (public or personal)
router.post('/', async (req, res) => {
  const { message, type } = req.body;
  const sessionId = req.sessionId;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const feedbackType = type === 'personal' ? 'personal' : 'public';

  try {
    // Attempt to look up the connected User details from the DB
    const user = await db.User.findOne({ sessionId });
    
    const userId = sessionId;
    const userName = user?.name ? user.name : (user?.phoneNumber ? `+${user.phoneNumber}` : 'Guest User');

    const feedback = new db.Feedback({
      userId,
      userName,
      message: message.trim(),
      type: feedbackType,
      likes: []
    });

    await feedback.save();
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback/public
// Fetch all public feedbacks sorted by newest first
router.get('/public', async (req, res) => {
  try {
    const list = await db.Feedback.find({ type: 'public' }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, feedbacks: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback/personal
// Fetch logged-in user's personal messages and their corresponding admin replies
router.get('/personal', async (req, res) => {
  const sessionId = req.sessionId;
  try {
    const list = await db.Feedback.find({ userId: sessionId, type: 'personal' }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, feedbacks: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/feedback/:id/like
// Toggle like on a public feedback for the active user
router.post('/:id/like', async (req, res) => {
  const sessionId = req.sessionId;
  try {
    const feedback = await db.Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }

    const likeIndex = feedback.likes.indexOf(sessionId);
    if (likeIndex > -1) {
      feedback.likes.splice(likeIndex, 1); // Unlike
    } else {
      feedback.likes.push(sessionId); // Like
    }

    await feedback.save();
    res.json({ success: true, likes: feedback.likes, count: feedback.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/feedback/:id/admin-reply
// Allow admin role to attach/update adminReply
router.post('/:id/admin-reply', async (req, res) => {
  const { reply } = req.body;
  if (reply === undefined) {
    return res.status(400).json({ error: 'Reply content is required.' });
  }

  try {
    const feedback = await db.Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }

    feedback.adminReply = String(reply).trim();
    await feedback.save();

    res.json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
