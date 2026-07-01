import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, TextInput, Modal,
  KeyboardAvoidingView, Platform, StyleSheet, SafeAreaView, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp, useColors } from '../context/AppContext';

const SIZE_OPTIONS = ['small', 'medium', 'large'];
const SIZE_LABELS = { small: 'Small', medium: 'Medium', large: 'Large' };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
    Alert.alert('Image too large', 'Please choose an image under 5 MB.');
    return null;
  }
  return asset.uri;
}

export default function ProfileScreen() {
  const { walks, rsvps, user, dogs, session, updateUser, updateDog, addDog, isDark, toggleTheme, signOut } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditDog, setShowEditDog] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', location: '', bio: '', profileImageUrl: null });
  const [dogForm, setDogForm] = useState({ name: '', breed: '', size: 'medium', age: '', imageUrl: null });

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState({
    walkReminders: true,
    nearbyWalks: true,
    rsvpConfirmations: true,
    messages: true,
    weeklyDigest: false,
  });

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [privacy, setPrivacy] = useState({
    showLocation: true,
    publicProfile: true,
    allowMessages: true,
    shareWalkHistory: false,
  });

  const toggleNotif = (key) => setNotifications((n) => ({ ...n, [key]: !n[key] }));
  const togglePrivacy = (key) => setPrivacy((p) => ({ ...p, [key]: !p[key] }));

  const walksLed = walks.filter((w) => w.organizerId === session?.user?.id).length;
  const walksJoined = rsvps.filter((r) => r.userId === session?.user?.id).length;

  const handlePickProfilePhoto = async () => {
    const uri = await pickImage();
    if (uri) updateUser({ profileImageUrl: uri });
  };

  const openEditProfile = () => {
    setProfileForm({ name: user.name, location: user.location, bio: user.bio || '', profileImageUrl: user.profileImageUrl || null });
    setShowEditProfile(true);
  };

  const pickProfileFormPhoto = async () => {
    const uri = await pickImage();
    if (uri) setProfileForm((f) => ({ ...f, profileImageUrl: uri }));
  };

  const saveProfile = () => {
    if (!profileForm.name.trim()) { Alert.alert('Name required', 'Please enter your name.'); return; }
    updateUser({ name: profileForm.name.trim(), location: profileForm.location.trim(), bio: profileForm.bio.trim(), profileImageUrl: profileForm.profileImageUrl });
    setShowEditProfile(false);
  };

  const openEditDog = (dog) => {
    setEditingDog(dog);
    setDogForm({ name: dog.name, breed: dog.breed, size: dog.size, age: dog.age ? String(dog.age) : '', imageUrl: dog.imageUrl || null });
    setShowEditDog(true);
  };

  const openAddDog = () => {
    setEditingDog(null);
    setDogForm({ name: '', breed: '', size: 'medium', age: '', imageUrl: null });
    setShowEditDog(true);
  };

  const pickDogFormPhoto = async () => {
    const uri = await pickImage();
    if (uri) setDogForm((f) => ({ ...f, imageUrl: uri }));
  };

  const saveDog = () => {
    if (!dogForm.name.trim() || !dogForm.breed.trim()) { Alert.alert('Missing fields', 'Please enter a name and breed.'); return; }
    const data = { name: dogForm.name.trim(), breed: dogForm.breed.trim(), size: dogForm.size, age: dogForm.age ? parseInt(dogForm.age) : null, imageUrl: dogForm.imageUrl };
    editingDog ? updateDog(editingDog.id, data) : addDog(data);
    setShowEditDog(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickProfilePhoto}>
            {user.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          <TouchableOpacity style={styles.editBtn} onPress={openEditProfile}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <StatBox icon="flag-outline" label="Walks Led" value={walksLed} colors={colors} styles={styles} />
          <View style={styles.statDivider} />
          <StatBox icon="people-outline" label="Walks Joined" value={walksJoined} colors={colors} styles={styles} />
        </View>

        {/* Dogs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Dogs</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openAddDog}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addBtnText}>Add Dog</Text>
            </TouchableOpacity>
          </View>
          {dogs.length === 0 && <Text style={styles.emptyDogs}>No dogs added yet. Tap "Add Dog" to get started!</Text>}
          {dogs.map((dog, i) => (
            <DogRow key={dog.id} dog={dog} last={i === dogs.length - 1} onEdit={() => openEditDog(dog)} colors={colors} styles={styles} />
          ))}
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowNotifications(true)}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.menuLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPrivacy(true)}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.menuLabel}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={toggleTheme} activeOpacity={0.7}>
            <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.menuLabel}>Dark Mode</Text>
            <View pointerEvents="none">
              <Switch
                value={isDark}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => Alert.alert('Log Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log Out', style: 'destructive', onPress: signOut },
            ])}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.menuLabel, { color: colors.danger }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditModal visible={showEditProfile} title="Edit Profile" onClose={() => setShowEditProfile(false)} onSave={saveProfile} colors={colors} styles={styles}>
        <View style={styles.modalAvatarRow}>
          <TouchableOpacity style={styles.modalAvatarWrap} onPress={pickProfileFormPhoto}>
            {profileForm.profileImageUrl ? (
              <Image source={{ uri: profileForm.profileImageUrl }} style={styles.modalAvatarImage} />
            ) : (
              <View style={styles.modalAvatarPlaceholder}>
                <Text style={styles.modalAvatarInitial}>{profileForm.name.charAt(0) || '?'}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.modalAvatarHint}>Tap to change photo</Text>
        </View>
        <FormField label="Name" styles={styles}>
          <TextInput style={styles.input} value={profileForm.name} onChangeText={(v) => setProfileForm((f) => ({ ...f, name: v }))} placeholder="Your name" placeholderTextColor={colors.textMuted} />
        </FormField>
        <FormField label="Location" styles={styles}>
          <TextInput style={styles.input} value={profileForm.location} onChangeText={(v) => setProfileForm((f) => ({ ...f, location: v }))} placeholder="City or suburb" placeholderTextColor={colors.textMuted} />
        </FormField>
        <FormField label="Bio" styles={styles}>
          <TextInput style={[styles.input, styles.textarea]} value={profileForm.bio} onChangeText={(v) => setProfileForm((f) => ({ ...f, bio: v }))} placeholder="Tell people about yourself..." placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" />
        </FormField>
      </EditModal>

      {/* Notifications Modal */}
      <SettingsModal visible={showNotifications} title="Notifications" onClose={() => setShowNotifications(false)} styles={styles}>
        <SettingsRow label="Walk Reminders" sub="Get reminded 1 hour before a walk" value={notifications.walkReminders} onToggle={() => toggleNotif('walkReminders')} colors={colors} styles={styles} />
        <SettingsRow label="Nearby Walks" sub="New walks posted near you" value={notifications.nearbyWalks} onToggle={() => toggleNotif('nearbyWalks')} colors={colors} styles={styles} />
        <SettingsRow label="RSVP Confirmations" sub="When someone joins your walk" value={notifications.rsvpConfirmations} onToggle={() => toggleNotif('rsvpConfirmations')} colors={colors} styles={styles} />
        <SettingsRow label="Messages" sub="New messages from other dog owners" value={notifications.messages} onToggle={() => toggleNotif('messages')} colors={colors} styles={styles} />
        <SettingsRow label="Weekly Digest" sub="Summary of upcoming walks near you" value={notifications.weeklyDigest} onToggle={() => toggleNotif('weeklyDigest')} colors={colors} styles={styles} last />
      </SettingsModal>

      {/* Privacy Settings Modal */}
      <SettingsModal visible={showPrivacy} title="Privacy Settings" onClose={() => setShowPrivacy(false)} styles={styles}>
        <SettingsRow label="Show My Location" sub="Let others see your general area" value={privacy.showLocation} onToggle={() => togglePrivacy('showLocation')} colors={colors} styles={styles} />
        <SettingsRow label="Public Profile" sub="Anyone can view your profile" value={privacy.publicProfile} onToggle={() => togglePrivacy('publicProfile')} colors={colors} styles={styles} />
        <SettingsRow label="Allow Messages" sub="Receive messages from other owners" value={privacy.allowMessages} onToggle={() => togglePrivacy('allowMessages')} colors={colors} styles={styles} />
        <SettingsRow label="Share Walk History" sub="Show walks you've attended on your profile" value={privacy.shareWalkHistory} onToggle={() => togglePrivacy('shareWalkHistory')} colors={colors} styles={styles} last />
      </SettingsModal>

      {/* Edit / Add Dog Modal */}
      <EditModal visible={showEditDog} title={editingDog ? 'Edit Dog' : 'Add Dog'} onClose={() => setShowEditDog(false)} onSave={saveDog} colors={colors} styles={styles}>
        <View style={styles.modalAvatarRow}>
          <TouchableOpacity style={styles.modalAvatarWrap} onPress={pickDogFormPhoto}>
            {dogForm.imageUrl ? (
              <Image source={{ uri: dogForm.imageUrl }} style={styles.modalAvatarImage} />
            ) : (
              <View style={[styles.modalAvatarPlaceholder, { backgroundColor: '#DBEAFE' }]}>
                <Text style={{ fontSize: 32 }}>🐕</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.modalAvatarHint}>Tap to add photo</Text>
        </View>
        <FormField label="Dog's Name" styles={styles}>
          <TextInput style={styles.input} value={dogForm.name} onChangeText={(v) => setDogForm((f) => ({ ...f, name: v }))} placeholder="e.g. Biscuit" placeholderTextColor={colors.textMuted} />
        </FormField>
        <FormField label="Breed" styles={styles}>
          <TextInput style={styles.input} value={dogForm.breed} onChangeText={(v) => setDogForm((f) => ({ ...f, breed: v }))} placeholder="e.g. Golden Retriever" placeholderTextColor={colors.textMuted} />
        </FormField>
        <FormField label="Size" styles={styles}>
          <View style={styles.sizeRow}>
            {SIZE_OPTIONS.map((s) => (
              <TouchableOpacity key={s} style={[styles.sizeChip, dogForm.size === s && styles.sizeChipActive]} onPress={() => setDogForm((f) => ({ ...f, size: s }))}>
                <Text style={[styles.sizeChipText, dogForm.size === s && styles.sizeChipTextActive]}>{SIZE_LABELS[s]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        <FormField label="Age (years, optional)" styles={styles}>
          <TextInput style={styles.input} value={dogForm.age} onChangeText={(v) => setDogForm((f) => ({ ...f, age: v }))} placeholder="e.g. 3" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
        </FormField>
      </EditModal>
    </SafeAreaView>
  );
}

function EditModal({ visible, title, onClose, onSave, children, styles }) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onSave}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormField({ label, children, styles }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function StatBox({ icon, label, value, colors, styles }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DogRow({ dog, last, onEdit, colors, styles }) {
  return (
    <View style={[styles.dogRow, last && { borderBottomWidth: 0 }]}>
      <TouchableOpacity onPress={onEdit}>
        {dog.imageUrl ? (
          <Image source={{ uri: dog.imageUrl }} style={styles.dogImage} />
        ) : (
          <View style={styles.dogAvatarPlaceholder}>
            <Text style={styles.dogEmoji}>🐕</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.dogInfo}>
        <Text style={styles.dogName}>{dog.name}</Text>
        <Text style={styles.dogBreed}>{dog.breed} · {SIZE_LABELS[dog.size]}{dog.age ? ` · ${dog.age} yrs` : ''}</Text>
      </View>
      <TouchableOpacity style={styles.editDogBtn} onPress={onEdit}>
        <Ionicons name="pencil-outline" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function SettingsModal({ visible, title, onClose, children, styles }) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={{ width: 60 }} />
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalSave}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {children}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SettingsRow({ label, sub, value, onToggle, last, colors, styles }) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, last && { borderBottomWidth: 0 }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {sub ? <Text style={styles.settingsSub}>{sub}</Text> : null}
      </View>
      <View pointerEvents="none">
        <Switch
          value={value}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: c.card,
    },
    title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
    profileCard: {
      backgroundColor: c.card, margin: 16, borderRadius: 16, padding: 20, alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
    cameraBtn: {
      position: 'absolute', bottom: 0, right: 0, width: 26, height: 26,
      borderRadius: 13, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: c.card,
    },
    name: { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
    location: { fontSize: 13, color: c.textMuted },
    bio: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16, paddingHorizontal: 8 },
    editBtn: { borderWidth: 1.5, borderColor: c.primary, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 8, marginTop: 4 },
    editBtnText: { color: c.primary, fontSize: 14, fontWeight: '600' },
    statsCard: {
      flexDirection: 'row', backgroundColor: c.card, marginHorizontal: 16, borderRadius: 16, marginBottom: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2, overflow: 'hidden',
    },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: 20 },
    statDivider: { width: 1, backgroundColor: c.border },
    statValue: { fontSize: 28, fontWeight: '700', color: c.textPrimary, marginTop: 6, marginBottom: 2 },
    statLabel: { fontSize: 12, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    section: {
      backgroundColor: c.card, marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addBtnText: { color: c.primary, fontSize: 14, fontWeight: '600' },
    emptyDogs: { fontSize: 14, color: c.textMuted, fontStyle: 'italic' },
    dogRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
    dogImage: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
    dogAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    dogEmoji: { fontSize: 22 },
    dogInfo: { flex: 1 },
    dogName: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
    dogBreed: { fontSize: 13, color: c.textSecondary },
    editDogBtn: { padding: 8 },
    menuItem: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    menuLabel: { flex: 1, fontSize: 15, color: c.textPrimary },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: { backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 16, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
    modalCancel: { fontSize: 15, color: c.textSecondary },
    modalSave: { fontSize: 15, fontWeight: '700', color: c.primary },
    modalBody: { padding: 16 },
    modalAvatarRow: { alignItems: 'center', marginBottom: 24 },
    modalAvatarWrap: { position: 'relative' },
    modalAvatarImage: { width: 90, height: 90, borderRadius: 45 },
    modalAvatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    modalAvatarInitial: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
    modalAvatarHint: { fontSize: 13, color: c.textMuted, marginTop: 8 },
    field: { marginBottom: 18 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    input: {
      backgroundColor: c.background, borderRadius: 10, borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.textPrimary,
    },
    textarea: { height: 90, paddingTop: 12 },
    sizeRow: { flexDirection: 'row', gap: 8 },
    sizeChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center', backgroundColor: c.card },
    sizeChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    sizeChipText: { fontSize: 14, color: c.textSecondary, fontWeight: '500' },
    sizeChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
    settingsRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    settingsLabel: { fontSize: 15, fontWeight: '600', color: c.textPrimary, marginBottom: 2 },
    settingsSub: { fontSize: 12, color: c.textMuted },
  });
}
