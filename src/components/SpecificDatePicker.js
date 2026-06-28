import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColors } from '../context/AppContext';

export default function SpecificDatePicker({ value, onChange }) {
  const colors = useColors();
  const [show, setShow] = useState(false);
  const date = value ?? new Date();
  const label = value
    ? value.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Tap to choose a date';

  return (
    <View style={{ marginTop: 8 }}>
      <TouchableOpacity
        style={{
          alignSelf: 'flex-start',
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: colors.background,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: colors.border,
        }}
        onPress={() => setShow(true)}
      >
        <Text style={{ fontSize: 14, color: value ? colors.textPrimary : colors.textMuted, fontWeight: '500' }}>
          {label}
        </Text>
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
