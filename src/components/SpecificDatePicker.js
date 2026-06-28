import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';

export default function SpecificDatePicker({ value, onChange }) {
  const [show, setShow] = useState(false);
  const date = value ?? new Date();
  const label = value
    ? value.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Tap to choose a date';

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.btn} onPress={() => setShow(true)}>
        <Text style={[styles.text, !value && styles.placeholder]}>{label}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selected) => {
            setShow(false);
            if (selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  btn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  text: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  placeholder: { color: colors.textMuted },
});
