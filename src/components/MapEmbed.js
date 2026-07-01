import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/AppContext';

export default function MapEmbed({ location }) {
  const colors = useColors();

  const openMaps = () => {
    const encoded = encodeURIComponent(location);
    const url = Platform.OS === 'ios'
      ? `maps://?q=${encoded}`
      : `geo:0,0?q=${encoded}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${encoded}`)
    );
  };

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={openMaps} activeOpacity={0.75}>
      <View style={styles.iconWrap}>
        <Ionicons name="map" size={36} color={colors.primary} />
      </View>
      <Text style={[styles.locationText, { color: colors.textPrimary }]} numberOfLines={2}>{location}</Text>
      <View style={[styles.btn, { backgroundColor: colors.primary }]}>
        <Ionicons name="navigate-outline" size={15} color="#fff" />
        <Text style={styles.btnText}>Open in Maps</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20,
  },
  iconWrap: { marginBottom: 4 },
  locationText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
