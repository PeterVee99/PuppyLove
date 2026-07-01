import { supabase } from './supabase';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Upload a local image URI to Supabase Storage.
 * Returns the public URL, or the original URI if upload fails.
 *
 * @param {string|null} localUri  - file:// URI from expo-image-picker
 * @param {'avatars'|'dogs'|'walks'} bucket
 * @param {string} filePath       - e.g. "userId/profile.jpg"
 */
export async function uploadImage(localUri, bucket, filePath) {
  if (!localUri) return null;
  // Already a remote URL — nothing to upload
  if (localUri.startsWith('http')) return localUri;

  try {
    const response = await fetch(localUri);
    const blob = await response.blob();

    if (blob.size > MAX_BYTES) {
      if (__DEV__) console.warn(`Image too large (${blob.size} bytes), skipping upload`);
      return localUri;
    }

    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    if (__DEV__) console.error('Image upload failed:', err);
    return localUri; // graceful degradation — local URI still works on this device
  }
}
