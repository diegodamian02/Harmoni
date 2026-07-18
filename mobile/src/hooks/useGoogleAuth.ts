import * as Google from 'expo-auth-session/providers/google';
import { exchangeCodeAsync } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { setAuthToken } = useAuth();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? 'not-configured',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? 'not-configured',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;
    console.log('[Google] response type:', response.type);
    if (response.type === 'error') {
      console.log('[Google] error:', JSON.stringify(response.error));
      return;
    }
    if (response.type !== 'success') return;

    const handleAuth = async () => {
      try {
        // Web flow returns id_token directly; native iOS returns authorization code
        let idToken: string | null = response.params?.id_token ?? null;

        if (!idToken && response.params?.code) {
          console.log('[Google] native flow — exchanging code for tokens...');
          const clientId = Platform.OS === 'ios'
            ? (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '')
            : (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '');

          const tokenResult = await exchangeCodeAsync(
            {
              clientId,
              code: response.params.code,
              redirectUri: request!.redirectUri,
              extraParams: request?.codeVerifier
                ? { code_verifier: request.codeVerifier }
                : {},
            },
            { tokenEndpoint: 'https://oauth2.googleapis.com/token' }
          );

          console.log('[Google] token exchange complete, idToken present:', !!tokenResult.idToken);
          idToken = tokenResult.idToken ?? null;
        }

        if (!idToken) {
          console.log('[Google] no id_token available — params:', JSON.stringify(response.params));
          return;
        }

        console.log('[Google] sending idToken to server...');
        const data = await api.post<{ token: string }>('/auth/google', { idToken });
        console.log('[Google] server responded with token');
        await setAuthToken(data.token);
      } catch (err: any) {
        console.error('[Google] auth error:', err?.message ?? err);
      }
    };

    handleAuth();
  }, [response]);

  console.log('[Google] redirectUri:', request?.redirectUri);
  return { promptAsync, ready: !!request };
}
