import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { FontFamily, FontSize } from './typography';

// Reusable stylesheet atoms — import these in any screen instead of redefining
export const shared = StyleSheet.create({
  // Layouts
  screen: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgDark,
  },

  // Cards (white, rounded, shadowed — matches .auth-container)
  card: {
    width: '100%',
    maxWidth: 400,
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

  // Inputs — matches .input (border-radius: 25px, pink focus)
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

  // Primary pill button — matches .button (gradient bg handled via LinearGradient wrapper)
  pillButton: {
    width: '90%',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  pillButtonText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },

  // Spotify button — matches .spotify-button
  spotifyButton: {
    width: '90%',
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: Colors.spotify,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  spotifyButtonText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },

  // Titles
  heroTitle: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },

  // Links / accent text
  linkText: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
  },

  // Divider
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 16,
  },
});
