const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  itunesId:   { type: String, required: true },
  name:       { type: String, required: true },
  previewUrl: { type: String, default: null },
  artworkUrl: { type: String },
  artistRank: { type: Number, min: 1, max: 4 },
}, { _id: false });

const artistRefSchema = new mongoose.Schema({
  artistRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
  rank:      { type: Number, required: true, min: 1, max: 4 },
}, { _id: false });

const musicProfileSchema = new mongoose.Schema({
  genres:          { type: [String], default: [] },
  artists:         { type: [artistRefSchema], default: [] },
  tracks:          { type: [trackSchema], default: [] },
  lastfmUsername:  { type: String, default: null },
  profileReady:    { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
  displayName:     { type: String, required: true },
  email:           { type: String, unique: true, sparse: true },
  passwordHash:    { type: String, select: false },
  profilePicture:  { type: String },

  profileComplete: { type: Boolean, default: false },
  age:             { type: Number },
  gender:          { type: String },
  bio:             { type: String, default: '' },
  photos:          [{ type: String }],

  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },

  musicProfile: { type: musicProfileSchema, default: () => ({}) },

  likedUsers:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  swipedUsers:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mutualMatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.index({ location: '2dsphere' });
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
