'use strict';

const mongoose = require('mongoose');

const searchCacheSchema = new mongoose.Schema({
  query:     { type: String, required: true, unique: true },
  results:   { type: mongoose.Schema.Types.Mixed, required: true },
  fetchedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 }, // 7-day TTL
});

module.exports = mongoose.model('SearchCache', searchCacheSchema);
