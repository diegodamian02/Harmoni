import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';

type Props = {
  label?: string;
  onPress: () => void;
};

export function SpotifyButton({ label = 'Continue with Spotify', onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '90%',
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: Colors.spotify,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  pressed: {
    backgroundColor: Colors.spotifyPressed,
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
});
