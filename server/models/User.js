const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Identity
  spotifyId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, select: false },
  profilePicture: { type: String },

  // Profile completion
  profileComplete: { type: Boolean, default: false },
  age: { type: Number },
  gender: { type: String },
  bio: { type: String, default: '' },
  photos: [{ type: String }],

  // Location (GeoJSON Point for $near queries)
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },

  // Spotify OAuth tokens
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiresAt: { type: Date },
  scopes: { type: [String] },

  // Spotify taste data
  topArtistNames: { type: [String], default: [] },
  topArtistIds: { type: [String], default: [] },
  topTrackNames: { type: [String], default: [] },
  topGenres: { type: [String], default: [] },

  // Matching
  likedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  swipedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
