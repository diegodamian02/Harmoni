const User = require('../models/User');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-accessToken -refreshToken -passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.completeProfile = async (req, res) => {
  try {
    const { name, age, gender, bio } = req.body;
    const files = req.files || [];

    if (!name || !age || !gender) {
      return res.status(400).json({ error: 'Name, age, and gender are required' });
    }

    const photoUrls = files.map((f) => f.path);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        displayName: name,
        age: Number(age),
        gender,
        bio: bio || '',
        photos: photoUrls,
        profilePicture: photoUrls[0] || req.user.profilePicture,
        profileComplete: true,
      },
      { new: true }
    ).select('-accessToken -refreshToken -passwordHash');

    res.json({ user });
  } catch (err) {
    console.error('Profile completion error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.saveBasicInfo = async (req, res) => {
  const { name, birthday, gender, interestedIn, phone } = req.body;

  if (!name || !birthday || !gender || !interestedIn) {
    return res.status(400).json({ error: 'Name, birthday, gender, and interest are required' });
  }

  const age = Math.floor((Date.now() - new Date(birthday)) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) return res.status(400).json({ error: 'You must be 18 or older to use Harmoni' });

  try {
    console.log('[basicInfo] saving for user', req.user._id);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { displayName: name.trim(), birthday: new Date(birthday), age, gender, interestedIn, phone: phone || null },
      { new: true }
    ).select('-passwordHash');
    console.log('[basicInfo] saved OK');
    res.json({ user });
  } catch (err) {
    console.error('[basicInfo] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// TODO: remove before launch — temporary endpoint that marks profile complete
// so the swipe screen is reachable while music + photo onboarding is being built
exports.markProfileComplete = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileComplete: true },
      { new: true }
    ).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    console.error('[markComplete] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.saveMusicGenres = async (req, res) => {
  const { genres } = req.body;
  if (!Array.isArray(genres) || genres.length !== 3) {
    return res.status(400).json({ error: 'Exactly 3 genres required' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'musicProfile.genres': genres },
      { new: true }
    ).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    console.error('[saveMusicGenres] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSpotifyData = async (req, res) => {
  const { topArtists, topTracks, topGenres } = req.body;
  try {
    const updates = {};
    if (topArtists) updates.topArtistNames = topArtists;
    if (topTracks) updates.topTrackNames = topTracks;
    if (topGenres) updates.topGenres = topGenres;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-accessToken -refreshToken -passwordHash');
    res.json({ user });
  } catch (err) {
    console.error('Spotify data update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
