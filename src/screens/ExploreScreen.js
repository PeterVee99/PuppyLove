import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  ScrollView, StyleSheet, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import WalkCard from '../components/WalkCard';
import SpecificDatePicker from '../components/SpecificDatePicker';

const DEFAULT_FILTERS = {
  timeOfDay: 'Any',
  maxDistance: 20,
  date: 'Any',
  specificDate: null,
  dogSize: 'All',
};

const MS_DAY = 86400000;

function parseWalkDate(dateStr) {
  if (!dateStr) return new Date(0);
  if (dateStr.includes('/')) {
    const [dd, mm, yyyy] = dateStr.split('/');
    return new Date(`${yyyy}-${mm}-${dd}`);
  }
  return new Date(dateStr);
}

function getTimeOfDay(timeStr) {
  if (!timeStr) return 'Morning';
  const [time, period] = timeStr.split(' ');
  let h = parseInt(time.split(':')[0], 10);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 21) return 'Evening';
  return 'Night';
}

function matchesDate(walkDate, dateFilter, specificDate) {
  if (dateFilter === 'Any') return true;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in7  = new Date(today.getTime() + 7  * MS_DAY);
  const in14 = new Date(today.getTime() + 14 * MS_DAY);
  const isWknd = [0, 6].includes(walkDate.getDay());
  if (dateFilter === 'This Weekend') return walkDate >= today && walkDate < in7  && isWknd;
  if (dateFilter === 'Next Week')    return walkDate >= in7  && walkDate < in14;
  if (dateFilter === 'Next Weekend') return walkDate >= in7  && walkDate < in14  && isWknd;
  if (dateFilter === 'Specific' && specificDate) {
    const d = new Date(specificDate); d.setHours(0, 0, 0, 0);
    return walkDate.getTime() === d.getTime();
  }
  return true;
}

