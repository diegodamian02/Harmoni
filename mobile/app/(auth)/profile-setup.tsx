import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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

const TOTAL_STEPS = 9;

const GENRES = [
  'Pop', 'Hip-Hop', 'R&B', 'Rock', 'Electronic',
  'Country', 'Jazz', 'Classical', 'Latin', 'Metal',
  'Indie', 'Folk', 'Reggae', 'Soul', 'Blues',
  'Punk', 'Alternative', 'K-Pop', 'Dance', 'Afrobeats',
];

const STEP_LABELS = [
  "What's your name?",
  "When's your birthday?",
  "What's your gender?",
  'Who are you interested in?',
  "What's your phone number?",
  'Pick your top genres',
  'Your favorite artists',
  'Your favorite songs',
  'Add your photos',
];

function calcAge(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function suggestNameFromEmail(email?: string | null): string {
  if (!email) return '';
  const raw = email.split('@')[0].replace(/[0-9._-]/g, ' ').trim().split(/\s+/)[0];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

type PartialUser = { interestedIn?: string; musicProfile?: { genres?: string[] } } | null;

function computeInitialStep(user: PartialUser): number {
  if (!user) return 0;
  if ((user.musicProfile?.genres?.length ?? 0) >= 3) return 6;
  if (user.interestedIn) return 5;
  return 0;
}

export default function ProfileSetupScreen() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [step, setStep]       = useState(() => computeInitialStep(user));
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Step 0 — Name (pre-fill from existing profile or email)
  const [name, setName] = useState(() =>
    user?.displayName?.split(' ')[0] || suggestNameFromEmail(user?.email)
  );

  // Step 1 — Birthday
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const [birthday, setBirthday] = useState<Date>(() =>
    user?.birthday ? new Date(user.birthday) : new Date(2000, 0, 1)
  );

  // Step 2 — Gender
  const [gender, setGender] = useState(() => user?.gender ?? '');

  // Step 3 — Interested in
  const [interestedIn, setInterestedIn] = useState(() => user?.interestedIn ?? '');

  // Step 4 — Phone
  const [phone, setPhone] = useState(() => user?.phone ?? '');

  // Step 5 — Genres
  const [genres, setGenres] = useState<string[]>(() => user?.musicProfile?.genres ?? []);

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / TOTAL_STEPS,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const goBack = () => {
    setError('');
    if (step === 0) {
      logout().then(() => router.replace('/(auth)/landing'));
    } else {
      setStep(s => s - 1);
    }
  };

  const goNext = () => {
    setError('');
    setStep(s => s + 1);
  };

  const handleNext = async () => {
    setError('');

    if (step === 0) {
      if (!name.trim()) { setError('Please enter your name.'); return; }
      goNext();

    } else if (step === 1) {
      if (calcAge(birthday) < 18) { setError('You must be 18 or older to use Harmoni.'); return; }
      goNext();

    } else if (step === 2) {
      // auto-advance handles this step — button is a fallback
      if (!gender) { setError('Please select a gender.'); return; }
      goNext();

    } else if (step === 3) {
      if (!interestedIn) { setError('Please make a selection.'); return; }
      goNext();

    } else if (step === 4) {
      if (phone && !/^\+?[\d\s\-().]{7,15}$/.test(phone)) {
        setError('Please enter a valid phone number.');
        return;
      }
      setLoading(true);
      try {
        await api.patch('/user/basic-info', {
          name: name.trim(),
          birthday: birthday.toISOString(),
          gender,
          interestedIn,
          phone: phone.trim() || null,
        });
        goNext();
      } catch (e: any) {
        setError(e.message ?? 'Failed to save. Please try again.');
      } finally {
        setLoading(false);
      }

    } else if (step === 5) {
      if (genres.length !== 3) { setError('Pick exactly 3 genres to continue.'); return; }
      setLoading(true);
      try {
        await api.patch('/user/music-genres', { genres });
        goNext();
      } catch (e: any) {
        setError(e.message ?? 'Failed to save. Please try again.');
      } finally {
        setLoading(false);
      }

    } else if (step >= 6 && step < 8) {
      goNext();

    } else if (step === 8) {
      // TODO: replace with real photos upload before launch
      setLoading(true);
      try {
        await api.post('/user/profile/complete', {});
        await refreshUser();
      } catch (e: any) {
        setError(e.message ?? 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      // ─── Step 0: Name ───────────────────────────────────────────────
      case 0:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[0]}</Text>
            <Text style={styles.hint}>This is how you'll appear to others</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="First name"
              autoFocus
              autoCapitalize="words"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton label="Continue" onPress={handleNext} />
          </>
        );

      // ─── Step 1: Birthday ────────────────────────────────────────────
      case 1:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[1]}</Text>
            <Text style={styles.hint}>You must be 18+ to use Harmoni</Text>
            <View style={styles.pickerCard}>
              <DateTimePicker
                value={birthday}
                mode="date"
                display="spinner"
                onChange={(_, date) => date && setBirthday(date)}
                maximumDate={maxDate}
                minimumDate={new Date(1920, 0, 1)}
                textColor={Colors.textDark}
                style={styles.datePicker}
              />
            </View>
            <Text style={styles.ageTag}>
              {calcAge(birthday) >= 18
                ? `You're ${calcAge(birthday)} years old ✓`
                : 'You must be 18 or older'}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton label="Continue" onPress={handleNext} />
          </>
        );

      // ─── Step 2: Gender ──────────────────────────────────────────────
      case 2:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[2]}</Text>
            <View style={styles.chipCol}>
              {['Man', 'Woman', 'Other'].map(g => (
                <Pressable
                  key={g}
                  style={[styles.bigChip, gender === g && styles.bigChipSelected]}
                  onPress={() => {
                    setGender(g);
                    setTimeout(goNext, 350);
                  }}
                >
                  <Text style={[styles.bigChipText, gender === g && styles.bigChipTextSelected]}>
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        );

      // ─── Step 3: Interested in ───────────────────────────────────────
      case 3:
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[3]}</Text>
            <View style={styles.chipCol}>
              {['Men', 'Women', 'Everyone'].map(i => (
                <Pressable
                  key={i}
                  style={[styles.bigChip, interestedIn === i && styles.bigChipSelected]}
                  onPress={() => {
                    setInterestedIn(i);
                    setTimeout(goNext, 350);
                  }}
                >
                  <Text style={[styles.bigChipText, interestedIn === i && styles.bigChipTextSelected]}>
                    {i}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        );

      // ─── Step 4: Phone ───────────────────────────────────────────────
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
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="(555) 000-0000"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <Text style={styles.skipLink} onPress={goNext}>Skip for now</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton
              label={loading ? 'Saving…' : 'Continue'}
              onPress={handleNext}
              disabled={loading}
            />
          </>
        );

      // ─── Step 5: Genre picker ────────────────────────────────────────
      case 5: {
        const atMax = genres.length >= 3;
        return (
          <>
            <Text style={styles.question}>{STEP_LABELS[5]}</Text>
            <Text style={styles.hint}>Choose exactly 3 that define your taste</Text>
            <Text style={[styles.genreCounter, atMax && styles.genreCounterFull]}>
              {genres.length} / 3 selected{atMax ? ' ✓' : ''}
            </Text>
            <View style={styles.genreWrap}>
              {GENRES.map(g => {
                const selected = genres.includes(g);
                const disabled = atMax && !selected;
                return (
                  <Pressable
                    key={g}
                    style={[
                      styles.genreChip,
                      selected && styles.genreChipSelected,
                      disabled && styles.genreChipDisabled,
                    ]}
                    onPress={() => {
                      if (selected) {
                        setGenres(prev => prev.filter(x => x !== g));
                      } else if (!atMax) {
                        setGenres(prev => [...prev, g]);
                      }
                    }}
                  >
                    <Text style={[styles.genreChipText, selected && styles.genreChipTextSelected]}>
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton
              label={loading ? 'Saving…' : 'Continue'}
              onPress={handleNext}
              disabled={loading || genres.length !== 3}
            />
          </>
        );
      }

      // ─── Steps 6–7: Music stubs ──────────────────────────────────────
      case 6:
      case 7: {
        const icons = ['🎤', '🎧'];
        const hints = [
          'Search and pick 4 artists you love',
          'Pick 2 songs per artist (8 total)',
        ];
        const idx = step - 6;
        return (
          <>
            <Text style={styles.stubEmoji}>{icons[idx]}</Text>
            <Text style={styles.question}>{STEP_LABELS[step]}</Text>
            <Text style={styles.hint}>{hints[idx]}</Text>
            <View style={styles.stubBadge}>
              <Text style={styles.stubBadgeText}>Coming next session</Text>
            </View>
            <GradientButton label="Continue" onPress={handleNext} />
          </>
        );
      }

      // ─── Step 8: Photos stub ─────────────────────────────────────────
      case 8:
        return (
          <>
            <Text style={styles.stubEmoji}>📸</Text>
            <Text style={styles.question}>{STEP_LABELS[8]}</Text>
            <Text style={styles.hint}>Show the real you — at least 1 photo required</Text>
            <View style={styles.stubBadge}>
              <Text style={styles.stubBadgeText}>Coming next session</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton
              label={loading ? 'Setting up…' : 'Start Matching 🎵'}
              onPress={handleNext}
              disabled={loading}
            />
          </>
        );

      default:
        return null;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.stepCount}>{step + 1}/{TOTAL_STEPS}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner:  { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  backArrow: {
    fontSize: 32,
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    lineHeight: 34,
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  stepCount: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semiBold,
    color: 'rgba(255,255,255,0.7)',
    minWidth: 32,
    textAlign: 'right',
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
  },

  question: {
    fontSize: FontSize.title,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'left',
  },
  hint: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 28,
  },

  // Birthday picker
  pickerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  datePicker: {
    width: '100%',
  },
  ageTag: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Chips (gender / interested in)
  chipCol: {
    gap: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  bigChip: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  bigChipSelected: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  bigChipText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  bigChipTextSelected: {
    color: Colors.gradientEnd,
  },

  // Phone
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  countryCode: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  phoneInputWrap: { flex: 1 },
  skipLink: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 16,
    textDecorationLine: 'underline',
  },

  // Genre picker
  genreCounter: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  genreCounterFull: {
    color: Colors.white,
  },
  genreWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  genreChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'transparent',
  },
  genreChipSelected: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  genreChipDisabled: {
    opacity: 0.35,
  },
  genreChipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  genreChipTextSelected: {
    color: Colors.gradientEnd,
  },

  // Stubs
  stubEmoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 16,
  },
  stubBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  stubBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: 'rgba(255,255,255,0.7)',
  },

  error: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#FFB3B3',
    textAlign: 'center',
    marginBottom: 12,
  },
});
