import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../context/AppContext';

export default function MyWalksScreen({ navigation }) {
  const { walks, rsvps } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [tab, setTab] = useState('upcoming');

  function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    if (dateStr.includes('/')) {
      const [dd, mm, yyyy] = dateStr.split('/');
      return new Date(`${yyyy}-${mm}-${dd}`);
    }
    return new Date(dateStr);
  }

  const sortByDate = (list) => [...list].sort((a, b) => parseDate(a.date) - parseDate(b.date));

  const hosting = sortByDate(walks.filter((w) => w.organizerId === 'user-1'));
  const attendingWalkIds = rsvps
    .filter((r) => r.userId === 'user-1' && r.status === 'going')
    .map((r) => r.walkId);
  const attending = sortByDate(
    walks.filter((w) => attendingWalkIds.includes(w.id) && w.organizerId !== 'user-1')
  );

  const hasContent = hosting.length > 0 || attending.length > 0;

  const goToDetail = (walkId) => {
    navigation.navigate('Explore', { screen: 'WalkDetail', params: { walkId } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Walks</Text>
      </View>

      <View style={styles.tabs}>
        {['upcoming', 'past'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'upcoming' ? 'Upcoming' : 'Past'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'past' && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No past walks yet</Text>
            <Text style={styles.emptySub}>Completed walks will appear here</Text>
          </View>
        )}

        {tab === 'upcoming' && !hasContent && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={styles.emptyTitle}>No walks yet</Text>
            <Text style={styles.emptySub}>Explore walks to join one, or create your own!</Text>
          </View>
        )}

        {tab === 'upcoming' && hosting.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Hosting</Text>
            {hosting.map((walk) => (
              <WalkItem key={walk.id} walk={walk} type="hosting" onPress={() => goToDetail(walk.id)} />
            ))}
          </>
        )}

        {tab === 'upcoming' && attending.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Attending</Text>
            {attending.map((walk) => (
              <WalkItem key={walk.id} walk={walk} type="attending" onPress={() => goToDetail(walk.id)} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function WalkItem({ walk, type, onPress }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const isHosting = type === 'hosting';
  return (
    <TouchableOpacity
      style={[styles.card, isHosting ? styles.cardHosting : styles.cardAttending]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.accent, isHosting ? styles.accentHosting : styles.accentAttending]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>{walk.title}</Text>
          <View style={[styles.badge, isHosting ? styles.badgeHosting : styles.badgeAttending]}>
            <Text style={[styles.badgeText, { color: isHosting ? colors.hosting : colors.primary }]}>
              {isHosting ? 'Hosting' : 'Attending'}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{walk.date} · {walk.time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{walk.location}</Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={12} color={isHosting ? colors.hosting : colors.primary} />
            <Text style={[styles.countText, { color: isHosting ? colors.hosting : colors.primary }]}>
              {walk.attendeeCount} {isHosting ? 'RSVP' : 'going'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: c.card },
    title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
    tabs: {
      flexDirection: 'row', backgroundColor: c.card,
      paddingHorizontal: 16, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    tabActive: { backgroundColor: c.primaryLight },
    tabText: { fontSize: 14, color: c.textSecondary, fontWeight: '500' },
    tabTextActive: { color: c.primary, fontWeight: '700' },
    scroll: { padding: 16, paddingBottom: 30 },
    sectionLabel: {
      fontSize: 12, fontWeight: '700', color: c.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4,
    },
    card: {
      backgroundColor: c.card, borderRadius: 14, marginBottom: 12,
      flexDirection: 'row', overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    cardHosting: { borderWidth: 1, borderColor: '#FDE68A' },
    cardAttending: { borderWidth: 1, borderColor: '#BFDBFE' },
    accent: { width: 4 },
    accentHosting: { backgroundColor: c.hosting },
    accentAttending: { backgroundColor: c.primary },
    cardBody: { flex: 1, padding: 12 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: c.textPrimary, flex: 1, marginRight: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeHosting: { backgroundColor: '#FEF3C7' },
    badgeAttending: { backgroundColor: '#DBEAFE' },
    badgeText: { fontSize: 11, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
    metaText: { fontSize: 12, color: c.textSecondary },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    countText: { fontSize: 12, fontWeight: '600' },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 6 },
    emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
  });
}
