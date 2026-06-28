import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function MapEmbed({ location }) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  return (
    <View style={styles.container}>
      <iframe
        src={src}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Walk location map"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 220, borderRadius: 10, overflow: 'hidden' },
});
