import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GradientButton } from '../../src/components/GradientButton';
import { TextInput } from '../../src/components/TextInput';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import { Colors } from '../../src/theme/colors';
import { FontFamily, FontSize } from '../../src/theme/typography';

// ─── Types ───────────────────────────────────────────────────────────────────

type ArtistResult   = { itunesId: string; name: string };
type SelectedArtist = { itunesId: string; name: string; rank: number };
type TrackResult    = { itunesId: string; name: string; previewUrl: string | null; artworkUrl: string | null };
type SelectedTrack  = TrackResult & { artistRank: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 11;

const STEP_LABELS = [
  "What's your name?",
  "When's your birthday?",
  "What's your gender?",
  'Who are you interested in?',
  "What's your phone number?",
  'Pick your top genres',
  'Your favorite artists',
  'Your favorite songs',
  'Your ethnicity',
  'How far away?',
  'Add your photos',
];

const VALID_GENRES = [
  'Pop', 'Hip-Hop / Rap', 'R&B / Soul', 'Rock', 'Alternative', 'Indie',
  'Electronic / EDM', 'Dance / House', 'Latin', 'Country', 'Folk / Acoustic',
  'Jazz', 'Classical', 'Metal', 'Punk', 'Reggae / Dancehall', 'K-Pop',
  'Afrobeats', 'Lo-Fi', 'Ambient / Chill',
];

const VALID_ETHNICITIES = [
  'Asian', 'Black / African American', 'Hispanic / Latino',
  'Middle Eastern / North African', 'Native American / Indigenous',
  'Pacific Islander', 'South Asian', 'White / Caucasian',
  'Mixed / Multiracial', 'Prefer not to say',
];

const DISTANCE_PRESETS = [10, 25, 50, 100];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAge(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function suggestNameFromEmail(email?: string | null): string {
  if (!email) return '';
  const raw = email.split('@')[0].replace(/[0-9._-]/g, ' ').trim().split(/\s+/)[0];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

type PartialUser = {
  interestedIn?: string;
  musicProfile?: { genres?: string[]; artists?: unknown[]; profileReady?: boolean };
} | null;

function computeInitialStep(user: PartialUser): number {
  if (!user) return 0;
  if (user.musicProfile?.profileReady) return 10;
  if ((user.musicProfile?.artists?.length ?? 0) >= 4) return 7;
  if ((user.musicProfile?.genres?.length ?? 0) >= 3) return 6;
  if (user.interestedIn) return 5;
  return 0;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [step, setStep]       = useState(() => computeInitialStep(user));
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Step 0 — Name
  const [name, setName] = useState(
    () => user?.displayName?.split(' ')[0] || suggestNameFromEmail((user as any)?.email)
  );

  // Step 1 — Birthday
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const [birthday, setBirthday] = useState<Date>(
    () => (user as any)?.birthday ? new Date((user as any).birthday) : new Date(2000, 0, 1)
  );

  // Step 2 — Gender
  const [gender, setGender] = useState(() => (user as any)?.gender ?? '');

  // Step 3 — Interested in
  const [interestedIn, setInterestedIn] = useState(() => (user as any)?.interestedIn ?? '');

  // Step 4 — Phone
  const [phone, setPhone] = useState(() => (user as any)?.phone ?? '');

  // Step 5 — Genres
  const [genres, setGenres] = useState<string[]>(
    () => user?.musicProfile?.genres ?? []
  );

  // Step 6 — Artist search
  const [artistQuery, setArtistQuery]       = useState('');
  const [artistResults, setArtistResults]   = useState<ArtistResult[]>([]);
  const [artistSearching, setArtistSearching] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState<SelectedArtist[]>([]);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 7 — Song picker
  const [artistTracks, setArtistTracks]     = useState<Record<string, TrackResult[]>>({});
  const [tracksLoading, setTracksLoading]   = useState<Record<string, boolean>>({});
  const [selectedTracks, setSelectedTracks] = useState<SelectedTrack[]>([]);

  // Step 8 — Ethnicity
  const [ethnicity, setEthnicity] = useState<string | null>(null);

  // Step 9 — Distance
  const [maxDistance, setMaxDistance] = useState(25);

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / TOTAL_STEPS,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  // Fetch tracks when entering step 7
  useEffect(() => {
    if (step !== 7) return;
    selectedArtists.forEach(async (artist) => {
      if (artistTracks[artist.itunesId] !== undefined) return;
      setTracksLoading(prev => ({ ...prev, [artist.itunesId]: true }));
      try {
        const tracks = await api.get<TrackResult[]>(`/music/artist/${artist.itunesId}/tracks`);
        setArtistTracks(prev => ({ ...prev, [artist.itunesId]: tracks }));
      } catch {
        setArtistTracks(prev => ({ ...prev, [artist.itunesId]: [] }));
      } finally {
        setTracksLoading(prev => ({ ...prev, [artist.itunesId]: false }));
      }
    });
  }, [step]);

  // Artist search with debounce
  const handleArtistSearch = useCallback((text: string) => {
    setArtistQuery(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (text.length < 3) { setArtistResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setArtistSearching(true);
      try {
        const results = await api.get<ArtistResult[]>(`/music/search?q=${encodeURIComponent(text)}`);
        setArtistResults(results.filter(r => !selectedArtists.some(s => s.itunesId === r.itunesId)));
      } catch {
        setArtistResults([]);
      } finally {
        setArtistSearching(false);
      }
    }, 300);
  }, [selectedArtists]);

  const selectArtist = (artist: ArtistResult) => {
    if (selectedArtists.length >= 4) return;
    const rank = selectedArtists.length + 1;
    setSelectedArtists(prev => [...prev, { ...artist, rank }]);
    setArtistResults(prev => prev.filter(r => r.itunesId !== artist.itunesId));
    setArtistQuery('');
  };

  const deselectArtist = (itunesId: string) => {
    const filtered = selectedArtists.filter(a => a.itunesId !== itunesId);
    // Re-assign ranks after removal
    setSelectedArtists(filtered.map((a, i) => ({ ...a, rank: i + 1 })));
    setSelectedTracks(prev => {
      const rankToRemove = selectedArtists.find(a => a.itunesId === itunesId)?.rank;
      return prev.filter(t => t.artistRank !== rankToRemove);
    });
  };

  const toggleTrack = (track: TrackResult, artistRank: number) => {
    const isSelected = selectedTracks.some(t => t.itunesId === track.itunesId);
    if (isSelected) {
      setSelectedTracks(prev => prev.filter(t => t.itunesId !== track.itunesId));
    } else {
      const countForArtist = selectedTracks.filter(t => t.artistRank === artistRank).length;
      if (countForArtist >= 2) return;
      setSelectedTracks(prev => [...prev, { ...track, artistRank }]);
    }
  };

  const goBack = () => {
    setError('');
    if (step === 0) {
      logout().then(() => router.replace('/(auth)/landing'));
    } else {
      setStep(s => s - 1);
    }
  };

  const goNext = () => { setError(''); setStep(s => s + 1); };

  const handleNext = async () => {
    setError('');

    if (step === 0) {
      if (!name.trim()) { setError('Please enter your name.'); return; }
      goNext();

    } else if (step === 1) {
      if (calcAge(birthday) < 18) { setError('You must be 18 or older to use Harmoni.'); return; }
      goNext();

    } else if (step === 2) {
      if (!gender) { setError('Please select a gender.'); return; }
      goNext();

    } else if (step === 3) {
      if (!interestedIn) { setError('Please make a selection.'); return; }
      goNext();

    } else if (step === 4) {
      if (phone && !/^\+?[\d\s\-().]{7,15}$/.test(phone)) {
        setError('Please enter a valid phone number.'); return;
      }
      setLoading(true);
      try {
        await api.patch('/user/basic-info', {
          name: name.trim(), birthday: birthday.toISOString(),
          gender, interestedIn, phone: phone.trim() || null,
        });
        goNext();
      } catch (e: any) {
        setError(e.message ?? 'Failed to save. Please try again.');
      } finally { setLoading(false); }

    } else if (step === 5) {
      if (genres.length !== 3) { setError('Pick exactly 3 genres to continue.'); return; }
      setLoading(true);
      try {
        await api.post('/onboarding/genres', { genres });
        goNext();
      } catch (e: any) {
        setError(e.message ?? 'Failed to save. Please try again.');
      } finally { setLoading(false); }

    } else if (step === 6) {
      if (selectedArtists.length !== 4) { setError('Select exactly 4 artists to continue.'); return; }
      setLoading(true);
      try {
        await api.post('/onboarding/artists', {
          artists: selectedArtists.map(a => ({ itunesId: a.itunesId, name: a.name, rank: a.rank })),
        });
        goNext();
      } catch (e: any) {
        setError(e.message ?? 'Failed to save. Please try again.');
      } finally { setLoading(false); }

    } else if (step === 7) {
      if (selectedTracks.length !== 8) {
        setError('Pick 2 songs for each artist to continue.'); return;
      }
      setLoading(true);
      try {
        await api.post('/onboarding/tracks', { tracks: selectedTracks });
        goNext();
      } catch (e: any) {
        setError(e.message ?? 'Failed to save. Please try again.');
      } finally { setLoading(false); }

    } else if (step === 8) {
      if (ethnicity) {
        api.post('/onboarding/identity', { ethnicity }).catch(() => {});
      }
      goNext();

    } else if (step === 9) {
      api.post('/onboarding/identity', { maxDistance }).catch(() => {});
      goNext();

    } else if (step === 10) {
      setLoading(true);
      try {
        await api.post('/user/profile/complete', {});
        await refreshUser();
      } catch (e: any) {
        setError(e.message ?? 'Something went wrong.');
      } finally { setLoading(false); }
    }
  };

  // ─── Step renderers ───────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {

      // Step 0: Name
      case 0:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[0]}</Text>
            <Text style={styles.hint}>This is how you'll appear to others</Text>
            <TextInput value={name} onChangeText={setName} placeholder="First name" autoFocus autoCapitalize="words" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton label="Continue" onPress={handleNext} />
          </>
        );

      // Step 1: Birthday
      case 1:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[1]}</Text>
            <Text style={styles.hint}>You must be 18+ to use Harmoni</Text>
            <View style={styles.pickerCard}>
              <DateTimePicker
                value={birthday} mode="date" display="spinner"
                onChange={(_, date) => date && setBirthday(date)}
                maximumDate={maxDate} minimumDate={new Date(1920, 0, 1)}
                textColor={Colors.textDark} style={styles.datePicker}
              />
            </View>
            <Text style={styles.ageTag}>
              {calcAge(birthday) >= 18 ? `You're ${calcAge(birthday)} years old ✓` : 'You must be 18 or older'}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton label="Continue" onPress={handleNext} />
          </>
        );

      // Step 2: Gender
      case 2:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[2]}</Text>
            <View style={styles.chipCol}>
              {['Man', 'Woman', 'Other'].map(g => (
                <Pressable key={g} style={[styles.bigChip, gender === g && styles.bigChipSelected]}
                  onPress={() => { setGender(g); setTimeout(goNext, 350); }}>
                  <Text style={[styles.bigChipText, gender === g && styles.bigChipTextSelected]}>{g}</Text>
                </Pressable>
              ))}
            </View>
          </>
        );

      // Step 3: Interested in
      case 3:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[3]}</Text>
            <View style={styles.chipCol}>
              {['Men', 'Women', 'Everyone'].map(i => (
                <Pressable key={i} style={[styles.bigChip, interestedIn === i && styles.bigChipSelected]}
                  onPress={() => { setInterestedIn(i); setTimeout(goNext, 350); }}>
                  <Text style={[styles.bigChipText, interestedIn === i && styles.bigChipTextSelected]}>{i}</Text>
                </Pressable>
              ))}
            </View>
          </>
        );

      // Step 4: Phone
      case 4:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[4]}</Text>
            <Text style={styles.hint}>We'll verify this to keep things safe</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+1</Text>
              </View>
              <View style={styles.phoneInputWrap}>
                <TextInput value={phone} onChangeText={setPhone} placeholder="(555) 000-0000" keyboardType="phone-pad" />
              </View>
            </View>
            <Text style={styles.skipLink} onPress={goNext}>Skip for now</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton label={loading ? 'Saving…' : 'Continue'} onPress={handleNext} disabled={loading} />
          </>
        );

      // Step 5: Genres
      case 5: {
        const atMax = genres.length >= 3;
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[5]}</Text>
            <Text style={styles.hint}>Choose exactly 3 that define your taste</Text>
            <Text style={[styles.counter, atMax && styles.counterFull]}>
              {genres.length} / 3 selected{atMax ? ' ✓' : ''}
            </Text>
            <View style={styles.chipWrap}>
              {VALID_GENRES.map(g => {
                const selected = genres.includes(g);
                const disabled = atMax && !selected;
                return (
                  <Pressable key={g}
                    style={[styles.chip, selected && styles.chipSelected, disabled && styles.chipDisabled]}
                    onPress={() => {
                      if (selected) setGenres(prev => prev.filter(x => x !== g));
                      else if (!atMax) setGenres(prev => [...prev, g]);
                    }}>
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton label={loading ? 'Saving…' : 'Continue'} onPress={handleNext}
              disabled={loading || genres.length !== 3} />
          </>
        );
      }

      // Step 6: Artist Search
      case 6: {
        const atMax = selectedArtists.length >= 4;
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[6]}</Text>
            <Text style={styles.hint}>Search and pick 4 artists — order matters (rank 1 is your #1)</Text>

            {/* Selected artists */}
            {selectedArtists.length > 0 && (
              <View style={styles.selectedArtistsList}>
                {selectedArtists.map(a => (
                  <View key={a.itunesId} style={styles.selectedArtistRow}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>{a.rank}</Text>
                    </View>
                    <Text style={styles.selectedArtistName} numberOfLines={1}>{a.name}</Text>
                    <Pressable onPress={() => deselectArtist(a.itunesId)} hitSlop={8} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Search input */}
            {!atMax && (
              <>
                <TextInput
                  value={artistQuery}
                  onChangeText={handleArtistSearch}
                  placeholder="Search artists…"
                  autoCapitalize="words"
                  returnKeyType="search"
                />

                {/* Search results */}
                {artistSearching && (
                  <ActivityIndicator color={Colors.white} style={{ marginTop: 8 }} />
                )}
                {artistResults.length > 0 && (
                  <View style={styles.resultsList}>
                    {artistResults.map(r => (
                      <Pressable key={r.itunesId} style={styles.resultRow} onPress={() => selectArtist(r)}>
                        <Text style={styles.resultName}>{r.name}</Text>
                        <Text style={styles.resultAdd}>＋</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            )}

            <Text style={[styles.counter, atMax && styles.counterFull]}>
              {selectedArtists.length} / 4 selected{atMax ? ' ✓' : ''}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton label={loading ? 'Saving…' : 'Continue'} onPress={handleNext}
              disabled={loading || selectedArtists.length !== 4} />
          </>
        );
      }

      // Step 7: Song Picker
      case 7: {
        const allDone = selectedArtists.every(
          a => selectedTracks.filter(t => t.artistRank === a.rank).length === 2
        );
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[7]}</Text>
            <Text style={styles.hint}>Pick 2 songs per artist — these go into your Blend</Text>

            {selectedArtists.map(artist => {
              const tracks = artistTracks[artist.itunesId] ?? [];
              const isLoading = tracksLoading[artist.itunesId] ?? false;
              const picked = selectedTracks.filter(t => t.artistRank === artist.rank).length;

              return (
                <View key={artist.itunesId} style={styles.artistSection}>
                  <View style={styles.artistSectionHeader}>
                    <Text style={styles.artistSectionName}>{artist.name}</Text>
                    <View style={[styles.pickBadge, picked === 2 && styles.pickBadgeDone]}>
                      <Text style={styles.pickBadgeText}>{picked}/2{picked === 2 ? ' ✓' : ''}</Text>
                    </View>
                  </View>

                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} style={{ marginVertical: 12 }} />
                  ) : tracks.length === 0 ? (
                    <Text style={styles.noTracksText}>No tracks found</Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                      style={styles.trackScroll} contentContainerStyle={styles.trackScrollContent}>
                      {tracks.map(track => {
                        const isSelected = selectedTracks.some(t => t.itunesId === track.itunesId);
                        const atLimit = !isSelected && selectedTracks.filter(t => t.artistRank === artist.rank).length >= 2;
                        return (
                          <Pressable key={track.itunesId}
                            style={[styles.trackCard, isSelected && styles.trackCardSelected, atLimit && styles.trackCardDisabled]}
                            onPress={() => toggleTrack(track, artist.rank)}>
                            {track.artworkUrl ? (
                              <Image source={{ uri: track.artworkUrl }} style={styles.trackArt} />
                            ) : (
                              <View style={[styles.trackArt, styles.trackArtFallback]}>
                                <Text style={styles.trackArtFallbackText}>♪</Text>
                              </View>
                            )}
                            {isSelected && (
                              <View style={styles.trackCheckOverlay}>
                                <Text style={styles.trackCheckMark}>✓</Text>
                              </View>
                            )}
                            <Text style={styles.trackName} numberOfLines={2}>{track.name}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              );
            })}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton label={loading ? 'Saving…' : 'Continue'} onPress={handleNext}
              disabled={loading || !allDone} />
          </>
        );
      }

      // Step 8: Ethnicity
      case 8:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[8]}</Text>
            <Text style={styles.hint}>This helps us find better matches for you — optional</Text>
            <View style={styles.chipWrap}>
              {VALID_ETHNICITIES.map(e => {
                const selected = ethnicity === e;
                return (
                  <Pressable key={e} style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setEthnicity(selected ? null : e)}>
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{e}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.skipLink} onPress={goNext}>Skip for now</Text>
            <GradientButton label="Continue" onPress={handleNext} />
          </>
        );

      // Step 9: Distance
      case 9:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[9]}</Text>
            <Text style={styles.hint}>How far are you willing to travel to meet someone?</Text>
            <View style={styles.distanceGrid}>
              {DISTANCE_PRESETS.map(d => (
                <Pressable key={d} style={[styles.distanceBtn, maxDistance === d && styles.distanceBtnSelected]}
                  onPress={() => setMaxDistance(d)}>
                  <Text style={[styles.distanceBtnLabel, maxDistance === d && styles.distanceBtnLabelSelected]}>
                    {d} mi
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.skipLink} onPress={goNext}>Any distance</Text>
            <GradientButton label="Continue" onPress={handleNext} />
          </>
        );

      // Step 10: Photos
      case 10:
        return (
          <>
            <Text style={styles.stubEmoji}>📸</Text>
            <Text style={styles.question}>{STEP_LABELS[10]}</Text>
            <Text style={styles.hint}>Show the real you — at least 1 photo required</Text>
            <View style={styles.stubBadge}>
              <Text style={styles.stubBadgeText}>Coming soon</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton label={loading ? 'Setting up…' : 'Start Matching 🎵'}
              onPress={handleNext} disabled={loading} />
          </>
        );

      default:
        return null;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.stepCount}>{step + 1}/{TOTAL_STEPS}</Text>
      </View>

      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner:  { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12,
  },
  backBtn:   { padding: 4 },
  backArrow: { fontSize: 32, color: Colors.white, fontFamily: FontFamily.semiBold, lineHeight: 34 },
  progressBg: {
    flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill:  { height: '100%', backgroundColor: Colors.white, borderRadius: 3 },
  stepCount: {
    fontSize: FontSize.xs, fontFamily: FontFamily.semiBold,
    color: 'rgba(255,255,255,0.7)', minWidth: 32, textAlign: 'right',
  },

  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40 },

  question: {
    fontSize: FontSize.title, fontFamily: FontFamily.semiBold,
    color: Colors.white, marginBottom: 8,
  },
  hint: {
    fontSize: FontSize.md, fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.7)', marginBottom: 24,
  },

  // Birthday
  pickerCard: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  datePicker: { width: '100%' },
  ageTag: {
    fontSize: FontSize.sm, fontFamily: FontFamily.semiBold,
    color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 20,
  },

  // Big chips (gender, interested in)
  chipCol: { gap: 14, marginTop: 8, marginBottom: 12 },
  bigChip: {
    paddingVertical: 18, paddingHorizontal: 24, borderRadius: 50,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center',
  },
  bigChipSelected:     { backgroundColor: Colors.white, borderColor: Colors.white },
  bigChipText:         { fontSize: FontSize.lg, fontFamily: FontFamily.semiBold, color: Colors.white },
  bigChipTextSelected: { color: Colors.gradientEnd },

  // Phone
  phoneRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  countryCode: {
    height: 52, paddingHorizontal: 16, borderRadius: 50,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  countryCodeText: { fontSize: FontSize.md, fontFamily: FontFamily.semiBold, color: Colors.white },
  phoneInputWrap:  { flex: 1 },

  skipLink: {
    fontSize: FontSize.sm, fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.6)', textAlign: 'center',
    marginBottom: 16, textDecorationLine: 'underline',
  },

  // Small chips (genres, ethnicity)
  counter:     { fontSize: FontSize.sm, fontFamily: FontFamily.semiBold, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  counterFull: { color: Colors.white },
  chipWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  chip: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 50,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  chipSelected:     { backgroundColor: Colors.white, borderColor: Colors.white },
  chipDisabled:     { opacity: 0.35 },
  chipText:         { fontSize: FontSize.sm, fontFamily: FontFamily.semiBold, color: Colors.white },
  chipTextSelected: { color: Colors.gradientEnd },

  // Artist search — selected list
  selectedArtistsList: { gap: 8, marginBottom: 16 },
  selectedArtistRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 50,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  rankBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
  },
  rankBadgeText:       { fontSize: FontSize.xs, fontFamily: FontFamily.semiBold, color: Colors.gradientEnd },
  selectedArtistName:  { flex: 1, fontSize: FontSize.md, fontFamily: FontFamily.semiBold, color: Colors.white },
  removeBtn:           { padding: 4 },
  removeBtnText:       { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)' },

  // Artist search — results
  resultsList: {
    backgroundColor: Colors.white, borderRadius: 16,
    overflow: 'hidden', marginBottom: 16, marginTop: 4,
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  resultName: { fontSize: FontSize.md, fontFamily: FontFamily.regular, color: Colors.textDark, flex: 1 },
  resultAdd:  { fontSize: FontSize.xl, color: Colors.primary, fontFamily: FontFamily.semiBold },

  // Song picker — artist section
  artistSection:      { marginBottom: 24 },
  artistSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  artistSectionName: {
    flex: 1, fontSize: FontSize.lg, fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  pickBadge: {
    paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  pickBadgeDone: { backgroundColor: Colors.white },
  pickBadgeText: { fontSize: FontSize.xs, fontFamily: FontFamily.semiBold, color: Colors.white },

  // Track scroll
  trackScroll:        { marginHorizontal: -4 },
  trackScrollContent: { paddingHorizontal: 4, gap: 10, flexDirection: 'row' },
  trackCard: {
    width: 96, alignItems: 'center', gap: 6,
    opacity: 1,
  },
  trackCardSelected: {},
  trackCardDisabled: { opacity: 0.35 },
  trackArt: {
    width: 84, height: 84, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  trackArtFallback:     { alignItems: 'center', justifyContent: 'center' },
  trackArtFallbackText: { fontSize: 28, color: 'rgba(255,255,255,0.4)' },
  trackCheckOverlay: {
    position: 'absolute', top: 0, left: 0, width: 84, height: 84,
    borderRadius: 10, backgroundColor: 'rgba(255,45,150,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  trackCheckMark:  { fontSize: 28, color: Colors.white, fontFamily: FontFamily.semiBold },
  trackName: {
    fontSize: 11, fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.85)', textAlign: 'center',
    width: 84,
  },
  noTracksText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', fontFamily: FontFamily.regular },

  // Distance
  distanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  distanceBtn: {
    flex: 1, minWidth: '40%', paddingVertical: 20,
    borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
  },
  distanceBtnSelected:     { backgroundColor: Colors.white, borderColor: Colors.white },
  distanceBtnLabel:        { fontSize: FontSize.xl, fontFamily: FontFamily.semiBold, color: Colors.white },
  distanceBtnLabelSelected: { color: Colors.gradientEnd },

  // Stubs
  stubEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  stubBadge: {
    alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16, marginBottom: 28,
  },
  stubBadgeText: { fontSize: FontSize.sm, fontFamily: FontFamily.semiBold, color: 'rgba(255,255,255,0.7)' },

  error: {
    fontSize: FontSize.sm, fontFamily: FontFamily.regular,
    color: '#FFB3B3', textAlign: 'center', marginBottom: 12,
  },
});
