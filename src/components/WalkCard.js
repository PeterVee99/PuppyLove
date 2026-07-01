import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/AppContext';

const DOG_SIZE_LABELS = {
  all_sizes:   'All sizes',
  small_only:  'Small dogs',
  medium_only: 'Medium dogs',
  large_only:  'Large dogs',
};

function formatDisplayDate(dateStr) {
  if (!dateStr) return dateStr;
  let d;
  if (dateStr.includes('/')) {
    const [dd, mm, yyyy] = dateStr.split('/');
    d = new Date(`${yyyy}-${mm}-${dd}`);
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function WalkCard({ walk, onPress, onMessagePress, style }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const dogLabel = walk.dogFriendlyFor.map((s) => DOG_SIZE_LABELS[s] ?? s).join(', ');
  const isAllSizes = walk.dogFriendlyFor.includes('all_sizes');
  const displayDate = formatDisplayDate(walk.date);

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.78}>

      {/* Left: thumbnail */}
      <View style={styles.thumbOuter}>
        {walk.imageUrl ? (
          <Image source={{ uri: walk.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
            <Text style={styles.emoji}>🐕</Text>
          </View>
        )}
        {walk.recurring && (
          <View style={styles.weeklyPill}>
            <Text style={styles.weeklyText}>W</Text>
          </View>
        )}
      </View>

      {/* Right: text content */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{walk.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>{displayDate}  ·  {walk.time}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>
            {walk.distance != null ? `${walk.distance} km  ·  ` : ''}{walk.location}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={12} color={colors.primary} />
            <Text style={styles.goingText}>{walk.attendeeCount} going</Text>
          </View>
          <View style={[styles.dogBadge, isAllSizes ? styles.badgeGreen : styles.badgeBlue]}>
            <Text style={styles.dogBadgeText}>{dogLabel}</Text>
          </View>
          {onMessagePress && (
            <TouchableOpacity
              onPress={onMessagePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      marginBottom: 14,
      flexDirection: 'row',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },

    // Thumbnail
    thumbOuter: {
      width: 110,
    },
    thumbPlaceholder: {
      backgroundColor: '#DBEAFE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: { fontSize: 36 },
    weeklyPill: {
      position: 'absolute', top: 6, left: 6,
      backgroundColor: c.primary,
      width: 18, height: 18, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center',
    },
    weeklyText: { color: '#fff', fontSize: 9, fontWeight: '800' },

    // Content
    body: {
      flex: 1,
      padding: 12,
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textPrimary,
      lineHeight: 22,
      marginBottom: 6,
    },
    metaRow: {
      flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4,
    },
    meta: { fontSize: 12, color: c.textSecondary, flex: 1 },

    // Footer
    footer: {
      flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap',
    },
    goingText: { fontSize: 12, fontWeight: '700', color: c.primary },

    // Dog size badge
    dogBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    badgeGreen: { backgroundColor: '#D1FAE5' },
    badgeBlue:  { backgroundColor: '#DBEAFE' },
    dogBadgeText: { fontSize: 10, fontWeight: '500', color: c.textPrimary },
  });
}
