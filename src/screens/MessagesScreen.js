import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../context/AppContext';
import { supabase } from '../lib/supabase';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessagesScreen({ navigation }) {
  const { session } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [tab, setTab] = useState('direct');
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(() => {
    if (!session) return;
    supabase.rpc('get_conversations_for_user').then(({ data }) => {
      if (data) setConvs(data);
      setLoading(false);
    });
  }, [session]);

  useFocusEffect(loadConversations);

  const direct = convs.filter((c) => c.type === 'direct');
  const groups = convs.filter((c) => c.type === 'walk_group');
  const list = tab === 'direct' ? direct : groups;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'direct' && styles.tabActive]}
          onPress={() => setTab('direct')}
        >
          <Text style={[styles.tabText, tab === 'direct' && styles.tabTextActive]}>Direct</Text>
          {direct.length > 0 && (
            <View style={[styles.tabCount, tab === 'direct' && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, tab === 'direct' && styles.tabCountTextActive]}>
                {direct.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'group' && styles.tabActive]}
          onPress={() => setTab('group')}
        >
          <Text style={[styles.tabText, tab === 'group' && styles.tabTextActive]}>Walk Chats</Text>
          {groups.length > 0 && (
            <View style={[styles.tabCount, tab === 'group' && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, tab === 'group' && styles.tabCountTextActive]}>
                {groups.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() => navigation.navigate('Conversation', {
                conversationId: item.id,
                title: item.other_name || 'Conversation',
              })}
            />
          )}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={52} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'direct'
                  ? 'Message an organiser from a walk to start a chat'
                  : 'Join a walk to access its group chat'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function ConversationRow({ conversation, onPress }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const isGroup = conversation.type === 'walk_group';
  const name = conversation.other_name || 'Someone';
  const initial = name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, isGroup && styles.avatarGroup]}>
        {isGroup ? (
          <Ionicons name="paw" size={22} color={colors.primary} />
        ) : (
          <Text style={styles.avatarInitial}>{initial}</Text>
        )}
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
          {conversation.last_message_time && (
            <Text style={styles.rowTime}>{formatTime(conversation.last_message_time)}</Text>
          )}
        </View>
        <Text style={styles.rowPreview} numberOfLines={1}>
          {conversation.last_message || 'Tap to open conversation'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: c.card,
    },
    title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },

    // Tabs
    tabs: {
      flexDirection: 'row', backgroundColor: c.card,
      paddingHorizontal: 16, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    tab: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    },
    tabActive: { backgroundColor: c.primaryLight },
    tabText: { fontSize: 14, color: c.textSecondary, fontWeight: '500' },
    tabTextActive: { color: c.primary, fontWeight: '700' },
    tabCount: {
      backgroundColor: c.border,
      minWidth: 18, height: 18, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    },
    tabCountActive: { backgroundColor: c.primary },
    tabCountText: { fontSize: 10, fontWeight: '700', color: c.textMuted },
    tabCountTextActive: { color: '#fff' },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // Conversation rows
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: c.card,
    },
    avatar: {
      width: 50, height: 50, borderRadius: 25,
      backgroundColor: c.primary,
      alignItems: 'center', justifyContent: 'center', marginRight: 14,
      flexShrink: 0,
    },
    avatarGroup: { backgroundColor: '#DBEAFE' },
    avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '700' },
    rowBody: { flex: 1, minWidth: 0 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 },
    rowName: { fontSize: 15, fontWeight: '600', color: c.textPrimary, flex: 1, marginRight: 8 },
    rowTime: { fontSize: 12, color: c.textMuted, flexShrink: 0 },
    rowPreview: { fontSize: 13, color: c.textSecondary },
    separator: { height: 1, backgroundColor: c.border, marginLeft: 80 },

    // Empty
    empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary, marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20 },
  });
}
