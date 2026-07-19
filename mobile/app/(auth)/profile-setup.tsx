import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
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

const AnimatedFlatList = Animated.createAnimatedComponent<typeof FlatList>(FlatList);

// ─── Types ───────────────────────────────────────────────────────────────────

type ArtistResult   = { itunesId: string; name: string };
type SelectedArtist = { itunesId: string; name: string; rank: number };
type TrackResult    = { itunesId: string; name: string; previewUrl: string | null; artworkUrl: string | null };
type SelectedTrack  = TrackResult & { artistRank: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 13;

const SCREEN_W      = Dimensions.get('window').width;
const COVER_SIZE    = 240;
const COVER_MARGIN  = 8;
const COVER_ITEM_W  = COVER_SIZE + COVER_MARGIN * 2;
const SIDE_PADDING  = (SCREEN_W - COVER_ITEM_W) / 2;

const STEP_LABELS = [
  "What's your name?",           // 0
  "When's your birthday?",       // 1
  "What's your gender?",         // 2
  'Who are you interested in?',  // 3
  "What's your phone number?",   // 4
  'Pick your top genres',        // 5
  'Your favorite artists',       // 6
  '', '', '',                    // 7–9 dynamic (artist name)
  'Your ethnicity',              // 10
  'How far away?',               // 11
  'Add your photos',             // 12
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
  if (user.musicProfile?.profileReady) return 12;
  if ((user.musicProfile?.artists?.length ?? 0) >= 3) return 7;
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
  const [artistQuery, setArtistQuery]           = useState('');
  const [artistResults, setArtistResults]       = useState<ArtistResult[]>([]);
  const [artistSearching, setArtistSearching]   = useState(false);
  const [selectedArtists, setSelectedArtists]   = useState<SelectedArtist[]>([]);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Steps 7–9 — Song picker (jukebox, one artist per step)
  const [artistTracks, setArtistTracks]            = useState<Record<string, TrackResult[]>>({});
  const [tracksLoading, setTracksLoading]          = useState<Record<string, boolean>>({});
  const [selectedTracks, setSelectedTracks]        = useState<SelectedTrack[]>([]);
  const [trackSearchQuery, setTrackSearchQuery]    = useState<Record<string, string>>({});
  const [songSearchResults, setSongSearchResults]  = useState<Record<string, TrackResult[]>>({});
  const [songSearching, setSongSearching]          = useState<Record<string, boolean>>({});
  const songSearchDebounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // One Animated.Value per artist slot (0, 1, 2) for carousel scroll position
  const carouselScrollX = useRef<Animated.Value[]>([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  // Step 10 — Ethnicity
  const [ethnicity, setEthnicity] = useState<string | null>(null);

  // Step 11 — Distance
  const [maxDistance, setMaxDistance] = useState(25);

  // ─── Progress bar ──────────────────────────────────────────────────────────

  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / TOTAL_STEPS,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  // ─── Load tracks when entering a per-artist step ──────────────────────────

  useEffect(() => {
    if (step < 7 || step > 9) return;
    const artist = selectedArtists[step - 7];
    if (!artist || artistTracks[artist.itunesId] !== undefined) return;
    setTracksLoading(prev => ({ ...prev, [artist.itunesId]: true }));
    api.get<TrackResult[]>(`/music/artist/${artist.itunesId}/tracks`)
      .then(tracks => setArtistTracks(prev => ({ ...prev, [artist.itunesId]: tracks })))
      .catch(() => setArtistTracks(prev => ({ ...prev, [artist.itunesId]: [] })))
      .finally(() => setTracksLoading(prev => ({ ...prev, [artist.itunesId]: false })));
  }, [step]);

  // ─── Artist search handlers ────────────────────────────────────────────────

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
    if (selectedArtists.length >= 3) return;
    const rank = selectedArtists.length + 1;
    setSelectedArtists(prev => [...prev, { ...artist, rank }]);
    setArtistResults(prev => prev.filter(r => r.itunesId !== artist.itunesId));
    setArtistQuery('');
  };

  const deselectArtist = (itunesId: string) => {
    const filtered = selectedArtists.filter(a => a.itunesId !== itunesId);
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

  // Live song search — calls API, debounced 300ms, ≥2 chars
  const handleSongSearch = (itunesId: string, text: string) => {
    setTrackSearchQuery(prev => ({ ...prev, [itunesId]: text }));

    if (songSearchDebounce.current[itunesId]) {
      clearTimeout(songSearchDebounce.current[itunesId]);
    }

    if (text.trim().length < 2) {
      setSongSearchResults(prev => ({ ...prev, [itunesId]: [] }));
      return;
    }

    songSearchDebounce.current[itunesId] = setTimeout(async () => {
      setSongSearching(prev => ({ ...prev, [itunesId]: true }));
      try {
        const results = await api.get<TrackResult[]>(
          `/music/artist/${itunesId}/search?q=${encodeURIComponent(text.trim())}`
        );
        setSongSearchResults(prev => ({ ...prev, [itunesId]: results }));
      } catch {
        setSongSearchResults(prev => ({ ...prev, [itunesId]: [] }));
      } finally {
        setSongSearching(prev => ({ ...prev, [itunesId]: false }));
      }
    }, 300);
  };

  // ─── Navigation ───────────────────────────────────────────────────────────

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
      if (selectedArtists.length !== 3) { setError('Select exactly 3 artists to continue.'); return; }
      setLoading(true);
      try {
        await api.post('/onboarding/artists', {
          artists: selectedArtists.map(a => ({ itunesId: a.itunesId, name: a.name, rank: a.rank })),
        });
        goNext();
      } catch (e: any) {
        setError(e.message ?? 'Failed to save. Please try again.');
      } finally { setLoading(false); }

    } else if (step === 7 || step === 8) {
      const artist = selectedArtists[step - 7];
      if (artist) {
        const picked = selectedTracks.filter(t => t.artistRank === artist.rank).length;
        if (picked !== 2) {
          setError(`Pick 2 songs for ${artist.name} to continue.`);
          return;
        }
      }
      goNext();

    } else if (step === 9) {
      const allValid = selectedArtists.every(
        a => selectedTracks.filter(t => t.artistRank === a.rank).length === 2
      );
      if (!allValid || selectedTracks.length !== 6) {
        setError('Pick 2 songs for each artist to continue.'); return;
      }
      setLoading(true);
      try {
        await api.post('/onboarding/tracks', { tracks: selectedTracks });
        goNext();
      } catch (e: any) {
        setError(e.message ?? 'Failed to save. Please try again.');
      } finally { setLoading(false); }

    } else if (step === 10) {
      if (ethnicity) {
        api.post('/onboarding/identity', { ethnicity }).catch(() => {});
      }
      goNext();

    } else if (step === 11) {
      api.post('/onboarding/identity', { maxDistance }).catch(() => {});
      goNext();

    } else if (step === 12) {
      setLoading(true);
      try {
        await api.post('/user/profile/complete', {});
        await refreshUser();
      } catch (e: any) {
        setError(e.message ?? 'Something went wrong.');
      } finally { setLoading(false); }
    }
  };

  // ─── Jukebox song-picker (one artist per step 7/8/9) ─────────────────────

  const renderArtistSongStep = (artistIdx: number) => {
    const artist = selectedArtists[artistIdx];
    if (!artist) return null;

    const scrollX        = carouselScrollX.current[artistIdx];
    const allTracks      = artistTracks[artist.itunesId] ?? [];
    const isLoading      = tracksLoading[artist.itunesId] ?? false;
    const picked         = selectedTracks.filter(t => t.artistRank === artist.rank).length;
    const q              = (trackSearchQuery[artist.itunesId] ?? '').trim();
    const isSearchActive = q.length >= 2;
    const apiResults     = songSearchResults[artist.itunesId] ?? [];
    const isFetching     = songSearching[artist.itunesId] ?? false;

    // Text list: top 4 live API results (only while search is active)
    const textMatches = isSearchActive ? apiResults.slice(0, 4) : [];

    // Carousel: live search results when active, pre-loaded top tracks otherwise
    const carouselData = isSearchActive ? apiResults : allTracks;

    const isLastArtist = artistIdx === 2;

    return (
      <>
        {/* Heading */}
        <Text style={styles.jukeboxArtist}>{artist.name}</Text>
        <View style={styles.jukeboxMeta}>
          <Text style={[styles.counter, picked === 2 && styles.counterFull]}>
            {picked} / 2 songs{picked === 2 ? ' ✓' : ''}
          </Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>#{artist.rank}</Text>
          </View>
        </View>

        {/* Search bar */}
        <TextInput
          value={trackSearchQuery[artist.itunesId] ?? ''}
          onChangeText={text => handleSongSearch(artist.itunesId, text)}
          placeholder="Search songs…"
          autoCapitalize="none"
          returnKeyType="search"
          containerStyle={styles.trackSearchContainer}
        />

        {/* Spinner while API fetches results */}
        {isFetching && (
          <ActivityIndicator color={Colors.white} style={{ marginBottom: 8 }} />
        )}

        {/* Text results (visible while typing) */}
        {!isFetching && textMatches.length > 0 && (
          <View style={styles.trackList}>
            {textMatches.map((track, idx) => {
              const isSelected = selectedTracks.some(t => t.itunesId === track.itunesId);
              const atLimit    = !isSelected && picked >= 2;
              return (
                <Pressable
                  key={track.itunesId}
                  style={[
                    styles.trackRow,
                    idx < textMatches.length - 1 && styles.trackRowBorder,
                    isSelected && styles.trackRowSelected,
                    atLimit && styles.trackRowDisabled,
                  ]}
                  onPress={() => toggleTrack(track, artist.rank)}
                >
                  <View style={[styles.trackIndicator, isSelected && styles.trackIndicatorSelected]}>
                    {isSelected && <Text style={styles.trackIndicatorCheck}>✓</Text>}
                  </View>
                  <Text
                    style={[styles.trackRowName, isSelected && styles.trackRowNameSelected]}
                    numberOfLines={1}
                  >
                    {track.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {isSearchActive && !isFetching && apiResults.length === 0 && (
          <Text style={styles.noTracksText}>No songs found for "{q}"</Text>
        )}

        {/* ── Jukebox carousel ── */}
        <View style={styles.carouselWrapper}>
          {isLoading ? (
            <View style={styles.carouselCenter}>
              <ActivityIndicator color={Colors.white} size="large" />
              <Text style={styles.loadingText}>Loading tracks…</Text>
            </View>
          ) : carouselData.length === 0 ? (
            <View style={styles.carouselCenter}>
              <Text style={styles.noTracksText}>
                {q.length > 0 ? 'No matches' : 'No tracks available'}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.carouselHint}>
                {isSearchActive
                  ? `${carouselData.length} result${carouselData.length !== 1 ? 's' : ''} · tap to pick`
                  : 'Scroll through · tap to pick'
                }
              </Text>
              <AnimatedFlatList
                data={carouselData}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={COVER_ITEM_W}
                snapToAlignment="center"
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                keyExtractor={(item: any) => (item as TrackResult).itunesId}
                getItemLayout={(_: any, index: number) => ({
                  length: COVER_ITEM_W,
                  offset: COVER_ITEM_W * index,
                  index,
                })}
                renderItem={({ item, index }: { item: any; index: number }) => {
                  const track = item as TrackResult;
                  const inputRange = [
                    (index - 1) * COVER_ITEM_W,
                    index * COVER_ITEM_W,
                    (index + 1) * COVER_ITEM_W,
                  ];
                  const scale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.72, 1.0, 0.72],
                    extrapolate: 'clamp',
                  });
                  const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.4, 1.0, 0.4],
                    extrapolate: 'clamp',
                  });
                  const isSelected = selectedTracks.some(t => t.itunesId === track.itunesId);
                  const atLimit    = !isSelected && picked >= 2;
                  return (
                    <Animated.View style={[styles.coverItem, { transform: [{ scale }], opacity }]}>
                      <Pressable
                        onPress={() => { if (!atLimit) toggleTrack(track, artist.rank); }}
                        style={atLimit && !isSelected ? styles.coverDimmed : undefined}
                      >
                        {track.artworkUrl ? (
                          <Image
                            source={{ uri: track.artworkUrl }}
                            style={styles.coverImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.coverImage, styles.coverPlaceholder]}>
                            <Text style={styles.coverPlaceholderIcon}>♪</Text>
                          </View>
                        )}
                        {isSelected && (
                          <View style={styles.coverSelectedOverlay}>
                            <Text style={styles.coverCheck}>✓</Text>
                          </View>
                        )}
                      </Pressable>
                      <Text
                        style={[styles.coverTitle, isSelected && styles.coverTitleSelected]}
                        numberOfLines={2}
                      >
                        {track.name}
                      </Text>
                    </Animated.View>
                  );
                }}
              />
            </>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <GradientButton
          label={
            loading ? 'Saving…'
            : picked < 2 ? `${2 - picked} more song${2 - picked > 1 ? 's' : ''} to go`
            : isLastArtist ? 'Finish & Continue'
            : 'Next Artist →'
          }
          onPress={handleNext}
          disabled={loading || picked !== 2}
        />
      </>
    );
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
        const atMax = selectedArtists.length >= 3;
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[6]}</Text>
            <Text style={styles.hint}>Search and pick 3 artists — order matters (rank 1 is your #1)</Text>

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

            {!atMax && (
              <>
                <TextInput
                  value={artistQuery}
                  onChangeText={handleArtistSearch}
                  placeholder="Search artists…"
                  autoCapitalize="words"
                  returnKeyType="search"
                />
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
              {selectedArtists.length} / 3 selected{atMax ? ' ✓' : ''}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton label={loading ? 'Saving…' : 'Continue'} onPress={handleNext}
              disabled={loading || selectedArtists.length !== 3} />
          </>
        );
      }

      // Steps 7–9: Per-artist jukebox song picker
      case 7: return renderArtistSongStep(0);
      case 8: return renderArtistSongStep(1);
      case 9: return renderArtistSongStep(2);

      // Step 10: Ethnicity
      case 10:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[10]}</Text>
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

      // Step 11: Distance
      case 11:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[11]}</Text>
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

      // Step 12: Photos
      case 12:
        return (
          <>
            <Text style={styles.stubEmoji}>📸</Text>
            <Text style={styles.question}>{STEP_LABELS[12]}</Text>
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
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

  // ── Jukebox song-picker ──────────────────────────────────────────────────

  jukeboxArtist: {
    fontSize: FontSize.title, fontFamily: FontFamily.semiBold,
    color: Colors.white, marginBottom: 4,
  },
  jukeboxMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
  },

  trackSearchContainer: { marginBottom: 12 },

  // Text search results list
  trackList: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, overflow: 'hidden', marginBottom: 12,
  },
  trackRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, gap: 12,
  },
  trackRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  trackRowSelected: { backgroundColor: 'rgba(255,255,255,0.18)' },
  trackRowDisabled: { opacity: 0.35 },
  trackIndicator: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  trackIndicatorSelected: { backgroundColor: Colors.white, borderColor: Colors.white },
  trackIndicatorCheck:    { fontSize: 12, color: Colors.gradientEnd, fontFamily: FontFamily.semiBold },
  trackRowName:         { flex: 1, fontSize: FontSize.md, fontFamily: FontFamily.regular, color: 'rgba(255,255,255,0.85)' },
  trackRowNameSelected: { color: Colors.white, fontFamily: FontFamily.semiBold },
  noTracksText: {
    fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)',
    fontFamily: FontFamily.regular, marginBottom: 8,
  },

  // Carousel container
  carouselWrapper: {
    marginTop: 8,
    marginHorizontal: -28, // break out of scroll padding to use full width
    marginBottom: 24,
  },
  carouselCenter: {
    height: COVER_SIZE + 60,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10, fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.6)', fontFamily: FontFamily.regular,
  },
  carouselHint: {
    fontSize: FontSize.xs, fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.5)', textAlign: 'center',
    marginBottom: 12, letterSpacing: 0.4,
  },

  // Individual cover item in carousel
  coverItem: {
    width: COVER_SIZE,
    marginHorizontal: COVER_MARGIN,
    alignItems: 'center',
  },
  coverImage: {
    width: COVER_SIZE, height: COVER_SIZE,
    borderRadius: 20,
  },
  coverPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  coverPlaceholderIcon: {
    fontSize: 64, color: 'rgba(255,255,255,0.35)',
  },
  coverDimmed: { opacity: 0.35 },
  coverSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  coverCheck: {
    fontSize: 48, color: Colors.white, fontFamily: FontFamily.semiBold,
  },
  coverTitle: {
    marginTop: 8, fontSize: 11, fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.75)', textAlign: 'center',
    width: COVER_SIZE,
  },
  coverTitleSelected: {
    color: Colors.white, fontFamily: FontFamily.semiBold,
  },

  // Distance
  distanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  distanceBtn: {
    flex: 1, minWidth: '40%', paddingVertical: 20,
    borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
  },
  distanceBtnSelected:      { backgroundColor: Colors.white, borderColor: Colors.white },
  distanceBtnLabel:         { fontSize: FontSize.xl, fontFamily: FontFamily.semiBold, color: Colors.white },
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
