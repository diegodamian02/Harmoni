require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DUMMY_PASSWORD = 'HarmoniTest2026!';

const users = [
  {
    displayName: 'Alex Rivera',
    email: 'alex@dummy.com',
    age: 24, gender: 'male',
    bio: 'indie rock and late nights',
    musicProfile: {
      genres: ['Indie Rock', 'Alternative', 'Folk'],
      tracks: [
        { itunesId: '1440742894', name: 'Wonderwall', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1440742895', name: 'Champagne Supernova', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1440742896', name: 'Hotline Bling', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1440742897', name: 'God\'s Plan', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1440742898', name: 'Creep', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1440742899', name: 'Karma Police', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1440742900', name: 'In My Life', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '1440742901', name: 'Let It Be', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Maya Chen',
    email: 'maya@dummy.com',
    age: 22, gender: 'female',
    bio: 'R&B and coffee shop vibes',
    musicProfile: {
      genres: ['R&B', 'Soul', 'Pop'],
      tracks: [
        { itunesId: '1500000001', name: 'Blinding Lights', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1500000002', name: 'Save Your Tears', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1500000003', name: 'Golden', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1500000004', name: 'Adore You', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1500000005', name: 'Watermelon Sugar', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1500000006', name: 'Treat People With Kindness', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1500000007', name: 'drivers license', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '1500000008', name: 'good 4 u', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Jordan Kim',
    email: 'jordan@dummy.com',
    age: 26, gender: 'non-binary',
    bio: 'hip-hop head, beatmaker on weekends',
    musicProfile: {
      genres: ['Hip-Hop', 'Rap', 'Trap'],
      tracks: [
        { itunesId: '1600000001', name: 'HUMBLE.', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1600000002', name: 'DNA.', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1600000003', name: 'Power', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1600000004', name: 'Stronger', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1600000005', name: 'Mask Off', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1600000006', name: 'Pick Up the Phone', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1600000007', name: 'XO Tour Llif3', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '1600000008', name: 'Bad and Boujee', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Sofia Martinez',
    email: 'sofia@dummy.com',
    age: 23, gender: 'female',
    bio: 'latin music & dancing every weekend',
    musicProfile: {
      genres: ['Latin Pop', 'Reggaeton', 'Pop'],
      tracks: [
        { itunesId: '1700000001', name: 'Despacito', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1700000002', name: 'Con Calma', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1700000003', name: 'Mi Gente', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1700000004', name: 'Hawái', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1700000005', name: 'Tusa', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1700000006', name: 'China', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1700000007', name: 'Malamente', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '1700000008', name: 'El Mal Querer', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Ethan Brooks',
    email: 'ethan@dummy.com',
    age: 27, gender: 'male',
    bio: 'electronic music producer',
    musicProfile: {
      genres: ['Electronic', 'House', 'Techno'],
      tracks: [
        { itunesId: '1800000001', name: 'One More Time', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1800000002', name: 'Get Lucky', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1800000003', name: 'Levels', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1800000004', name: 'Wake Me Up', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1800000005', name: 'Stay the Night', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1800000006', name: 'Beautiful Now', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1800000007', name: 'Animals', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '1800000008', name: 'Lean On', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Priya Nair',
    email: 'priya@dummy.com',
    age: 25, gender: 'female',
    bio: 'jazz and classical by day, indie by night',
    musicProfile: {
      genres: ['Jazz', 'Classical', 'Indie Rock'],
      tracks: [
        { itunesId: '1900000001', name: 'So What', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1900000002', name: 'Kind of Blue', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '1900000003', name: 'Neon Bible', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1900000004', name: 'Wake Up', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '1900000005', name: 'Mr. Brightside', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1900000006', name: 'Somebody Told Me', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '1900000007', name: 'Holocene', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '1900000008', name: 'Skinny Love', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Marcus Johnson',
    email: 'marcus@dummy.com',
    age: 28, gender: 'male',
    bio: 'old school hip-hop, vinyl collector',
    musicProfile: {
      genres: ['Hip-Hop', 'Soul', 'R&B'],
      tracks: [
        { itunesId: '2000000001', name: 'N.Y. State of Mind', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2000000002', name: 'The World Is Yours', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2000000003', name: 'C.R.E.A.M.', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2000000004', name: 'Protect Ya Neck', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2000000005', name: 'Express Yourself', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2000000006', name: 'Straight Outta Compton', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2000000007', name: 'Lose Yourself', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '2000000008', name: 'Stan', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Emma Walsh',
    email: 'emma@dummy.com',
    age: 21, gender: 'female',
    bio: 'pop princess, no shame',
    musicProfile: {
      genres: ['Pop', 'Dance Pop', 'Electropop'],
      tracks: [
        { itunesId: '2100000001', name: 'Anti-Hero', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2100000002', name: 'Shake It Off', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2100000003', name: 'As It Was', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2100000004', name: 'Watermelon Sugar', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2100000005', name: 'Levitating', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2100000006', name: 'Physical', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2100000007', name: 'Montero', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '2100000008', name: 'Industry Baby', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Luca Ferrari',
    email: 'luca@dummy.com',
    age: 29, gender: 'male',
    bio: 'metal and coffee, in that order',
    musicProfile: {
      genres: ['Metal', 'Hard Rock', 'Alternative'],
      tracks: [
        { itunesId: '2200000001', name: 'Enter Sandman', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2200000002', name: 'Master of Puppets', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2200000003', name: 'Paranoid', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2200000004', name: 'Iron Man', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2200000005', name: 'Bohemian Rhapsody', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2200000006', name: 'We Will Rock You', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2200000007', name: 'Back in Black', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '2200000008', name: 'Highway to Hell', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Zoe Thompson',
    email: 'zoe@dummy.com',
    age: 24, gender: 'female',
    bio: 'bedroom pop and sad playlists',
    musicProfile: {
      genres: ['Indie Pop', 'Dream Pop', 'Alternative'],
      tracks: [
        { itunesId: '2300000001', name: 'bad guy', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2300000002', name: 'ocean eyes', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2300000003', name: 'Ribs', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2300000004', name: 'Tennis Court', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2300000005', name: 'Liability', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2300000006', name: 'Green Light', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2300000007', name: 'Fake Plastic Trees', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '2300000008', name: 'Exit Music', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Noah Patel',
    email: 'noah@dummy.com',
    age: 26, gender: 'male',
    bio: 'country roads and city lights',
    musicProfile: {
      genres: ['Country', 'Folk', 'Americana'],
      tracks: [
        { itunesId: '2400000001', name: 'Friends in Low Places', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2400000002', name: 'The Dance', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2400000003', name: 'Take Me Home, Country Roads', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2400000004', name: 'Country Roads', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2400000005', name: 'Jolene', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2400000006', name: 'I Will Always Love You', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2400000007', name: 'The House That Built Me', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '2400000008', name: 'White Liar', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Isabella Costa',
    email: 'isabella@dummy.com',
    age: 23, gender: 'female',
    bio: 'k-pop stan, no apologies',
    musicProfile: {
      genres: ['K-Pop', 'Pop', 'Dance Pop'],
      tracks: [
        { itunesId: '2500000001', name: 'Dynamite', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2500000002', name: 'Butter', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2500000003', name: 'How You Like That', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2500000004', name: 'Kill This Love', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2500000005', name: 'WANNABE', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2500000006', name: 'Dalla Dalla', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2500000007', name: 'Next Level', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '2500000008', name: 'Savage', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Ryan O\'Brien',
    email: 'ryan@dummy.com',
    age: 30, gender: 'male',
    bio: 'punk was better in the 90s',
    musicProfile: {
      genres: ['Punk', 'Alternative', 'Indie Rock'],
      tracks: [
        { itunesId: '2600000001', name: 'Basket Case', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2600000002', name: 'American Idiot', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2600000003', name: 'All the Small Things', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2600000004', name: 'What\'s My Age Again?', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2600000005', name: 'Smells Like Teen Spirit', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2600000006', name: 'Come as You Are', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2600000007', name: 'Teenage Dirtbag', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '2600000008', name: 'Punk Rock Girl', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Aisha Okonkwo',
    email: 'aisha@dummy.com',
    age: 25, gender: 'female',
    bio: 'afrobeats & soul music all day',
    musicProfile: {
      genres: ['Afrobeats', 'R&B', 'Soul'],
      tracks: [
        { itunesId: '2700000001', name: 'Love Nwantiti', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2700000002', name: 'Essence', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2700000003', name: 'Ye', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2700000004', name: 'Many Things', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2700000005', name: 'Location', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2700000006', name: 'Finesse', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2700000007', name: 'Beautiful', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '2700000008', name: 'Heavn', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
  {
    displayName: 'Diego Reyes',
    email: 'diego@dummy.com',
    age: 27, gender: 'male',
    bio: 'indie rock / alternative, guitar player',
    musicProfile: {
      genres: ['Indie Rock', 'Alternative', 'Shoegaze'],
      tracks: [
        { itunesId: '2800000001', name: 'Fake Plastic Trees', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2800000002', name: 'Karma Police', previewUrl: null, artworkUrl: '', artistRank: 1 },
        { itunesId: '2800000003', name: 'Only Shallow', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2800000004', name: 'Sometimes', previewUrl: null, artworkUrl: '', artistRank: 2 },
        { itunesId: '2800000005', name: 'There Is a Light', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2800000006', name: 'How Soon Is Now?', previewUrl: null, artworkUrl: '', artistRank: 3 },
        { itunesId: '2800000007', name: 'Maps', previewUrl: null, artworkUrl: '', artistRank: 4 },
        { itunesId: '2800000008', name: 'Date with the Night', previewUrl: null, artworkUrl: '', artistRank: 4 },
      ],
      profileReady: true,
    },
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const hash = await bcrypt.hash(DUMMY_PASSWORD, 10);
  let created = 0;
  let skipped = 0;

  for (const data of users) {
    const exists = await User.findOne({ email: data.email });
    if (exists) {
      console.log(`  skip  ${data.email} (already exists)`);
      skipped++;
      continue;
    }

    await User.create({
      ...data,
      passwordHash: hash,
      profileComplete: true,
    });
    console.log(`  created ${data.email}`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped`);
  console.log(`All dummy accounts use password: ${DUMMY_PASSWORD}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
