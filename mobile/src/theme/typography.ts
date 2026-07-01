import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins';

export { Poppins_300Light, Poppins_400Regular, Poppins_600SemiBold, useFonts };

export const FontFamily = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  semiBold: 'Poppins_600SemiBold',
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 32,
  hero: 40,
} as const;
