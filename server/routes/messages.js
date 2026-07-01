const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { ensureAuth } = require('../utils/authMiddleware');

// GET conversation thread with another user
router.get('/:userId', ensureAuth, async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
      ],
    }).sort({ createdAt: 1 }).limit(100);

    await Message.updateMany(
      { senderId: userId, receiverId: req.user._id, read: false },
      { read: true }
    );

    res.json({ messages });
  } catch (err) {
    console.error('Messages fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST send a message (REST fallback — real-time goes via Socket.io)
router.post('/:userId', ensureAuth, async (req, res) => {
  const { userId } = req.params;
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Message text required' });

  try {
    const msg = await Message.create({
      senderId: req.user._id,
      receiverId: userId,
      text: text.trim(),
    });
    res.status(201).json(msg);
  } catch (err) {
    console.error('Message send error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
