import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GradientButton } from '../../src/components/GradientButton';
import { SpotifyButton } from '../../src/components/SpotifyButton';
import { Colors } from '../../src/theme/colors';
import { FontFamily, FontSize } from '../../src/theme/typography';

WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = __DEV__ ? 'http://localhost:8333' : 'https://your-production-url.railway.app';

export default function LandingScreen() {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleOptions = () => {
    const toValue = showOptions ? 0 : 1;
    setShowOptions(!showOptions);
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const handleSpotifySignup = () => {
    WebBrowser.openBrowserAsync(`${BACKEND_URL}/auth/spotify`);
  };

  const sheetTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });
  const sheetOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.screen}>
      {/* Background gradient overlay at top */}
      <LinearGradient
        colors={['rgba(115,16,90,0.3)', 'transparent']}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <Text style={styles.title}>Harmoni</Text>
        <Text style={styles.subtitle}>The dating app for music lovers</Text>

        <GradientButton label="Get Started" onPress={toggleOptions} />
      </View>

      {/* Slide-up options sheet */}
      {showOptions && (
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetTranslate }], opacity: sheetOpacity },
          ]}
        >
          <Text style={styles.sheetTitle}>Select a Sign-Up Method</Text>

          <SpotifyButton label="Sign Up with Spotify" onPress={handleSpotifySignup} />

          <GradientButton
            label="Sign Up with Email"
            onPress={() => router.push('/(auth)/signup')}
          />

          <View style={styles.divider} />

          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text style={styles.loginLink}>Log In</Text>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 40,
    textAlign: 'center',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    marginBottom: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 16,
  },
  loginRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  loginText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textDark,
  },
  loginLink: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
});
