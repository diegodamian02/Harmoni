import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import { Colors } from '../../src/theme/colors';
import { FontFamily, FontSize } from '../../src/theme/typography';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.9;
const SWIPE_THRESHOLD = SCREEN_W * 0.25;

type MatchUser = {
  _id: string;
  displayName: string;
  age?: number;
  profilePicture?: string;
  photos?: string[];
  bio?: string;
  topArtistNames: string[];
  similarityScore: number;
};

export default function SwipeScreen() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<MatchUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchPopup, setMatchPopup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ matches: MatchUser[] }>('/match');
        setProfiles(data.matches ?? []);
      } catch {
        /* show empty state */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const swipe = async (direction: 'like' | 'dislike') => {
    const current = profiles[currentIndex];
    if (!current) return;

    const toX = direction === 'like' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;

    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((i) => i + 1);

      if (direction === 'like') {
        try {
          const res = await api.post<{ mutualMatch: boolean }>('/match/swipe', {
            targetUserId: current._id,
            action: 'like',
          });
          if (res.mutualMatch) setMatchPopup(current.displayName);
        } catch {}
      } else {
        await api.post('/match/swipe', { targetUserId: current._id, action: 'dislike' }).catch(() => {});
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx, dy }) => position.setValue({ x: dx, y: dy }),
      onPanResponderRelease: (_, { dx }) => {
        if (dx > SWIPE_THRESHOLD) swipe('like');
        else if (dx < -SWIPE_THRESHOLD) swipe('dislike');
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      },
    })
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const likeOpacity = position.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1] });
  const dislikeOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0] });

  const current = profiles[currentIndex];

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.header}>Harmoni</Text>

      {loading && <Text style={styles.emptyText}>Finding your matches...</Text>}

      {!loading && !current && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎵</Text>
          <Text style={styles.emptyText}>No more profiles right now.</Text>
          <Text style={styles.emptySubtext}>Check back soon for new music lovers!</Text>
        </View>
      )}

      {!loading && current && (
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: current.photos?.[0] ?? current.profilePicture ?? undefined }}
            style={styles.cardImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.cardGradient}
          />

          {/* LIKE / NOPE overlays */}
          <Animated.View style={[styles.overlayBadge, styles.likeBadge, { opacity: likeOpacity }]}>
            <Text style={styles.likeBadgeText}>LIKE ❤️</Text>
          </Animated.View>
          <Animated.View style={[styles.overlayBadge, styles.nopeBadge, { opacity: dislikeOpacity }]}>
            <Text style={styles.nopeBadgeText}>NOPE ✕</Text>
          </Animated.View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>
              {current.displayName}{current.age ? `, ${current.age}` : ''}
            </Text>
            {current.bio ? <Text style={styles.cardBio} numberOfLines={2}>{current.bio}</Text> : null}
            <View style={styles.artistChips}>
              {current.topArtistNames.slice(0, 3).map((a) => (
                <View key={a} style={styles.chip}>
                  <Text style={styles.chipText}>🎵 {a}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Match popup */}
      {matchPopup && (
        <View style={styles.matchOverlay}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            style={styles.matchCard}
          >
            <Text style={styles.matchEmoji}>🎶</Text>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>You and {matchPopup} both liked each other</Text>
            <Text style={styles.matchDismiss} onPress={() => setMatchPopup(null)}>
              Keep Swiping
            </Text>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgDark, alignItems: 'center' },
  header: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    width: CARD_W,
    height: SCREEN_H * 0.65,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  overlayBadge: {
    position: 'absolute',
    top: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeBadge: {
    right: 16,
    borderColor: Colors.like,
    transform: [{ rotate: '12deg' }],
  },
  nopeBadge: {
    left: 16,
    borderColor: Colors.dislike,
    transform: [{ rotate: '-12deg' }],
  },
  likeBadgeText: {
    color: Colors.like,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
  },
  nopeBadgeText: {
    color: Colors.dislike,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  cardName: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  cardBio: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  artistChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  chip: {
    backgroundColor: 'rgba(255,105,180,0.3)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semiBold,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  matchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchCard: {
    width: '85%',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  matchEmoji: { fontSize: 64, marginBottom: 12 },
  matchTitle: {
    fontSize: FontSize.title,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  matchSubtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  matchDismiss: {
    marginTop: 24,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
    textDecorationLine: 'underline',
  },
});
