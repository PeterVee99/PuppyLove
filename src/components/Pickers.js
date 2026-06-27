import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// ─── Shared bottom-sheet wrapper ──────────────────────────────────────────────

function Sheet({ visible, title, onCancel, onDone, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.handle} />
          <View style={styles.cardHeader}>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
            >
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.cardTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onDone}
              hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
            >
              <Text style={styles.doneTxt}>Done</Text>
            </TouchableOpacity>
          </View>
          {children}
          <View style={{ height: 28 }} />
        </View>
      </View>
    </Modal>
  );
}

// ─── Date picker ──────────────────────────────────────────────────────────────

export function DatePickerModal({ visible, value, onConfirm, onCancel }) {
  const defaultDate = new Date(2026, 6, 5);
  const [date, setDate] = useState(value instanceof Date ? value : defaultDate);

  useEffect(() => {
    if (value instanceof Date) setDate(value);
  }, [value]);

  // Android shows the native date-dialog directly — no modal wrapper needed
  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={date}
        mode="date"
        onChange={(event, d) => {
          if (event.type === 'dismissed') { onCancel(); return; }
          if (d) onConfirm(d);
        }}
      />
    );
  }

  // iOS: native spinner wheel inside a bottom sheet
  if (Platform.OS === 'ios') {
    return (
      <Sheet
        visible={visible}
        title="Select Date"
        onCancel={onCancel}
        onDone={() => onConfirm(date)}
      >
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          locale="en-AU"
          onChange={(_, d) => { if (d) setDate(d); }}
          style={styles.nativePicker}
        />
      </Sheet>
    );
  }

  // Web fallback: HTML date input inside the sheet
  return (
    <Sheet
      visible={visible}
      title="Select Date"
      onCancel={onCancel}
      onDone={() => onConfirm(date)}
    >
      <View style={styles.webPickerWrap}>
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, d) => { if (d) setDate(d); }}
        />
      </View>
    </Sheet>
  );
}

// ─── Time picker ──────────────────────────────────────────────────────────────

function parseToDate(str) {
  const base = new Date();
  base.setSeconds(0, 0);
  if (!str) { base.setHours(9, 0); return base; }
  const m = str.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) { base.setHours(9, 0); return base; }
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const period = m[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  base.setHours(h, min);
  return base;
}

function formatTime(d) {
  let h = d.getHours();
  const min = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${String(min).padStart(2, '0')} ${period}`;
}

export function TimePickerModal({ visible, value, onConfirm, onCancel }) {
  const [date, setDate] = useState(parseToDate(value));

  useEffect(() => {
    setDate(parseToDate(value));
  }, [value]);

  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={date}
        mode="time"
        is24Hour={false}
        onChange={(event, d) => {
          if (event.type === 'dismissed') { onCancel(); return; }
          if (d) onConfirm(formatTime(d));
        }}
      />
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <Sheet
        visible={visible}
        title="Select Time"
        onCancel={onCancel}
        onDone={() => onConfirm(formatTime(date))}
      >
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          is24Hour={false}
          locale="en-AU"
          onChange={(_, d) => { if (d) setDate(d); }}
          style={styles.nativePicker}
        />
      </Sheet>
    );
  }

  // Web fallback
  return (
    <Sheet
      visible={visible}
      title="Select Time"
      onCancel={onCancel}
      onDone={() => onConfirm(formatTime(date))}
    >
      <View style={styles.webPickerWrap}>
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={(_, d) => { if (d) setDate(d); }}
        />
      </View>
    </Sheet>
  );
}

// ─── Dropdown list picker ─────────────────────────────────────────────────────

export function DropdownModal({ visible, title, items, selected, onSelect, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.handle} />
          <View style={styles.cardHeader}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const active = item.value === selected;
              return (
                <TouchableOpacity
                  key={String(item.value)}
                  style={[styles.dropItem, active && styles.dropItemActive]}
                  onPress={() => { onSelect(item.value); onCancel(); }}
                >
                  <Text style={[styles.dropText, active && styles.dropTextActive]}>
                    {item.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cancelTxt: { fontSize: 15, color: colors.textSecondary, width: 60 },
  doneTxt:   { fontSize: 15, fontWeight: '700', color: colors.primary, textAlign: 'right', width: 60 },
  // Native picker (iOS spinner)
  nativePicker: {
    width: '100%',
    height: 216,
  },
  // Web: centre the HTML input
  webPickerWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  // Dropdown
  dropItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dropItemActive: { backgroundColor: colors.primaryLight },
  dropText:       { fontSize: 15, color: colors.textPrimary },
  dropTextActive: { color: colors.primary, fontWeight: '600' },
});
