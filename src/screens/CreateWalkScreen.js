import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
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

const BLANK = {
  title: '',
  location: '',
  dateObj: null,
  timeStr: null,
  duration: '60',
  description: '',
  maxAttendees: null,
  dogSize: 'all_sizes',
  recurring: false,
  recurringUntilObj: null,
  imageUrl: null,
};

function formatDate(d) {
  if (!(d instanceof Date)) return '';
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function CreateWalkScreen({ navigation }) {
  const { addWalk } = useApp();
  const [form,   setForm]   = useState(BLANK);
  const [errors, setErrors] = useState({});

  const pickCoverPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      set('imageUrl', result.assets[0].uri);
    }
  };

  const [showDate,          setShowDate]          = useState(false);
  const [showTime,          setShowTime]          = useState(false);
  const [showAttendees,     setShowAttendees]     = useState(false);
  const [showRecurringDate, setShowRecurringDate] = useState(false);

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
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
      title:          form.title.trim(),
      location:       form.location.trim(),
      date:           formatDate(form.dateObj),
      time:           form.timeStr,
      duration:       parseInt(form.duration) || 60,
      description:    form.description.trim(),
      maxAttendees:   form.maxAttendees,
      dogFriendlyFor: [form.dogSize],
      recurring:      form.recurring,
      recurringUntil: form.recurringUntilObj ? formatDate(form.recurringUntilObj) : null,
      distance:       null,
      imageUrl:       form.imageUrl,
    });
    setForm(BLANK);
    setErrors({});
    navigation.navigate('Explore');
  };

  const attendeesLabel =
    form.maxAttendees == null ? 'Unlimited' : String(form.maxAttendees);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Walk</Text>
        </View>

        <View style={styles.form}>

          {/* Cover photo */}
          <Field label="Cover Photo">
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
              <TouchableOpacity
                style={styles.removeCover}
                onPress={() => set('imageUrl', null)}>
                <Text style={styles.removeCoverText}>Remove photo</Text>
              </TouchableOpacity>
            )}
          </Field>

          {/* Title */}
          <Field label="Walk Title" required error={errors.title}>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder='"Morning Park Stroll"'
              placeholderTextColor={colors.textMuted}
              value={form.title}
              onChangeText={(v) => set('title', v)}
            />
          </Field>

          {/* Location */}
          <Field label="Location" required error={errors.location}>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              placeholder="Park name or address"
              placeholderTextColor={colors.textMuted}
              value={form.location}
              onChangeText={(v) => set('location', v)}
            />
          </Field>

          {/* Date + Time side by side */}
          <View style={styles.twoCol}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Date" required error={errors.date}>
                <TouchableOpacity
                  style={[styles.input, styles.rowBetween, errors.date && styles.inputError]}
                  onPress={() => setShowDate(true)}
                >
                  <Text style={form.dateObj ? styles.inputVal : styles.inputHint}>
                    {form.dateObj ? formatDate(form.dateObj) : 'DD/MM/YYYY'}
                  </Text>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Time" required error={errors.time}>
                <TouchableOpacity
                  style={[styles.input, styles.rowBetween, errors.time && styles.inputError]}
                  onPress={() => setShowTime(true)}
                >
                  <Text style={form.timeStr ? styles.inputVal : styles.inputHint}>
                    {form.timeStr || 'H:MM AM'}
                  </Text>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </Field>
            </View>
          </View>

          {/* Duration chips */}
          <Field label="Duration">
            <View style={styles.chips}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.chip, form.duration === d.value && styles.chipActive]}
                  onPress={() => set('duration', d.value)}
                >
                  <Text style={[styles.chipText, form.duration === d.value && styles.chipTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Dog size — single select radio chips */}
          <Field label="Dog Size">
            <View style={styles.dogRow}>
              {DOG_SIZES.map((opt) => {
                const active = form.dogSize === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.radioChip, active && styles.radioChipActive]}
                    onPress={() => set('dogSize', opt.id)}
                  >
                    <View style={[styles.radioDot, active && styles.radioDotActive]}>
                      {active && <View style={styles.radioDotInner} />}
                    </View>
                    <Text style={[styles.radioText, active && styles.radioTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          {/* Description */}
          <Field label="Description">
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Tell people about the walk..."
              placeholderTextColor={colors.textMuted}
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              textAlignVertical="top"
            />
          </Field>

          {/* Max attendees */}
          <Field label="Max Attendees">
            <TouchableOpacity
              style={[styles.input, styles.rowBetween]}
              onPress={() => setShowAttendees(true)}
            >
              <Text style={styles.inputVal}>{attendeesLabel}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </Field>

          {/* Recurring toggle */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Recurring weekly</Text>
              <Text style={styles.switchSub}>Repeat this walk every week</Text>
            </View>
            <Switch
              value={form.recurring}
              onValueChange={(v) => set('recurring', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          {/* Repeat until */}
          {form.recurring && (
            <Field label="Repeat Until">
              <TouchableOpacity
                style={[styles.input, styles.rowBetween]}
                onPress={() => setShowRecurringDate(true)}
              >
                <Text style={form.recurringUntilObj ? styles.inputVal : styles.inputHint}>
                  {form.recurringUntilObj ? formatDate(form.recurringUntilObj) : 'DD/MM/YYYY'}
                </Text>
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </Field>
          )}

          {/* Create button */}
          <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
            <Ionicons name="paw-outline" size={20} color={colors.white} />
            <Text style={styles.createBtnText}>Create Walk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pickers */}
      <DatePickerModal
        visible={showDate}
        value={form.dateObj}
        onConfirm={(d) => { set('dateObj', d); setShowDate(false); }}
        onCancel={() => setShowDate(false)}
      />
      <TimePickerModal
        visible={showTime}
        value={form.timeStr}
        onConfirm={(t) => { set('timeStr', t); setShowTime(false); }}
        onCancel={() => setShowTime(false)}
      />
      <DropdownModal
        visible={showAttendees}
        title="Max Attendees"
        items={ATTENDEES_OPTIONS}
        selected={form.maxAttendees}
        onSelect={(v) => set('maxAttendees', v)}
        onCancel={() => setShowAttendees(false)}
      />
      {form.recurring && (
        <DatePickerModal
          visible={showRecurringDate}
          value={form.recurringUntilObj}
          onConfirm={(d) => { set('recurringUntilObj', d); setShowRecurringDate(false); }}
          onCancel={() => setShowRecurringDate(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, error, children }) {
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  form: { padding: 16 },

  // Cover photo
  coverPicker: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  coverHint: { fontSize: 14, color: colors.textMuted },
  removeCover: { marginTop: 6, alignSelf: 'flex-start' },
  removeCoverText: { fontSize: 13, color: colors.danger ?? '#EF4444' },

  // Field
  field: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredStar: { fontSize: 13, color: colors.danger, fontWeight: '700' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  errorText: { fontSize: 12, color: colors.danger, fontWeight: '500' },

  // Inputs
  input: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.danger, borderWidth: 1.5 },
  rowBetween:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputVal:    { fontSize: 15, color: colors.textPrimary },
  inputHint:   { fontSize: 15, color: colors.textMuted },
  textarea:    { height: 90, paddingTop: 12 },
  twoCol:      { flexDirection: 'row' },

  // Duration chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontWeight: '600' },

  // Dog size — single-select radio row
  dogRow: { flexDirection: 'row', gap: 8 },
  radioChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  radioChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotActive: { borderColor: colors.primary },
  radioDotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  radioText:       { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  radioTextActive: { color: colors.primary, fontWeight: '700' },

  // Recurring switch
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  switchSub:   { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  // Create button
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
