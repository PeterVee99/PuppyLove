import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, TextInput,
  Switch, StyleSheet, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../context/AppContext';
import { DatePickerModal, TimePickerModal, DropdownModal } from '../components/Pickers';

const DOG_SIZES = [
  { id: 'all_sizes',   label: 'All'    },
  { id: 'small_only',  label: 'Small'  },
  { id: 'medium_only', label: 'Medium' },
  { id: 'large_only',  label: 'Large'  },
];

const DURATIONS = [
  { label: '30 min', value: '30'  },
  { label: '45 min', value: '45'  },
  { label: '1 hr',   value: '60'  },
  { label: '1.5 hr', value: '90'  },
  { label: '2 hr',   value: '120' },
];

const ATTENDEES_OPTIONS = [
  { label: 'Unlimited', value: null },
  ...Array.from({ length: 30 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
];

const VIBES = [
  { id: 'leisurely', label: 'Leisurely', emoji: '🌿' },
  { id: 'off_lead',  label: 'Off Lead',  emoji: '🐕' },
  { id: 'wine',      label: 'Wine',      emoji: '🍷' },
  { id: 'coffee',    label: 'Coffee',    emoji: '☕' },
];

const BLANK = {
  title: '', location: '', dateObj: null, timeStr: null, duration: '60',
  description: '', maxAttendees: null, dogSize: 'all_sizes',
  vibes: [], recurring: false, recurringUntilObj: null, imageUrl: null,
};

function formatDate(d) {
  if (!(d instanceof Date)) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export default function CreateWalkScreen({ navigation }) {
  const { addWalk } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});

  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [showRecurringDate, setShowRecurringDate] = useState(false);

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const pickCoverPhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo library access in Settings to add a cover photo.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Image too large', 'Please choose an image under 5 MB.');
        return;
      }
      set('imageUrl', asset.uri);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())    e.title    = 'Walk title is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.dateObj)         e.date     = 'Please select a date';
    if (!form.timeStr)         e.time     = 'Please select a time';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    addWalk({
      title: form.title.trim(), location: form.location.trim(),
      date: formatDate(form.dateObj), time: form.timeStr,
      duration: parseInt(form.duration) || 60, description: form.description.trim(),
      maxAttendees: form.maxAttendees, dogFriendlyFor: [form.dogSize],
      recurring: form.recurring, recurringUntil: form.recurringUntilObj ? formatDate(form.recurringUntilObj) : null,
      distance: null, imageUrl: form.imageUrl, vibes: form.vibes,
    });
    setForm(BLANK); setErrors({});
    navigation.navigate('My Walks');
  };

  const attendeesLabel = form.maxAttendees == null ? 'Unlimited' : String(form.maxAttendees);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Walk</Text>
        </View>

        <View style={styles.form}>
          <Field label="Cover Photo" styles={styles} colors={colors}>
            <TouchableOpacity style={styles.coverPicker} onPress={pickCoverPhoto}>
              {form.imageUrl ? (
                <Image source={{ uri: form.imageUrl }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
                  <Text style={styles.coverHint}>Tap to add a cover photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {form.imageUrl && (
              <TouchableOpacity style={styles.removeCover} onPress={() => set('imageUrl', null)}>
                <Text style={styles.removeCoverText}>Remove photo</Text>
              </TouchableOpacity>
            )}
          </Field>

          <Field label="Walk Title" required error={errors.title} styles={styles} colors={colors}>
            <TextInput style={[styles.input, errors.title && styles.inputError]} placeholder='"Morning Park Stroll"' placeholderTextColor={colors.textMuted} value={form.title} onChangeText={(v) => set('title', v)} />
          </Field>

          <Field label="Location" required error={errors.location} styles={styles} colors={colors}>
            <TextInput style={[styles.input, errors.location && styles.inputError]} placeholder="Park name or address" placeholderTextColor={colors.textMuted} value={form.location} onChangeText={(v) => set('location', v)} />
          </Field>

          <View style={styles.twoCol}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Date" required error={errors.date} styles={styles} colors={colors}>
                <TouchableOpacity style={[styles.input, styles.rowBetween, errors.date && styles.inputError]} onPress={() => setShowDate(true)}>
                  <Text style={form.dateObj ? styles.inputVal : styles.inputHint}>{form.dateObj ? formatDate(form.dateObj) : 'DD/MM/YYYY'}</Text>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Time" required error={errors.time} styles={styles} colors={colors}>
                <TouchableOpacity style={[styles.input, styles.rowBetween, errors.time && styles.inputError]} onPress={() => setShowTime(true)}>
                  <Text style={form.timeStr ? styles.inputVal : styles.inputHint}>{form.timeStr || 'H:MM AM'}</Text>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </Field>
            </View>
          </View>

          <Field label="Duration" styles={styles} colors={colors}>
            <View style={styles.chips}>
              {DURATIONS.map((d) => (
                <TouchableOpacity key={d.value} style={[styles.chip, form.duration === d.value && styles.chipActive]} onPress={() => set('duration', d.value)}>
                  <Text style={[styles.chipText, form.duration === d.value && styles.chipTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Dog Size" styles={styles} colors={colors}>
            <View style={styles.dogRow}>
              {DOG_SIZES.map((opt) => {
                const active = form.dogSize === opt.id;
                return (
                  <TouchableOpacity key={opt.id} style={[styles.radioChip, active && styles.radioChipActive]} onPress={() => set('dogSize', opt.id)}>
                    <View style={[styles.radioDot, active && styles.radioDotActive]}>
                      {active && <View style={styles.radioDotInner} />}
                    </View>
                    <Text style={[styles.radioText, active && styles.radioTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          <Field label="Description" styles={styles} colors={colors}>
            <TextInput style={[styles.input, styles.textarea]} placeholder="Tell people about the walk..." placeholderTextColor={colors.textMuted} value={form.description} onChangeText={(v) => set('description', v)} multiline textAlignVertical="top" />
          </Field>

          <Field label="Vibe" styles={styles} colors={colors}>
            <View style={styles.chips}>
              {VIBES.map((v) => {
                const active = form.vibes.includes(v.id);
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => set('vibes', active
                      ? form.vibes.filter((x) => x !== v.id)
                      : [...form.vibes, v.id]
                    )}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {v.emoji} {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          <Field label="Max Attendees" styles={styles} colors={colors}>
            <TouchableOpacity style={[styles.input, styles.rowBetween]} onPress={() => setShowAttendees(true)}>
              <Text style={styles.inputVal}>{attendeesLabel}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </Field>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Recurring weekly</Text>
              <Text style={styles.switchSub}>Repeat this walk every week</Text>
            </View>
            <Switch value={form.recurring} onValueChange={(v) => set('recurring', v)} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
          </View>

          {form.recurring && (
            <Field label="Repeat Until" styles={styles} colors={colors}>
              <TouchableOpacity style={[styles.input, styles.rowBetween]} onPress={() => setShowRecurringDate(true)}>
                <Text style={form.recurringUntilObj ? styles.inputVal : styles.inputHint}>{form.recurringUntilObj ? formatDate(form.recurringUntilObj) : 'DD/MM/YYYY'}</Text>
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </Field>
          )}

          <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
            <Ionicons name="paw-outline" size={20} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Create Walk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DatePickerModal visible={showDate} value={form.dateObj} onConfirm={(d) => { set('dateObj', d); setShowDate(false); }} onCancel={() => setShowDate(false)} />
      <TimePickerModal visible={showTime} value={form.timeStr} onConfirm={(t) => { set('timeStr', t); setShowTime(false); }} onCancel={() => setShowTime(false)} />
      <DropdownModal visible={showAttendees} title="Max Attendees" items={ATTENDEES_OPTIONS} selected={form.maxAttendees} onSelect={(v) => set('maxAttendees', v)} onCancel={() => setShowAttendees(false)} />
      {form.recurring && (
        <DatePickerModal visible={showRecurringDate} value={form.recurringUntilObj} onConfirm={(d) => { set('recurringUntilObj', d); setShowRecurringDate(false); }} onCancel={() => setShowRecurringDate(false)} />
      )}
    </SafeAreaView>
  );
}

function Field({ label, required, error, children, styles, colors }) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {required && <Text style={styles.requiredStar}> *</Text>}
      </View>
      {children}
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: c.card },
    title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
    form: { padding: 16 },
    coverPicker: {
      height: 160, borderRadius: 12, borderWidth: 1.5, borderColor: c.border,
      borderStyle: 'dashed', overflow: 'hidden', backgroundColor: c.background,
    },
    coverImage: { width: '100%', height: '100%' },
    coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    coverHint: { fontSize: 14, color: c.textMuted },
    removeCover: { marginTop: 6, alignSelf: 'flex-start' },
    removeCoverText: { fontSize: 13, color: c.danger },
    field: { marginBottom: 18 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    requiredStar: { fontSize: 13, color: c.danger, fontWeight: '700' },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    errorText: { fontSize: 12, color: c.danger, fontWeight: '500' },
    input: {
      backgroundColor: c.card, borderRadius: 10, borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.textPrimary,
    },
    inputError: { borderColor: c.danger, borderWidth: 1.5 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    inputVal: { fontSize: 15, color: c.textPrimary },
    inputHint: { fontSize: 15, color: c.textMuted },
    textarea: { height: 90, paddingTop: 12 },
    twoCol: { flexDirection: 'row' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontSize: 13, color: c.textSecondary },
    chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
    dogRow: { flexDirection: 'row', gap: 8 },
    radioChip: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 5, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.card,
    },
    radioChipActive: { borderColor: c.primary, backgroundColor: c.primaryLight },
    radioDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: c.textMuted, alignItems: 'center', justifyContent: 'center' },
    radioDotActive: { borderColor: c.primary },
    radioDotInner: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.primary },
    radioText: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    radioTextActive: { color: c.primary, fontWeight: '700' },
    switchRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: c.card, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: c.border, marginBottom: 18,
    },
    switchLabel: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
    switchSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    createBtn: {
      backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    createBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  });
}
