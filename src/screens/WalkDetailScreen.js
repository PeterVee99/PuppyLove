import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import MapEmbed from '../components/MapEmbed';

const VIBE_META = {
  leisurely: { label: 'Leisurely', emoji: '🌿' },
  off_lead:  { label: 'Off Lead',  emoji: '🐕' },
  wine:      { label: 'Wine',      emoji: '🍷' },
  coffee:    { label: 'Coffee',    emoji: '☕' },
};

const DOG_SIZE_LABELS = {
  all_sizes: 'All sizes welcome',
  small_only: 'Small dogs only',
  medium_only: 'Medium dogs only',
  large_only: 'Large dogs only',
};

export default function WalkDetailScreen({ navigation, route }) {
  const { walkId } = route.params;
  const { walks, isRsvpd, toggleRsvp, session } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const walk = walks.find((w) => w.id === walkId);

  const [attendees, setAttendees] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    if (!walkId) return;
    supabase
      .from('rsvps')
      .select('user_id, profiles(id, name)')
      .eq('walk_id', walkId)
      .eq('status', 'going')
      .then(({ data }) => {
        if (data) setAttendees(data.map((r) => r.profiles).filter(Boolean));
      });
  }, [walkId]);

  if (!walk) return null;

  const rsvpd = isRsvpd(walkId);
  const dogLabel = walk.dogFriendlyFor.map((s) => DOG_SIZE_LABELS[s]).join(', ');
  const isOwnWalk = walk.organizerId === session?.user?.id;

  const handleRsvp = () => {
    toggleRsvp(walkId);
    if (!rsvpd) Alert.alert("You're Going! 🐾", `RSVP confirmed for "${walk.title}"`);
  };

  const handleMessageOrganiser = async () => {
    if (isOwnWalk) return;
    setMsgLoading(true);
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
          returnTo: { tab: 'Explore', screen: 'WalkDetail', params: { walkId: walk.id } },
        },
      });
    } catch (err) {
      if (__DEV__) console.error('Message organiser failed:', err);
    } finally {
      setMsgLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {walk.imageUrl ? (
            <Image source={{ uri: walk.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={styles.heroEmoji}>🐕</Text>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
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

          {walk.vibes && walk.vibes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vibe</Text>
              <View style={styles.vibeRow}>
                {walk.vibes.map((v) => {
                  const meta = VIBE_META[v];
                  if (!meta) return null;
                  return (
                    <View key={v} style={styles.vibeBadge}>
                      <Text style={styles.vibeBadgeText}>{meta.emoji} {meta.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dog Requirements</Text>
            <View style={styles.dogBadge}>
              <Text style={styles.dogBadgeText}>🐾 {dogLabel}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attendees ({attendees.length})</Text>
            {attendees.length === 0 ? (
              <Text style={styles.attendeeText}>No confirmed attendees yet</Text>
            ) : (
              attendees.map((a) => (
                <View key={a.id} style={styles.attendeeRow}>
                  <Ionicons name="person-circle-outline" size={18} color={colors.textMuted} />
                  <Text style={styles.attendeeText}>{a.name}</Text>
                </View>
              ))
            )}
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
        {isOwnWalk ? (
          <View style={[styles.rsvpBtn, styles.rsvpBtnHosting]}>
            <Ionicons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.rsvpBtnText}>You're Hosting</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.rsvpBtn, rsvpd && styles.rsvpBtnConfirmed]}
            onPress={handleRsvp}
          >
            <Ionicons name={rsvpd ? 'checkmark-circle' : 'calendar-outline'} size={20} color="#FFFFFF" />
            <Text style={styles.rsvpBtnText}>{rsvpd ? "You're Going!" : 'RSVP to Walk'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.msgBtn, isOwnWalk && styles.msgBtnDisabled]}
          onPress={handleMessageOrganiser}
          disabled={isOwnWalk || msgLoading}
        >
          {msgLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="chatbubble-outline" size={20} color={isOwnWalk ? colors.textMuted : colors.primary} />
              <Text style={[styles.msgBtnText, isOwnWalk && { color: colors.textMuted }]}>
                {isOwnWalk ? 'Your Walk' : 'Message Organiser'}
              </Text>
            </>
          )}
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
    hero: { height: 200, backgroundColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    backBtn: {
      position: 'absolute',
      top: 16,
      left: 16,
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
    vibeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    vibeBadge: {
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
      backgroundColor: c.primaryLight,
    },
    vibeBadgeText: { fontSize: 14, color: c.primary, fontWeight: '600' },
    attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
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
    rsvpBtnHosting: { backgroundColor: c.hosting },
    rsvpBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    msgBtn: {
      borderWidth: 1.5, borderColor: c.primary, borderRadius: 14, paddingVertical: 13,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    msgBtnDisabled: { borderColor: c.border, opacity: 0.5 },
    msgBtnText: { color: c.primary, fontSize: 15, fontWeight: '600' },
  });
}
