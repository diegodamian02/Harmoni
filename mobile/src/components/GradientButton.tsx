import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function GradientButton({ label, onPress, disabled = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '90%',
    borderRadius: 50,
    overflow: 'hidden',
    marginTop: 12,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
});
