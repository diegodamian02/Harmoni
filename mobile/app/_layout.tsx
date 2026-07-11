import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/theme/colors';

console.log('[Layout] module loaded');

// catch silent JS crashes
const _origHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
(global as any).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal: boolean) => {
  console.log('[CRASH]', error?.message, error?.stack?.slice(0, 800));
  _origHandler?.(error, isFatal);
});

SplashScreen.preventAutoHideAsync().catch(() => {});
console.log('[Layout] preventAutoHideAsync called');

function RootGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  console.log('[RootGuard] render — loading:', loading, 'user:', !!user, 'segments:', segments);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      console.log('[RootGuard] → landing');
      router.replace('/(auth)/landing');
    } else if (user && !user.profileComplete && !inAuth) {
      console.log('[RootGuard] → profile-setup');
      router.replace('/(auth)/profile-setup');
    } else if (user && user.profileComplete && inAuth) {
      console.log('[RootGuard] → swipe');
      router.replace('/(tabs)/swipe');
    }
  }, [user, loading, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  console.log('[RootLayout] render');
  const [fontsLoaded, fontError] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });
  const [fontTimedOut, setFontTimedOut] = useState(false);

  console.log('[RootLayout] fonts — loaded:', fontsLoaded, 'error:', !!fontError, 'timedOut:', fontTimedOut);

  useEffect(() => {
    console.log('[RootLayout] starting 3s font timeout');
    const t = setTimeout(() => {
      console.log('[RootLayout] font timeout fired');
      setFontTimedOut(true);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  const ready = fontsLoaded || !!fontError || fontTimedOut;

  useEffect(() => {
    if (ready) {
      console.log('[RootLayout] hiding splash screen');
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    console.log('[RootLayout] waiting for fonts...');
    return <View style={{ flex: 1, backgroundColor: Colors.bgDark }} />;
  }

  return (
    <AuthProvider>
      <RootGuard />
    </AuthProvider>
  );
}
