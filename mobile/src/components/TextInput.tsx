import React, { useState } from 'react';
import { StyleSheet, TextInput as RNTextInput, TextInputProps, View } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';

type Props = TextInputProps & {
  containerStyle?: object;
};

export function TextInput({ containerStyle, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <RNTextInput
        {...props}
        style={[styles.input, focused && styles.focused, style]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={Colors.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    borderRadius: 25,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textDark,
    backgroundColor: Colors.white,
  },
  focused: {
    borderColor: Colors.inputFocus,
    shadowColor: Colors.inputFocus,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
});
