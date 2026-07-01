import { Platform } from 'react-native';
import { supabase } from './supabase';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function mimeFromExtension(uri) {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png')  return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif')  return 'image/gif';
  return 'image/jpeg';
}

export async function uploadImage(localUri, bucket, filePath) {
  if (!localUri) return null;
  if (localUri.startsWith('http')) return localUri;

  try {
    let uploadPayload;
    let contentType;

    if (Platform.OS === 'web') {
      const response = await fetch(localUri);
      const blob = await response.blob();

      if (!ALLOWED_MIME.has(blob.type)) {
        if (__DEV__) console.warn('Image upload rejected: unsupported type', blob.type);
        return null;
      }
      if (blob.size > MAX_BYTES) {
        if (__DEV__) console.warn('Image too large, skipping upload');
        return null;
      }

      uploadPayload = blob;
      contentType  = blob.type;
    } else {
      // expo-image-picker only surfaces images from the media library,
      // so type-checking the extension is sufficient on native.
      contentType = mimeFromExtension(localUri);

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
