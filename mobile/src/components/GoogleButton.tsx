import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily, FontSize } from '../theme/typography';

type Props = {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
};

export function GoogleButton({ label = 'Continue with Google', onPress, disabled = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <View style={styles.inner}>
        <Text style={styles.gLogo}>G</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '90%',
    paddingVertical: 13,
    borderRadius: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DADCE0',
    marginTop: 12,
  },
  pressed: {
    backgroundColor: '#F5F5F5',
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gLogo: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: '#4285F4',
  },
  label: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: '#3C4043',
  },
});
