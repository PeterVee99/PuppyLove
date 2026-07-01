import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../context/AppContext';

export default function MyWalksScreen({ navigation }) {
  const { walks, rsvps, session } = useApp();
  const userId = session?.user?.id;
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

  function formatDate(dateStr) {
    const d = parseDate(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  const sortAsc  = (list) => [...list].sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const sortDesc = (list) => [...list].sort((a, b) => parseDate(b.date) - parseDate(a.date));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isPast     = (w) => parseDate(w.date) < today;
  const isUpcoming = (w) => parseDate(w.date) >= today;

  const myWalks = walks.filter((w) => w.organizerId === userId);
  const attendingWalkIds = rsvps
    .filter((r) => r.userId === userId && r.status === 'going')
    .map((r) => r.walkId);
  const attendingWalks = walks.filter((w) => attendingWalkIds.includes(w.id) && w.organizerId !== userId);

  // Upcoming tab
  const hostingUpcoming  = sortAsc(myWalks.filter(isUpcoming));
  const attendingUpcoming = sortAsc(attendingWalks.filter(isUpcoming));

  // Past tab — most recent first
  const hostingPast   = sortDesc(myWalks.filter(isPast));
  const attendingPast = sortDesc(attendingWalks.filter(isPast));

  const hasUpcoming = hostingUpcoming.length > 0 || attendingUpcoming.length > 0;
  const hasPast     = hostingPast.length > 0 || attendingPast.length > 0;

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

        {/* ── Upcoming ── */}
        {tab === 'upcoming' && !hasUpcoming && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={styles.emptyTitle}>No upcoming walks</Text>
            <Text style={styles.emptySub}>Explore walks to join one, or create your own!</Text>
          </View>
        )}
        {tab === 'upcoming' && hostingUpcoming.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Hosting</Text>
            {hostingUpcoming.map((walk) => (
              <WalkItem key={walk.id} walk={walk} type="hosting" formatDate={formatDate} onPress={() => goToDetail(walk.id)} />
            ))}
          </>
        )}
        {tab === 'upcoming' && attendingUpcoming.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Attending</Text>
            {attendingUpcoming.map((walk) => (
              <WalkItem key={walk.id} walk={walk} type="attending" formatDate={formatDate} onPress={() => goToDetail(walk.id)} />
            ))}
          </>
        )}

        {/* ── Past ── */}
        {tab === 'past' && !hasPast && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No past walks yet</Text>
            <Text style={styles.emptySub}>Completed walks will appear here</Text>
          </View>
        )}
        {tab === 'past' && hostingPast.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Hosted</Text>
            {hostingPast.map((walk) => (
              <WalkItem key={walk.id} walk={walk} type="hosting" formatDate={formatDate} onPress={() => goToDetail(walk.id)} />
            ))}
          </>
        )}
        {tab === 'past' && attendingPast.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Attended</Text>
            {attendingPast.map((walk) => (
              <WalkItem key={walk.id} walk={walk} type="attending" formatDate={formatDate} onPress={() => goToDetail(walk.id)} />
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function WalkItem({ walk, type, formatDate, onPress }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const isHosting = type === 'hosting';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.78}>

      {/* Thumbnail */}
      <View style={styles.thumbOuter}>
        {walk.imageUrl ? (
          <Image source={{ uri: walk.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
            <Text style={styles.thumbEmoji}>🐕</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.bodyTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>{walk.title}</Text>
          <View style={[styles.badge, isHosting ? styles.badgeHosting : styles.badgeAttending]}>
            <Text style={[styles.badgeText, { color: isHosting ? colors.hosting : colors.primary }]}>
              {isHosting ? 'Hosting' : 'Attending'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{formatDate(walk.date)}  ·  {walk.time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>{walk.location}</Text>
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

    // Card
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      marginBottom: 12,
      flexDirection: 'row',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 2,
    },

    // Thumbnail
    thumbOuter: { width: 100 },
    thumbPlaceholder: {
      backgroundColor: '#DBEAFE',
      alignItems: 'center', justifyContent: 'center',
    },
    thumbEmoji: { fontSize: 32 },

    // Body
    body: { flex: 1, padding: 12 },
    bodyTop: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: 7, gap: 6,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, flex: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, flexShrink: 0 },
    badgeHosting: { backgroundColor: '#FEF3C7' },
    badgeAttending: { backgroundColor: '#DBEAFE' },
    badgeText: { fontSize: 11, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
    metaText: { fontSize: 12, color: c.textSecondary, flex: 1 },
    cardFooter: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginTop: 6,
    },
    countText: { fontSize: 12, fontWeight: '600' },

    // Empty
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 6 },
    emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
  });
}
