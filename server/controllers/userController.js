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
