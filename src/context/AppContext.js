import React, {
  createContext, useContext, useState, useEffect, useMemo, useCallback,
} from 'react';
import { lightColors, darkColors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/imageUpload';

const AppContext = createContext();

// ─── DB → app mappers (snake_case → camelCase) ────────────────────────────────

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const dd   = String(d.getUTCDate()).padStart(2, '0');
  const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function mapWalk(row) {
  return {
    id:             row.id,
    organizerId:    row.organizer_id,
    organizerName:  row.organizer_name,
    title:          row.title,
    description:    row.description ?? '',
    location:       row.location,
    date:           formatDate(row.walk_date),
    time:           row.walk_time,
    duration:       row.duration,
    distance:       row.distance ?? null,
    attendeeCount:  row.attendee_count,
    maxAttendees:   row.max_attendees ?? null,
    dogFriendlyFor: row.dog_friendly_for ?? ['all_sizes'],
    vibes:          row.vibe ?? [],
    imageUrl:       row.image_url?.startsWith('http') ? row.image_url : null,
    recurring:      row.recurring,
    recurringUntil: row.recurring_until ? formatDate(row.recurring_until) : null,
    status:         row.status,
  };
}

function mapRsvp(row) {
  return { id: row.id, walkId: row.walk_id, userId: row.user_id, status: row.status };
}

function mapProfile(row) {
  return {
    id:              row.id,
    name:            row.name,
    location:        row.location ?? '',
    bio:             row.bio ?? '',
    profileImageUrl: row.profile_image_url?.startsWith('http') ? row.profile_image_url : null,
  };
}

function mapDog(row) {
  return {
    id:       row.id,
    ownerId:  row.owner_id,
    name:     row.name,
    breed:    row.breed,
    size:     row.size,
    age:      row.age ?? null,
    imageUrl: row.image_url?.startsWith('http') ? row.image_url : null,
  };
}

// Parse "DD/MM/YYYY" → "YYYY-MM-DD" for Postgres DATE columns
function toISODate(ddmmyyyy) {
  if (!ddmmyyyy) return null;
  const [dd, mm, yyyy] = ddmmyyyy.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [session,  setSession]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [walks,    setWalks]    = useState([]);
  const [rsvps,    setRsvps]    = useState([]);
  const [user,     setUser]     = useState(null);
  const [dogs,     setDogs]     = useState([]);
  const [isDark,   setIsDark]   = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const colors      = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
  const toggleTheme = () => setIsDark((d) => !d);

  // ── Fetch all data for the signed-in user ──────────────────────────────────
  const loadData = useCallback(async (userId) => {
    const [walksRes, rsvpsRes, profileRes, dogsRes, convsRes] = await Promise.all([
      supabase.from('walks').select('*').eq('status', 'active').order('walk_date', { ascending: true }),
      supabase.from('rsvps').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('dogs').select('*').eq('owner_id', userId),
      supabase.rpc('get_conversations_for_user'),
    ]);

    if (walksRes.data)   setWalks(walksRes.data.map(mapWalk));
    if (rsvpsRes.data)   setRsvps(rsvpsRes.data.map(mapRsvp));
    if (profileRes.data) setUser(mapProfile(profileRes.data));
    if (dogsRes.data)    setDogs(dogsRes.data.map(mapDog));
    if (convsRes.data)   setUnreadMessageCount(convsRes.data.filter(c => c.last_message_time).length);
  }, []);

  // ── Auth state ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadData(s.user.id).finally(() => setLoading(false));
      else   setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s) {
        await loadData(s.user.id);
      } else {
        setWalks([]); setRsvps([]); setUser(null); setDogs([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadData]);

  // ── isRsvpd ────────────────────────────────────────────────────────────────
  const isRsvpd = useCallback(
    (walkId) => rsvps.some(
      (r) => r.walkId === walkId && r.userId === session?.user?.id && r.status === 'going'
    ),
    [rsvps, session]
  );

  // ── toggleRsvp ─────────────────────────────────────────────────────────────
  const toggleRsvp = async (walkId) => {
    const userId = session?.user?.id;
    if (!userId) return;

    const existing = rsvps.find((r) => r.walkId === walkId && r.userId === userId);

    if (existing) {
      // Optimistic remove
      setRsvps((prev) => prev.filter((r) => !(r.walkId === walkId && r.userId === userId)));
      setWalks((prev) => prev.map((w) => w.id === walkId ? { ...w, attendeeCount: w.attendeeCount - 1 } : w));

      const { error } = await supabase.from('rsvps')
        .delete().eq('walk_id', walkId).eq('user_id', userId);
      if (error) await loadData(userId); // revert on failure
    } else {
      // Optimistic add
      const temp = { id: `tmp-${Date.now()}`, walkId, userId, status: 'going' };
      setRsvps((prev) => [...prev, temp]);
      setWalks((prev) => prev.map((w) => w.id === walkId ? { ...w, attendeeCount: w.attendeeCount + 1 } : w));

      const { data, error } = await supabase.from('rsvps')
        .insert({ walk_id: walkId, user_id: userId, status: 'going' })
        .select().single();
      if (error) {
        await loadData(userId);
      } else {
        setRsvps((prev) => prev.map((r) => r.id === temp.id ? mapRsvp(data) : r));
      }
    }
  };

  // ── addWalk ────────────────────────────────────────────────────────────────
  const addWalk = async (walkData) => {
    const userId = session?.user?.id;
    if (!userId) return null;

    // Upload cover photo if it's a local URI
    let imageUrl = walkData.imageUrl;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = await uploadImage(imageUrl, 'walks', `${userId}/${Date.now()}.jpg`);
    }

    const { data, error } = await supabase.from('walks').insert({
      organizer_id:     userId,
      organizer_name:   user?.name ?? 'Unknown',
      title:            walkData.title,
      description:      walkData.description ?? '',
      location:         walkData.location,
      walk_date:        toISODate(walkData.date),
      walk_time:        walkData.time,
      duration:         walkData.duration,
      distance:         walkData.distance ?? null,
      max_attendees:    walkData.maxAttendees ?? null,
      dog_friendly_for: walkData.dogFriendlyFor,
      vibe:             walkData.vibes ?? [],
      image_url:        imageUrl ?? null,
      recurring:        walkData.recurring ?? false,
      recurring_until:  toISODate(walkData.recurringUntil),
      status:           'active',
      attendee_count:   1,
    }).select().single();

    if (error) {
      if (__DEV__) console.error('addWalk failed:', error);
      return null;
    }

    const newWalk = mapWalk(data);
    setWalks((prev) => [newWalk, ...prev]);

    // Auto-RSVP the organiser
    const { data: rsvpData } = await supabase.from('rsvps')
      .insert({ walk_id: data.id, user_id: userId, status: 'going' })
      .select().single();
    if (rsvpData) setRsvps((prev) => [...prev, mapRsvp(rsvpData)]);

    return newWalk;
  };

  // ── updateUser ─────────────────────────────────────────────────────────────
  const updateUser = async (fields) => {
    const userId = session?.user?.id;
    if (!userId) return;

    // Upload profile photo if local URI; keep existing remote URL if upload fails
    let profileImageUrl = fields.profileImageUrl ?? user?.profileImageUrl;
    if (profileImageUrl && !profileImageUrl.startsWith('http')) {
      const uploaded = await uploadImage(profileImageUrl, 'avatars', `${userId}/profile.jpg`);
      profileImageUrl = uploaded?.startsWith('http') ? uploaded : (user?.profileImageUrl ?? null);
    }

    const merged = { ...user, ...fields, profileImageUrl };
    setUser(merged); // optimistic

    const { error } = await supabase.from('profiles').update({
      name:              merged.name,
      location:          merged.location,
      bio:               merged.bio,
      profile_image_url: profileImageUrl,
    }).eq('id', userId);

    if (error) await loadData(userId);
  };

  // ── updateDog ──────────────────────────────────────────────────────────────
  const updateDog = async (dogId, fields) => {
    const userId = session?.user?.id;
    if (!userId) return;

    let imageUrl = fields.imageUrl;
    if (imageUrl && !imageUrl.startsWith('http')) {
      const uploaded = await uploadImage(imageUrl, 'dogs', `${userId}/${dogId}.jpg`);
      imageUrl = uploaded?.startsWith('http') ? uploaded : (dogs.find(d => d.id === dogId)?.imageUrl ?? null);
    }

    const updated = { ...fields, imageUrl };
    setDogs((prev) => prev.map((d) => d.id === dogId ? { ...d, ...updated } : d));

    const { error } = await supabase.from('dogs').update({
      name:      updated.name,
      breed:     updated.breed,
      size:      updated.size,
      age:       updated.age ?? null,
      image_url: imageUrl ?? null,
    }).eq('id', dogId).eq('owner_id', userId);

    if (error) await loadData(userId);
  };

  // ── addDog ─────────────────────────────────────────────────────────────────
  const addDog = async (dogData) => {
    const userId = session?.user?.id;
    if (!userId) return;

    let imageUrl = dogData.imageUrl;
    if (imageUrl && !imageUrl.startsWith('http')) {
      const tempId = Date.now();
      const uploaded = await uploadImage(imageUrl, 'dogs', `${userId}/${tempId}.jpg`);
      imageUrl = uploaded?.startsWith('http') ? uploaded : null;
    }

    const { data, error } = await supabase.from('dogs').insert({
      owner_id:  userId,
      name:      dogData.name,
      breed:     dogData.breed,
      size:      dogData.size,
      age:       dogData.age ?? null,
      image_url: imageUrl ?? null,
    }).select().single();

    if (error) {
      if (__DEV__) console.error('addDog failed:', error);
      return;
    }

    setDogs((prev) => [...prev, mapDog(data)]);
  };

  // ── clearUnreadMessages ────────────────────────────────────────────────────
  const clearUnreadMessages = useCallback(() => setUnreadMessageCount(0), []);

  // ── signOut ────────────────────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AppContext.Provider value={{
      session, loading,
      walks, rsvps, user, dogs,
      isRsvpd, toggleRsvp, addWalk,
      updateUser, updateDog, addDog,
      isDark, toggleTheme, colors,
      unreadMessageCount, clearUnreadMessages,
      signOut,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp    = () => useContext(AppContext);
export const useColors = () => useContext(AppContext).colors;