export default function ExploreScreen({ navigation }) {
  const { walks, rsvps, user, session } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pending, setPending] = useState({ ...DEFAULT_FILTERS });
  const [applied, setApplied] = useState({ ...DEFAULT_FILTERS });

  const rsvpdIds = new Set(rsvps.filter(r => r.userId === session?.user?.id).map(r => r.walkId));
  const nearbyNew = walks.filter(w => !rsvpdIds.has(w.id)).slice(0, 5);

  const activeCount = [
    applied.timeOfDay !== 'Any',
    applied.maxDistance < 20,
    applied.date !== 'Any',
    applied.dogSize !== 'All',
  ].filter(Boolean).length;

  const filtered = walks
    .filter(w => {
      const q = search.toLowerCase();
      if (!w.title.toLowerCase().includes(q) && !w.location.toLowerCase().includes(q)) return false;
      const wd = parseWalkDate(w.date); wd.setHours(0, 0, 0, 0);
      if (!matchesDate(wd, applied.date, applied.specificDate)) return false;
      if (applied.timeOfDay !== 'Any' && getTimeOfDay(w.time) !== applied.timeOfDay) return false;
      if (applied.maxDistance < 20 && w.distance != null && w.distance > applied.maxDistance) return false;
      if (applied.dogSize !== 'All') {
        const key = { Small: 'small_only', Medium: 'medium_only', Large: 'large_only' }[applied.dogSize];
        if (!w.dogFriendlyFor.includes(key) && !w.dogFriendlyFor.includes('all_sizes')) return false;
      }
      return true;
    })
    .sort((a, b) => parseWalkDate(a.date) - parseWalkDate(b.date));

  const openFilters = () => { setPending({ ...applied }); setShowFilters(true); };
  const applyFilters = () => { setApplied({ ...pending }); setShowFilters(false); };
  const resetFilters = () => setPending({ ...DEFAULT_FILTERS });
  const set = (key, val) => setPending(prev => ({ ...prev, [key]: val }));

  const handleMessagePress = async (walk) => {
    const isOwnWalk = walk.organizerId === session?.user?.id;
    if (isOwnWalk) return;
    try {
      const { data: convId, error } = await supabase.rpc('create_or_get_direct_conversation', {
        other_user_id: walk.organizerId,
        other_user_name: walk.organizerName,
      });
      if (error) throw error;
      navigation.getParent()?.navigate('Messages', {
        screen: 'Conversation',
        params: {
          conversationId: convId,
          title: walk.organizerName,
          returnTo: { tab: 'Explore', screen: 'ExploreMain' },
        },
      });
    } catch (err) {
      if (__DEV__) console.error('Message from explore failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <TouchableOpacity style={styles.bellWrap} onPress={() => setShowNotifications(true)}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {nearbyNew.length > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{nearbyNew.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
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
        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={openFilters}
        >
          <Ionicons name="options-outline" size={20} color={activeCount > 0 ? '#FFFFFF' : colors.textPrimary} />
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.resultsLabel}>
        {filtered.length} walk{filtered.length !== 1 ? 's' : ''} found
        {activeCount > 0 ? `  ·  ${activeCount} filter${activeCount > 1 ? 's' : ''} active` : ''}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <WalkCard
            walk={item}
            onPress={() => navigation.navigate('WalkDetail', { walkId: item.id })}
            onMessagePress={item.organizerId !== session?.user?.id ? () => handleMessagePress(item) : undefined}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No walks found</Text>
            <Text style={styles.emptySubText}>Try adjusting your filters</Text>
          </View>
        }
      />

      {/* Notification modal */}
      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <TouchableOpacity style={styles.notifOverlay} activeOpacity={1} onPress={() => setShowNotifications(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.notifPanel}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>New walks near you</Text>
              <Text style={styles.notifSub}>Based on your location · {user?.location ?? 'Your area'}</Text>
              <TouchableOpacity style={styles.notifClose} onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {nearbyNew.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Text style={styles.notifEmptyEmoji}>🐾</Text>
                <Text style={styles.notifEmptyText}>You're all caught up!</Text>
                <Text style={styles.notifEmptySubText}>No new walks in your area right now.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {nearbyNew.map(walk => (
                  <TouchableOpacity key={walk.id} style={styles.notifItem} onPress={() => {
                    setShowNotifications(false);
                    navigation.navigate('WalkDetail', { walkId: walk.id });
                  }}>
                    <View style={styles.notifDot} />
                    <View style={styles.notifItemBody}>
                      <Text style={styles.notifWalkTitle} numberOfLines={1}>{walk.title}</Text>
                      <Text style={styles.notifWalkMeta}>{walk.date} · {walk.time} · {walk.location}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Filter bottom sheet */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetDismiss} activeOpacity={1} onPress={() => setShowFilters(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetText}>Reset all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              <FilterSection title="Date" colors={colors} styles={styles}>
                <ChipRow options={['Any', 'This Weekend', 'Next Week', 'Next Weekend', 'Specific']} value={pending.date} onChange={v => set('date', v)} colors={colors} styles={styles} />
                {pending.date === 'Specific' && (
                  <SpecificDatePicker value={pending.specificDate} onChange={d => set('specificDate', d)} />
                )}
              </FilterSection>
              <FilterSection title="Time of Day" colors={colors} styles={styles}>
                <ChipRow options={['Any', 'Morning', 'Afternoon', 'Evening', 'Night']} value={pending.timeOfDay} onChange={v => set('timeOfDay', v)} colors={colors} styles={styles} />
                <Text style={styles.hint}>Morning 5–12pm · Afternoon 12–5pm · Evening 5–9pm · Night 9pm+</Text>
              </FilterSection>
              <FilterSection title={`Walk Distance${pending.maxDistance < 20 ? ` — up to ${pending.maxDistance} km` : ' — Any'}`} colors={colors} styles={styles}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={1} maximumValue={20} step={0.5}
                  value={pending.maxDistance}
                  onValueChange={v => set('maxDistance', v)}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>1 km</Text>
                  <Text style={styles.sliderLabel}>20+ km</Text>
                </View>
              </FilterSection>
              <FilterSection title="Dog Size" colors={colors} styles={styles}>
                <ChipRow options={['All', 'Small', 'Medium', 'Large']} value={pending.dogSize} onChange={v => set('dogSize', v)} colors={colors} styles={styles} />
              </FilterSection>
            </ScrollView>
            <View style={styles.sheetFooter}>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FilterSection({ title, children, styles }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ChipRow({ options, value, onChange, styles }) {
  return (
    <View style={styles.chipRow}>
      {options.map(opt => (
        <TouchableOpacity key={opt} style={[styles.fChip, value === opt && styles.fChipActive]} onPress={() => onChange(opt)}>
          <Text style={[styles.fChipText, value === opt && styles.fChipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: c.card,
    },
    title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
    bellWrap: { position: 'relative', padding: 4 },
    notifBadge: {
      position: 'absolute', top: 0, right: 0, backgroundColor: c.danger,
      borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    },
    notifBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
    searchRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 16, paddingVertical: 10,
      backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    searchBar: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.background, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: c.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: c.textPrimary },
    filterBtn: {
      width: 44, height: 44, borderRadius: 12, backgroundColor: c.background,
      borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', position: 'relative',
    },
    filterBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
    filterBadge: {
      position: 'absolute', top: -5, right: -5, backgroundColor: c.danger,
      borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    },
    filterBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
    resultsLabel: { fontSize: 12, color: c.textMuted, marginHorizontal: 16, marginTop: 8, marginBottom: 2 },
    listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyEmoji: { fontSize: 40, marginBottom: 10 },
    emptyText: { fontSize: 16, color: c.textMuted, fontWeight: '600' },
    emptySubText: { fontSize: 13, color: c.textMuted, marginTop: 4 },
    // Notification modal
    notifOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 96, paddingRight: 12,
    },
    notifPanel: {
      backgroundColor: c.card, borderRadius: 16, width: 320, maxHeight: 420,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
      elevation: 8, overflow: 'hidden',
    },
    notifHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: c.border },
    notifTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
    notifSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    notifClose: { position: 'absolute', top: 16, right: 16 },
    notifEmpty: { alignItems: 'center', padding: 32 },
    notifEmptyEmoji: { fontSize: 32, marginBottom: 8 },
    notifEmptyText: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
    notifEmptySubText: { fontSize: 13, color: c.textMuted, marginTop: 4, textAlign: 'center' },
    notifItem: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: c.border, gap: 10,
    },
    notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary, flexShrink: 0 },
    notifItemBody: { flex: 1 },
    notifWalkTitle: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
    notifWalkMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    // Filter sheet
    sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
    sheetDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
      backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%',
      shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 16,
    },
    sheetHandle: { width: 40, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
    sheetHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
    resetText: { fontSize: 14, color: c.primary, fontWeight: '600' },
    sheetScroll: { paddingHorizontal: 20 },
    sheetFooter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: c.border },
    applyBtn: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    applyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    filterSection: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: c.border },
    filterSectionTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    fChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: c.background, borderWidth: 1.5, borderColor: c.border,
    },
    fChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    fChipText: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    fChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
    hint: { fontSize: 11, color: c.textMuted, marginTop: 8 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
    sliderLabel: { fontSize: 11, color: c.textMuted },
  });
}
