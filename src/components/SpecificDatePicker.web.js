import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../context/AppContext';

export default function SpecificDatePicker({ value, onChange }) {
  const colors = useColors();
  const dateStr = value ? value.toISOString().split('T')[0] : '';
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Date:</Text>
      <input
        type="date"
        value={dateStr}
        min={new Date().toISOString().split('T')[0]}
        onChange={e => { if (e.target.value) onChange(new Date(e.target.value + 'T00:00:00')); }}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: `1.5px solid ${colors.border}`,
          fontSize: 14,
          color: colors.textPrimary,
          outline: 'none',
          backgroundColor: colors.card,
          cursor: 'pointer',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  label: { fontSize: 13 },
});
