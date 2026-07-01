import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/theme/colors';

SplashScreen.preventAutoHideAsync();

function RootGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';

    if (!user && !inAuth) {
      router.replace('/(auth)/landing');
    } else if (user && !user.profileComplete && !inAuth) {
      router.replace('/(auth)/profile-setup');
    } else if (user && user.profileComplete && (inAuth || segments.length === 0)) {
      router.replace('/(tabs)/swipe');
    }
  }, [user, loading, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: Colors.bgDark }} />;

  return (
    <AuthProvider>
      <RootGuard />
    </AuthProvider>
  );
}
