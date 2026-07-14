const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  joinedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Waitlist', waitlistSchema);
