import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function MapEmbed({ location }) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  return (
    <WebView source={{ uri: src }} style={styles.map} scrollEnabled={false} />
  );
}

const styles = StyleSheet.create({
  map: { height: 220 },
});
