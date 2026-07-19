'use strict';

// Tunable scoring weights — change here, no redeploy of logic needed.
module.exports = {
  // Music score layer weights (must sum to 1.0)
  W_L1: 0.50, // Direct artist overlap (rank + rarity weighted)
  W_L2: 0.30, // Similar-artist bridge (Last.fm graph)
  W_L3: 0.20, // Genre Jaccard

  // L1 calibration
  L1_NORM: 4.0,        // Denominator for normalizing contribution sum — calibrate via seed histogram
  MAX_LISTENERS: 5e6,  // Listener count used as rarity ceiling (5M = mainstream threshold)

  // Ethnicity soft weight — added on top of music score, never shown to user
  // rankScore = musicScore + ethnicityBoost
  ETHNICITY_MUTUAL_BOOST:   10, // Both users prefer each other's ethnicity
  ETHNICITY_ONEWAY_BOOST:    4, // Only one user's preference matches
  ETHNICITY_OPEN_BOOST:      2, // Either user has no preferences set (open to all)

  // Proximity pre-filter — convert user's maxDistance (miles) to meters for $near
  MILES_TO_METERS: 1609.34,
};
