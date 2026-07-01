// server/utils/spotifyPassport.js
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const User = require('../models/User');

// Sessions disabled — using JWT. These are no-ops kept for passport-spotify compatibility.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

passport.use(new SpotifyStrategy(
    {
        clientID: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        callbackURL: process.env.SPOTIFY_CALLBACK_URL
    },
    async (accessToken, refreshToken, expires_in, profile, done) => {
        try {
            let user = await User.findOne({ spotifyId: profile.id });

            if (!user) {
                user = new User({
                    spotifyId: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails ? profile.emails[0].value : '',
                    profilePicture: profile.photos ? profile.photos[0] : null,
                    accessToken: accessToken,
                    refreshToken: refreshToken, // Ensure this is set
                    tokenExpiresAt: new Date(Date.now() + expires_in * 1000) // Set token expiry
                });
            } else {
                // Update tokens when user logs in again
                user.accessToken = accessToken;
                user.refreshToken = refreshToken || user.refreshToken; // Keep the old refreshToken if not provided
                user.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
            }

            await user.save();
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));
