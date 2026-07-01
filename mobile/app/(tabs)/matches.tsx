import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../../src/lib/api';
import { Colors } from '../../src/theme/colors';
import { FontFamily, FontSize } from '../../src/theme/typography';

type Match = {
  _id: string;
  displayName: string;
  profilePicture?: string;
  photos?: string[];
  topArtistNames: string[];
};

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ matches: Match[] }>('/match/mutual')
      .then((d) => setMatches(d.matches ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.header}>Matches</Text>

      {!loading && matches.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎶</Text>
          <Text style={styles.emptyText}>No matches yet</Text>
          <Text style={styles.emptySubtext}>Keep swiping — your music soulmate is out there.</Text>
        </View>
      )}

      <FlatList
        data={matches}
        keyExtractor={(m) => m._id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable
            style={styles.matchCard}
            onPress={() => router.push(`/(tabs)/messages?userId=${item._id}&name=${item.displayName}`)}
          >
            <Image
              source={{ uri: item.photos?.[0] ?? item.profilePicture ?? undefined }}
              style={styles.avatar}
            />
            <View style={styles.matchInfo}>
              <Text style={styles.matchName} numberOfLines={1}>{item.displayName}</Text>
              {item.topArtistNames[0] && (
                <Text style={styles.matchArtist} numberOfLines={1}>🎵 {item.topArtistNames[0]}</Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    padding: 20,
    paddingBottom: 12,
  },
  grid: { paddingHorizontal: 12, paddingBottom: 20 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  matchCard: {
    width: '48%',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    aspectRatio: 0.75,
    resizeMode: 'cover',
  },
  matchInfo: {
    padding: 10,
  },
  matchName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  matchArtist: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
