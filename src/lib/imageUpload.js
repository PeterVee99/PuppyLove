import { Platform } from 'react-native';
import { supabase } from './supabase';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadImage(localUri, bucket, filePath) {
  if (!localUri) return null;
  if (localUri.startsWith('http')) return localUri;

  try {
    let uploadPayload;
    let contentType = 'image/jpeg';

    if (Platform.OS === 'web') {
      // On web, fetch the blob URL and upload as Blob
      const response = await fetch(localUri);
      const blob = await response.blob();
      if (blob.size > MAX_BYTES) {
        if (__DEV__) console.warn('Image too large, skipping upload');
        return null;
      }
      uploadPayload = blob;
      contentType = blob.type || 'image/jpeg';
    } else {
      // On native, fetch the file:// URI as an ArrayBuffer
      const response = await fetch(localUri);
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_BYTES) {
        if (__DEV__) console.warn('Image too large, skipping upload');
        return null;
      }
      uploadPayload = arrayBuffer;
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, uploadPayload, { contentType, upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (err) {
    if (__DEV__) console.error(`Image upload failed (${bucket}/${filePath}):`, err.message ?? err);
    return null;
  }
}
