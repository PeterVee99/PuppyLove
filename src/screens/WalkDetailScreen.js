import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../context/AppContext';
import MapEmbed from '../components/MapEmbed';

const DOG_SIZE_LABELS = {
  all_sizes: 'All sizes welcome',
  small_only: 'Small dogs only',
  medium_only: 'Medium dogs only',
  large_only: 'Large dogs only',
};

export default function WalkDetailScreen({ navigation, route }) {
  const { walkId } = route.params;
  const { walks, isRsvpd, toggleRsvp } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const walk = walks.find((w) => w.id === walkId);

  if (!walk) return null;

  const rsvpd = isRsvpd(walkId);
  const dogLabel = walk.dogFriendlyFor.map((s) => DOG_SIZE_LABELS[s]).join(', ');

  const handleRsvp = () => {
    toggleRsvp(walkId);
    if (!rsvpd) Alert.alert("You're Going! 🐾", `RSVP confirmed for "${walk.title}"`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.heroEmoji}>🐕</Text>
          {walk.recurring && (
            <View style={styles.recurringTag}>
              <Ionicons name="refresh-outline" size={12} color="#FFFFFF" />
              <Text style={styles.recurringTagText}>Weekly</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.walkTitle}>{walk.title}</Text>
          <Text style={styles.organizer}>Organised by {walk.organizerName}</Text>

          <View style={styles.infoCard}>
            <InfoRow icon="calendar-outline" label="Date & Time" value={`${walk.date} at ${walk.time}`} />
            <View style={styles.divider} />
            <InfoRow icon="location-outline" label="Location" value={walk.location} />
            <View style={styles.divider} />
            <InfoRow icon="timer-outline" label="Duration" value={`${walk.duration} minutes`} />
            {walk.distance != null && (
              <>
                <View style={styles.divider} />
                <InfoRow icon="map-outline" label="Distance" value={`${walk.distance} km`} />
              </>
            )}
            {walk.maxAttendees && (
              <>
                <View style={styles.divider} />
                <InfoRow icon="people-outline" label="Spots" value={`${walk.attendeeCount} / ${walk.maxAttendees}`} />
              </>
            )}
          </View>

          {walk.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this walk</Text>
              <Text style={styles.description}>{walk.description}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dog Requirements</Text>
            <View style={styles.dogBadge}>
              <Text style={styles.dogBadgeText}>🐾 {dogLabel}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attendees</Text>
            <Text style={styles.attendeeText}>
              {walk.organizerName}
              {walk.attendeeCount > 1 ? ` + ${walk.attendeeCount - 1} others` : ''}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meeting Point</Text>
            <View style={styles.mapContainer}>
              <MapEmbed location={walk.location} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.rsvpBtn, rsvpd && styles.rsvpBtnConfirmed]}
          onPress={handleRsvp}
        >
          <Ionicons name={rsvpd ? 'checkmark-circle' : 'calendar-outline'} size={20} color="#FFFFFF" />
          <Text style={styles.rsvpBtnText}>{rsvpd ? "You're Going!" : 'RSVP to Walk'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.msgBtn}
          onPress={() => navigation.getParent()?.navigate('Messages')}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={styles.msgBtnText}>Message Organiser</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    hero: { height: 200, backgroundColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center' },
    backBtn: {
      position: 'absolute', top: 16, left: 16,
      backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 20, padding: 8,
    },
    heroEmoji: { fontSize: 64 },
    recurringTag: {
      position: 'absolute', top: 16, right: 16,
      backgroundColor: c.primary, borderRadius: 12,
      paddingHorizontal: 10, paddingVertical: 4,
      flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    recurringTagText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
    body: { padding: 20 },
    walkTitle: { fontSize: 22, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
    organizer: { fontSize: 14, color: c.textSecondary, marginBottom: 20 },
    infoCard: {
      backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
    divider: { height: 1, backgroundColor: c.border },
    infoLabel: { fontSize: 11, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
    infoValue: { fontSize: 14, color: c.textPrimary, fontWeight: '500', marginTop: 2 },
    section: {
      backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary, marginBottom: 10 },
    description: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },
    dogBadge: {
      backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: 10, alignSelf: 'flex-start',
    },
    dogBadgeText: { fontSize: 14, color: '#065F46', fontWeight: '500' },
    attendeeText: { fontSize: 14, color: c.textSecondary },
    mapContainer: { height: 220, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: c.border },
    actions: {
      padding: 16, backgroundColor: c.card,
      borderTopWidth: 1, borderTopColor: c.border, gap: 10,
    },
    rsvpBtn: {
      backgroundColor: c.primary, borderRadius: 14, paddingVertical: 15,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    rsvpBtnConfirmed: { backgroundColor: c.success },
    rsvpBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    msgBtn: {
      borderWidth: 1.5, borderColor: c.primary, borderRadius: 14, paddingVertical: 13,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    msgBtnText: { color: c.primary, fontSize: 15, fontWeight: '600' },
  });
}
