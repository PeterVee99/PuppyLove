import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/AppContext';
import { conversations, messageHistory } from '../data/mockData';

export default function ConversationScreen({ navigation, route }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { conversationId } = route.params;
  const conversation = conversations.find((c) => c.id === conversationId);
  const [messages, setMessages] = useState(messageHistory[conversationId] || []);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const name =
    conversation?.type === 'walk_group'
      ? conversation.walkName
      : conversation?.participantName;

  const send = () => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: 'user-1',
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <TouchableOpacity style={styles.infoBtn}>
          <Ionicons name="information-circle-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Bubble message={item} isOwn={item.senderId === 'user-1'} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onLayout={() => messages.length > 0 && listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages yet. Say hi! 👋</Text>
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message, isOwn }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{message.text}</Text>
        <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>{message.timestamp}</Text>
      </View>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 12,
      backgroundColor: c.card,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    backBtn: { padding: 4, marginRight: 4 },
    headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: c.textPrimary, textAlign: 'center' },
    infoBtn: { padding: 4 },
    listContent: { padding: 16, paddingBottom: 8 },
    empty: { alignItems: 'center', paddingTop: 40 },
    emptyText: { color: c.textMuted, fontSize: 14 },
    bubbleRow: { marginBottom: 10, alignItems: 'flex-start' },
    bubbleRowOwn: { alignItems: 'flex-end' },
    bubble: {
      maxWidth: '76%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
      backgroundColor: c.card,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    bubbleOwn: { backgroundColor: c.primary, borderBottomRightRadius: 4 },
    bubbleOther: { borderBottomLeftRadius: 4 },
    bubbleText: { fontSize: 15, color: c.textPrimary, lineHeight: 21 },
    bubbleTextOwn: { color: '#FFFFFF' },
    bubbleTime: { fontSize: 10, color: c.textMuted, marginTop: 4, textAlign: 'right' },
    bubbleTimeOwn: { color: 'rgba(255,255,255,0.65)' },
    inputRow: {
      flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10,
      backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border,
    },
    input: {
      flex: 1, backgroundColor: c.background, borderRadius: 22,
      paddingHorizontal: 16, paddingVertical: 10,
      fontSize: 15, color: c.textPrimary, maxHeight: 120,
    },
    sendBtn: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { backgroundColor: c.border },
  });
}
