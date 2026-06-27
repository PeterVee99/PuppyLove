import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import WalkCard from '../components/WalkCard';

const FILTERS = ['All', 'Today', 'This Week', 'Small', 'Medium', 'Large', 'Recurring'];

function parseWalkDate(dateStr) {
  if (!dateStr) return new Date(0);
  if (dateStr.includes('/')) {
    const [dd, mm, yyyy] = dateStr.split('/');
    return new Date(`${yyyy}-${mm}-${dd}`);
  }
  return new Date(dateStr);
}

export default function ExploreScreen({ navigation }) {
  const { walks, rsvps, user } = useApp();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showNotifications, setShowNotifications] = useState(false);

  // Walks the user hasn't RSVPd to — treated as "new near you"
  const rsvpdWalkIds = new Set(rsvps.filter((r) => r.userId === 'user-1').map((r) => r.walkId));
  const nearbyNewWalks = walks.filter((w) => !rsvpdWalkIds.has(w.id)).slice(0, 5);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const filtered = walks
    .filter((w) => {
      const q = search.toLowerCase();
      const matchesSearch =
        w.title.toLowerCase().includes(q) || w.location.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const walkDate = parseWalkDate(w.date);

      if (activeFilter === 'Today') {
        const d = new Date(walkDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }
      if (activeFilter === 'This Week') return walkDate >= today && walkDate <= weekEnd;
      if (activeFilter === 'Small')   return w.dogFriendlyFor.includes('small_only')  || w.dogFriendlyFor.includes('all_sizes');
      if (activeFilter === 'Medium')  return w.dogFriendlyFor.includes('medium_only') || w.dogFriendlyFor.includes('all_sizes');
      if (activeFilter === 'Large')   return w.dogFriendlyFor.includes('large_only')  || w.dogFriendlyFor.includes('all_sizes');
      if (activeFilter === 'Recurring') return w.recurring;
      return true;
    })
    .sort((a, b) => parseWalkDate(a.date) - parseWalkDate(b.date));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <TouchableOpacity
          style={styles.bellWrap}
          onPress={() => setShowNotifications(true)}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {nearbyNewWalks.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{nearbyNewWalks.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={17} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search walks or locations..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}>
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results label */}
      <Text style={styles.resultsLabel}>
        {filtered.length} walk{filtered.length !== 1 ? 's' : ''} found
        {activeFilter !== 'All' ? ` · ${activeFilter}` : ''}
      </Text>

      {/* Walk list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WalkCard
            walk={item}
            onPress={() => navigation.navigate('WalkDetail', { walkId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No walks found</Text>
            <Text style={styles.emptySubText}>Try a different filter or search term</Text>
          </View>
        }
      />

      {/* Notification panel */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}>
        <TouchableOpacity
          style={styles.notifOverlay}
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.notifPanel}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>New walks near you</Text>
              <Text style={styles.notifSub}>
                Based on your location · {user?.location ?? 'Your area'}
              </Text>
              <TouchableOpacity
                style={styles.notifClose}
                onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {nearbyNewWalks.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Text style={styles.notifEmptyEmoji}>🐾</Text>
                <Text style={styles.notifEmptyText}>You're all caught up!</Text>
                <Text style={styles.notifEmptySubText}>No new walks in your area right now.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {nearbyNewWalks.map((walk) => (
                  <TouchableOpacity
                    key={walk.id}
                    style={styles.notifItem}
                    onPress={() => {
                      setShowNotifications(false);
                      navigation.navigate('WalkDetail', { walkId: walk.id });
                    }}>
                    <View style={styles.notifDot} />
                    <View style={styles.notifItemBody}>
                      <Text style={styles.notifWalkTitle} numberOfLines={1}>
                        {walk.title}
                      </Text>
                      <Text style={styles.notifWalkMeta}>
                        {walk.date} · {walk.time} · {walk.location}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  bellWrap: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.danger ?? '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  filtersRow: { marginTop: 10, marginBottom: 2 },
  filtersContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  resultsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
  emptySubText: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  // Notification modal
  notifOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 96,
    paddingRight: 12,
  },
  notifPanel: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: 320,
    maxHeight: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  notifHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  notifSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  notifClose: { position: 'absolute', top: 16, right: 16 },
  notifEmpty: { alignItems: 'center', padding: 32 },
  notifEmptyEmoji: { fontSize: 32, marginBottom: 8 },
  notifEmptyText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  notifEmptySubText: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  notifItemBody: { flex: 1 },
  notifWalkTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  notifWalkMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
