import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import { Colors } from '../../src/theme/colors';
import { FontFamily, FontSize } from '../../src/theme/typography';

type Message = {
  _id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export default function MessagesScreen() {
  const router = useRouter();
  const { userId, name } = useLocalSearchParams<{ userId?: string; name?: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const isThread = !!userId;

  useEffect(() => {
    if (!userId) return;
    api.get<{ messages: Message[] }>(`/messages/${userId}`)
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {});
  }, [userId]);

  const sendMessage = async () => {
    if (!input.trim() || !userId) return;
    const text = input.trim();
    setInput('');
    try {
      const msg = await api.post<Message>(`/messages/${userId}`, { text });
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch {}
  };

  if (!isThread) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.header}>Messages</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Match with someone to start chatting.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.threadHeader}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.threadName}>{name ?? 'Chat'}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m._id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?._id;
            return (
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                  {item.text}
                </Text>
              </View>
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Say something..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable onPress={sendMessage} style={styles.sendBtn}>
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgDark },
  flex: { flex: 1 },
  header: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    padding: 20,
    paddingBottom: 12,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgNav,
  },
  backBtn: { padding: 4, marginRight: 8 },
  backArrow: {
    fontSize: 32,
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    lineHeight: 32,
  },
  threadName: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  messageList: { padding: 16, gap: 8 },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginVertical: 2,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.bgNav,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
  },
  bubbleTextMine: { color: Colors.white },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.bgNav,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.bgNav,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: Colors.white, fontSize: 18 },
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
