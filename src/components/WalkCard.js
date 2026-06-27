import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const DOG_SIZE_LABELS = {
  all_sizes:   'All sizes',
  small_only:  'Small',
  medium_only: 'Medium',
  large_only:  'Large',
};

export default function WalkCard({ walk, onPress, style }) {
  const dogLabel = walk.dogFriendlyFor.map((s) => DOG_SIZE_LABELS[s] ?? s).join(', ');
  const isAllSizes = walk.dogFriendlyFor.includes('all_sizes');

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.75}>
      {/* Cover image or placeholder */}
      {walk.imageUrl ? (
        <Image source={{ uri: walk.imageUrl }} style={styles.coverImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.emoji}>🐕</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{walk.title}</Text>

        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.meta}>{walk.date} · {walk.time}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>{walk.location}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.row}>
            <Ionicons name="people-outline" size={12} color={colors.primary} />
            <Text style={styles.attendees}>{walk.attendeeCount} going</Text>
          </View>
          <View style={[styles.sizeBadge, isAllSizes ? styles.badgeGreen : styles.badgeBlue]}>
            <Text style={styles.sizeBadgeText}>🐾 {dogLabel}</Text>
          </View>
        </View>

        {walk.recurring && (
          <View style={styles.recurringRow}>
            <Ionicons name="refresh-outline" size={11} color={colors.primary} />
            <Text style={styles.recurringText}>Weekly</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginTop: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    width: 88,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: 88,
    height: '100%',
    minHeight: 88,
  },
  emoji: { fontSize: 34 },
  info: { flex: 1, padding: 12 },
  title: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  meta: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  attendees: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  sizeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeBlue:  { backgroundColor: '#DBEAFE' },
  sizeBadgeText: { fontSize: 10, color: colors.textPrimary },
  recurringRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  recurringText: { fontSize: 11, color: colors.primary, fontWeight: '500' },
});
