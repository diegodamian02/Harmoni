import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function useAppleAuth() {
  const { setAuthToken } = useAuth();

  const signIn = async () => {
    if (Platform.OS !== 'ios') return;

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) throw new Error('Apple did not return an identity token');

    const data = await api.post<{ token: string }>('/auth/apple', {
      identityToken: credential.identityToken,
      fullName: credential.fullName,
    });

    await setAuthToken(data.token);
  };

  return { signIn };
}
