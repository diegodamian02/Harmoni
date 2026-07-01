import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { GradientButton } from '../../src/components/GradientButton';
import { SpotifyButton } from '../../src/components/SpotifyButton';
import { TextInput } from '../../src/components/TextInput';
import { useAuth } from '../../src/context/AuthContext';
import { api, saveToken } from '../../src/lib/api';
import { Colors } from '../../src/theme/colors';
import { FontFamily, FontSize } from '../../src/theme/typography';

const BACKEND_URL = __DEV__ ? 'http://localhost:8333' : 'https://your-production-url.railway.app';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ token: string }>('/auth/login', { email, password });
      await setAuthToken(data.token);
    } catch (e: any) {
      setError(e.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifyLogin = () => {
    WebBrowser.openBrowserAsync(`${BACKEND_URL}/auth/spotify`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable onPress={() => router.back()} style={styles.backRow}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.title}>Log In</Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradientButton
              label={loading ? 'Logging in...' : 'Log In'}
              onPress={handleLogin}
              disabled={loading}
            />

            <View style={styles.divider} />

            <SpotifyButton label="Log In with Spotify" onPress={handleSpotifyLogin} />

            <Pressable onPress={() => router.push('/(auth)/signup')} style={styles.switchRow}>
              <Text style={styles.switchText}>Don't have an account? </Text>
              <Text style={styles.switchLink}>Sign Up</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backRow: {
    position: 'absolute',
    top: 16,
    left: 24,
    padding: 8,
  },
  backArrow: {
    fontSize: 36,
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    lineHeight: 36,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.semiBold,
    color: Colors.textDark,
    marginBottom: 8,
  },
  error: {
    color: Colors.dislike,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 16,
  },
  switchRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  switchText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textDark,
  },
  switchLink: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
});
