import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/theme/colors';
import { FontFamily, FontSize } from '../../src/theme/typography';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header gradient band */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.headerBand}
        />

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {user.displayName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.email}>{user.email}</Text>

        {/* Top Artists */}
        {user.topArtistNames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Artists</Text>
            <View style={styles.chipRow}>
              {user.topArtistNames.slice(0, 5).map((a) => (
                <View key={a} style={styles.chip}>
                  <Text style={styles.chipText}>🎵 {a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Tracks */}
        {user.topTrackNames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Tracks</Text>
            <View style={styles.chipRow}>
              {user.topTrackNames.slice(0, 5).map((t) => (
                <View key={t} style={[styles.chip, styles.trackChip]}>
                  <Text style={styles.chipText}>🎶 {t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Settings row */}
        <View style={styles.section}>
          <Pressable style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Edit Profile</Text>
            <Text style={styles.settingsArrow}>›</Text>
          </Pressable>
          <View style={styles.separator} />
          <Pressable style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Preferences</Text>
            <Text style={styles.settingsArrow}>›</Text>
          </Pressable>
          <View style={styles.separator} />
          <Pressable style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Notifications</Text>
            <Text style={styles.settingsArrow}>›</Text>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgDark },
  scroll: { alignItems: 'center', paddingBottom: 40 },
  headerBand: { width: '100%', height: 120 },
  avatarWrapper: {
    marginTop: -56,
    marginBottom: 12,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: Colors.bgDark,
    overflow: 'hidden',
  },
  avatar: { width: 112, height: 112 },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    backgroundColor: Colors.bgNav,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  name: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  email: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },
  section: {
    width: '90%',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: 'rgba(255,105,180,0.15)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  trackChip: {
    borderColor: Colors.deep,
    backgroundColor: 'rgba(115,16,90,0.15)',
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingsLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
  },
  settingsArrow: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  separator: { height: 1, backgroundColor: Colors.bgNav },
  logoutBtn: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.dislike,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.dislike,
  },
});
