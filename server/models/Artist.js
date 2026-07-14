'use strict';

const mongoose = require('mongoose');

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const similarSchema = new mongoose.Schema({
  mbid:           { type: String, default: null },
  name:           { type: String, required: true },
  normalizedName: { type: String, required: true },
  match:          { type: Number, required: true },
}, { _id: false });

const topTrackSchema = new mongoose.Schema({
  itunesId:   { type: String, required: true },
  name:       { type: String, required: true },
  previewUrl: { type: String, default: null },
  artworkUrl: { type: String, default: null },
}, { _id: false });

const artistSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  normalizedName: { type: String, required: true },
  mbid:           { type: String, default: null },
  itunesId:       { type: String, required: true, unique: true },
  genres:         [{ type: String }],
  listeners:      { type: Number, default: null },  // Last.fm listener count
  similar:        [similarSchema],
  topTracks:      [topTrackSchema],
  fetchedAt:      { type: Date, default: Date.now },
}, { suppressReservedKeysWarning: true });

artistSchema.index({ normalizedName: 1 });
artistSchema.index({ mbid: 1 }, { sparse: true });
artistSchema.statics.normalizeName = normalizeName;

module.exports = mongoose.model('Artist', artistSchema);
