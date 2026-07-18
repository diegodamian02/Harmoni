import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

const { width: SCREEN_W } = Dimensions.get('window');
const LETTERS = ['H', 'a', 'r', 'm', 'o', 'n', 'i'];

const WAVE_STAGGER = 100;   // ms between each letter's wave
const LIFT_HEIGHT  = 28;   // px each letter rises
const SETTLE_DELAY = 120;  // ms after all letters land before tagline appears

type Props = { onFinish: () => void };

function Letter({ char, index, totalLetters }: { char: string; index: number; totalLetters: number }) {
  const translateY = useSharedValue(60);
  const opacity    = useSharedValue(0);
  const scale      = useSharedValue(0.6);

  useEffect(() => {
    const entranceDelay = index * WAVE_STAGGER;
    const waveDelay     = totalLetters * WAVE_STAGGER + SETTLE_DELAY + index * WAVE_STAGGER;

    // Entrance: spring up from below
    translateY.value = withDelay(
      entranceDelay,
      withSpring(0, { damping: 12, stiffness: 180, mass: 0.8 })
    );
    opacity.value = withDelay(entranceDelay, withTiming(1, { duration: 220 }));
    scale.value   = withDelay(
      entranceDelay,
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    // Perpetual wave after entrance
    translateY.value = withDelay(
      waveDelay,
      withSequence(
        withTiming(-LIFT_HEIGHT, { duration: 280, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 8, stiffness: 160 })
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>;
}

export function SplashAnimation({ onFinish }: Props) {
  const taglineOpacity   = useSharedValue(0);
  const underlineOpacity = useSharedValue(0);
  const underlineScaleX  = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    const allLettersIn = LETTERS.length * WAVE_STAGGER + 400;

    // Underline pops in once all letters have landed
    underlineOpacity.value = withDelay(allLettersIn - 100, withTiming(1, { duration: 80 }));
    underlineScaleX.value  = withDelay(
      allLettersIn - 100,
      withSpring(1, { damping: 10, stiffness: 260 })
    );

    // Tagline fades in shortly after underline
    taglineOpacity.value = withDelay(
      allLettersIn + 80,
      withTiming(1, { duration: 600 })
    );

    // Fade out after tagline is visible; onFinish fires after total duration
    containerOpacity.value = withDelay(
      allLettersIn + 2200,
      withTiming(0, { duration: 900, easing: Easing.in(Easing.quad) })
    );

    // allLettersIn(1100) + 2200 delay + 900 fade + 300 buffer = 4500ms
    const t = setTimeout(onFinish, allLettersIn + 2200 + 900 + 300);
    return () => clearTimeout(t);
  }, []);

  const containerStyle  = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const taglineStyle    = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const underlineStyle  = useAnimatedStyle(() => ({
    opacity: underlineOpacity.value,
    transform: [{ scaleX: underlineScaleX.value }],
  }));

  return (
    <Animated.View style={[styles.screen, containerStyle]}>
      {/* Ambient glow blobs */}
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <View style={styles.center}>
        {/* Wave letters */}
        <View style={styles.wordRow}>
          {LETTERS.map((char, i) => (
            <Letter key={i} char={char} index={i} totalLetters={LETTERS.length} />
          ))}
        </View>

        {/* Gradient underline — pops in after all letters land */}
        <Animated.View style={underlineStyle}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.underline}
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          The dating app for music lovers
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  glow: {
    position: 'absolute',
    width: SCREEN_W * 1.2,
    height: SCREEN_W * 1.2,
    borderRadius: SCREEN_W * 0.6,
    opacity: 0.15,
  },
  glowTop: {
    top: -SCREEN_W * 0.6,
    backgroundColor: Colors.primary,
  },
  glowBottom: {
    bottom: -SCREEN_W * 0.7,
    backgroundColor: Colors.deep,
  },
  center: {
    alignItems: 'center',
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  letter: {
    fontSize: 72,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  underline: {
    width: 188,
    height: 3,
    borderRadius: 2,
  },
  tagline: {
    marginTop: 20,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
});
