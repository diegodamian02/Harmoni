const User = require('../models/User');

function computeScore(currentUser, candidate) {
  let score = 0;

  const myArtists = currentUser.topArtistNames || [];
  const theirArtists = candidate.topArtistNames || [];
  const myTracks = currentUser.topTrackNames || [];
  const theirTracks = candidate.topTrackNames || [];
  const myGenres = currentUser.topGenres || [];
  const theirGenres = candidate.topGenres || [];

  // Artists: higher weight for early-list matches (rank #1 = 10pts, #2 = 9pts, etc.)
  myArtists.forEach((artist, myRank) => {
    const theirRank = theirArtists.indexOf(artist);
    if (theirRank !== -1) {
      const rankBonus = Math.max(0, 10 - myRank) + Math.max(0, 10 - theirRank);
      score += rankBonus;
    }
  });

  // Tracks: similar rank-weighted scoring, slightly lower base
  myTracks.forEach((track, myRank) => {
    const theirRank = theirTracks.indexOf(track);
    if (theirRank !== -1) {
      const rankBonus = Math.max(0, 8 - myRank) + Math.max(0, 8 - theirRank);
      score += rankBonus;
    }
  });

  // Genres: flat 3pts per shared genre
  const commonGenres = myGenres.filter((g) => theirGenres.includes(g));
  score += commonGenres.length * 3;

  return score;
}

exports.getMatches = async (req, res) => {
  try {
    const already = [
      req.user._id,
      ...(req.user.swipedUsers || []),
    ];

    const candidates = await User.find({
      _id: { $nin: already },
      profileComplete: true,
    }).select('-accessToken -refreshToken -passwordHash').limit(50);

    const scored = candidates
      .map((c) => ({ user: c, similarityScore: computeScore(req.user, c) }))
      .sort((a, b) => b.similarityScore - a.similarityScore);

    res.json({ matches: scored });
  } catch (err) {
    console.error('Get matches error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMutualMatches = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('mutualMatches', 'displayName profilePicture photos topArtistNames age');
    res.json({ matches: user.mutualMatches });
  } catch (err) {
    console.error('Mutual matches error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.recordSwipe = async (req, res) => {
  const { targetUserId, action } = req.body;
  if (!targetUserId || !['like', 'dislike'].includes(action)) {
    return res.status(400).json({ error: 'targetUserId and action (like|dislike) required' });
  }

  try {
    const currentUser = req.user;

    if (!currentUser.swipedUsers.includes(targetUserId)) {
      currentUser.swipedUsers.push(targetUserId);
    }

    let mutualMatch = false;

    if (action === 'like') {
      if (!currentUser.likedUsers.includes(targetUserId)) {
        currentUser.likedUsers.push(targetUserId);
      }

      const target = await User.findById(targetUserId);
      if (target && target.likedUsers.includes(currentUser._id)) {
        mutualMatch = true;

        if (!currentUser.mutualMatches.includes(targetUserId)) {
          currentUser.mutualMatches.push(targetUserId);
        }
        if (!target.mutualMatches.includes(currentUser._id)) {
          target.mutualMatches.push(currentUser._id);
          await target.save();
        }
      }
    }

    await currentUser.save();
    res.json({ mutualMatch });
  } catch (err) {
    console.error('Swipe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
