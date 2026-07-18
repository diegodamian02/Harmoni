import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { GoogleButton } from '../../src/components/GoogleButton';
import { GradientButton } from '../../src/components/GradientButton';
import { TextInput } from '../../src/components/TextInput';
import { useAuth } from '../../src/context/AuthContext';
import { useAppleAuth } from '../../src/hooks/useAppleAuth';
import { useGoogleAuth } from '../../src/hooks/useGoogleAuth';
import { api } from '../../src/lib/api';
import { Colors } from '../../src/theme/colors';
import { FontFamily, FontSize } from '../../src/theme/typography';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const { setAuthToken } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { signIn: appleSignIn } = useAppleAuth();
  const { promptAsync, ready: googleReady } = useGoogleAuth();

  const handleSignup = async () => {
    if (!username || !email || !password) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ token: string }>('/auth/register', { username, email, password });
      await setAuthToken(data.token);
    } catch (e: any) {
      setError(e.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setError('');
    try {
      await appleSignIn();
    } catch (e: any) {
      if (e.code !== 'ERR_CANCELED') setError(e.message ?? 'Apple sign in failed');
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await promptAsync();
    } catch (e: any) {
      setError(e.message ?? 'Google sign in failed');
    }
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

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Sign Up</Text>

              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={50}
                  style={styles.appleBtn}
                  onPress={handleApple}
                />
              )}

              <GoogleButton
                label="Sign up with Google"
                onPress={handleGoogle}
                disabled={!googleReady}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or use email</Text>
                <View style={styles.dividerLine} />
              </View>

              <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
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
                label={loading ? 'Creating account…' : 'Sign Up'}
                onPress={handleSignup}
                disabled={loading}
              />

              <Pressable onPress={() => router.push('/(auth)/login')} style={styles.switchRow}>
                <Text style={styles.switchText}>Already have an account? </Text>
                <Text style={styles.switchLink}>Log In</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner:  { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  backRow: {
    position: 'absolute',
    top: 16,
    left: 24,
    padding: 8,
    zIndex: 10,
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
    marginBottom: 12,
  },
  appleBtn: {
    width: '90%',
    height: 48,
    marginTop: 0,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginVertical: 16,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  error: {
    color: Colors.dislike,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    marginTop: 4,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    marginTop: 20,
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
