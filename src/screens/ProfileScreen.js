import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

const SIZE_OPTIONS = ['small', 'medium', 'large'];
const SIZE_LABELS = { small: 'Small', medium: 'Medium', large: 'Large' };

const MENU_ITEMS = [
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'shield-checkmark-outline', label: 'Privacy Settings' },
  { icon: 'log-out-outline', label: 'Log Out', danger: true },
];

async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });
  if (!result.canceled) return result.assets[0].uri;
  return null;
}

export default function ProfileScreen() {
  const { walks, rsvps, user, dogs, updateUser, updateDog, addDog } = useApp();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditDog, setShowEditDog] = useState(false);
  const [editingDog, setEditingDog] = useState(null);

  const [profileForm, setProfileForm] = useState({ name: '', location: '', bio: '', profileImageUrl: null });
  const [dogForm, setDogForm] = useState({ name: '', breed: '', size: 'medium', age: '', imageUrl: null });

  const walksLed = walks.filter((w) => w.organizerId === 'user-1').length;
  const walksJoined = rsvps.filter((r) => r.userId === 'user-1').length;

  // Profile photo
  const handlePickProfilePhoto = async () => {
    const uri = await pickImage();
    if (uri) updateUser({ profileImageUrl: uri });
  };

  // Open edit profile modal
  const openEditProfile = () => {
    setProfileForm({
      name: user.name,
      location: user.location,
      bio: user.bio || '',
      profileImageUrl: user.profileImageUrl || null,
    });
    setShowEditProfile(true);
  };

  const pickProfileFormPhoto = async () => {
    const uri = await pickImage();
    if (uri) setProfileForm((f) => ({ ...f, profileImageUrl: uri }));
  };

  const saveProfile = () => {
    if (!profileForm.name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    updateUser({
      name: profileForm.name.trim(),
      location: profileForm.location.trim(),
      bio: profileForm.bio.trim(),
      profileImageUrl: profileForm.profileImageUrl,
    });
    setShowEditProfile(false);
  };

  // Dog modal
  const openEditDog = (dog) => {
    setEditingDog(dog);
    setDogForm({
      name: dog.name,
      breed: dog.breed,
      size: dog.size,
      age: dog.age ? String(dog.age) : '',
      imageUrl: dog.imageUrl || null,
    });
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
    if (!dogForm.name.trim() || !dogForm.breed.trim()) {
      Alert.alert('Missing fields', 'Please enter a name and breed.');
      return;
    }
    const data = {
      name: dogForm.name.trim(),
      breed: dogForm.breed.trim(),
      size: dogForm.size,
      age: dogForm.age ? parseInt(dogForm.age) : null,
      imageUrl: dogForm.imageUrl,
    };
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
              <Ionicons name="camera" size={14} color={colors.white} />
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
          <StatBox icon="flag-outline" label="Walks Led" value={walksLed} />
          <View style={styles.statDivider} />
          <StatBox icon="people-outline" label="Walks Joined" value={walksJoined} />
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
          {dogs.length === 0 && (
            <Text style={styles.emptyDogs}>No dogs added yet. Tap "Add Dog" to get started!</Text>
          )}
          {dogs.map((dog, i) => (
            <DogRow key={dog.id} dog={dog} last={i === dogs.length - 1} onEdit={() => openEditDog(dog)} />
          ))}
        </View>

        {/* Account menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() =>
                item.label === 'Log Out'
                  ? Alert.alert('Log Out', 'Are you sure?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Log Out', style: 'destructive' },
                    ])
                  : null
              }
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={item.danger ? colors.danger : colors.textSecondary}
              />
              <Text style={[styles.menuLabel, item.danger && { color: colors.danger }]}>
                {item.label}
              </Text>
              {!item.danger && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditModal
        visible={showEditProfile}
        title="Edit Profile"
        onClose={() => setShowEditProfile(false)}
        onSave={saveProfile}
      >
        {/* Photo picker inside modal */}
        <View style={styles.modalAvatarRow}>
          <TouchableOpacity style={styles.modalAvatarWrap} onPress={pickProfileFormPhoto}>
            {profileForm.profileImageUrl ? (
              <Image source={{ uri: profileForm.profileImageUrl }} style={styles.modalAvatarImage} />
            ) : (
              <View style={styles.modalAvatarPlaceholder}>
                <Text style={styles.modalAvatarInitial}>
                  {profileForm.name.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.modalAvatarHint}>Tap to change photo</Text>
        </View>

        <FormField label="Name">
          <TextInput
            style={styles.input}
            value={profileForm.name}
            onChangeText={(v) => setProfileForm((f) => ({ ...f, name: v }))}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
          />
        </FormField>
        <FormField label="Location">
          <TextInput
            style={styles.input}
            value={profileForm.location}
            onChangeText={(v) => setProfileForm((f) => ({ ...f, location: v }))}
            placeholder="City or suburb"
            placeholderTextColor={colors.textMuted}
          />
        </FormField>
        <FormField label="Bio">
          <TextInput
            style={[styles.input, styles.textarea]}
            value={profileForm.bio}
            onChangeText={(v) => setProfileForm((f) => ({ ...f, bio: v }))}
            placeholder="Tell people about yourself..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </FormField>
      </EditModal>

      {/* Edit / Add Dog Modal */}
      <EditModal
        visible={showEditDog}
        title={editingDog ? 'Edit Dog' : 'Add Dog'}
        onClose={() => setShowEditDog(false)}
        onSave={saveDog}
      >
        {/* Dog photo picker */}
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
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.modalAvatarHint}>Tap to add photo</Text>
        </View>

        <FormField label="Dog's Name">
          <TextInput
            style={styles.input}
            value={dogForm.name}
            onChangeText={(v) => setDogForm((f) => ({ ...f, name: v }))}
            placeholder="e.g. Biscuit"
            placeholderTextColor={colors.textMuted}
          />
        </FormField>
        <FormField label="Breed">
          <TextInput
            style={styles.input}
            value={dogForm.breed}
            onChangeText={(v) => setDogForm((f) => ({ ...f, breed: v }))}
            placeholder="e.g. Golden Retriever"
            placeholderTextColor={colors.textMuted}
          />
        </FormField>
        <FormField label="Size">
          <View style={styles.sizeRow}>
            {SIZE_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sizeChip, dogForm.size === s && styles.sizeChipActive]}
                onPress={() => setDogForm((f) => ({ ...f, size: s }))}
              >
                <Text style={[styles.sizeChipText, dogForm.size === s && styles.sizeChipTextActive]}>
                  {SIZE_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        <FormField label="Age (years, optional)">
          <TextInput
            style={styles.input}
            value={dogForm.age}
            onChangeText={(v) => setDogForm((f) => ({ ...f, age: v }))}
            placeholder="e.g. 3"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </FormField>
      </EditModal>
    </SafeAreaView>
  );
}

function EditModal({ visible, title, onClose, onSave, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormField({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DogRow({ dog, last, onEdit }) {
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
        <Text style={styles.dogBreed}>
          {dog.breed} · {SIZE_LABELS[dog.size]}
          {dog.age ? ` · ${dog.age} yrs` : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.editDogBtn} onPress={onEdit}>
        <Ionicons name="pencil-outline" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  // Profile card
  profileCard: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: colors.white },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  location: { fontSize: 13, color: colors.textMuted },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginTop: 4,
  },
  editBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginTop: 6, marginBottom: 2 },
  statLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Section
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  emptyDogs: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  // Dog row
  dogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dogImage: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  dogAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dogEmoji: { fontSize: 22 },
  dogInfo: { flex: 1 },
  dogName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  dogBreed: { fontSize: 13, color: colors.textSecondary },
  editDogBtn: { padding: 8 },
  // Menu
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: { flex: 1, fontSize: 15, color: colors.textPrimary },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  modalCancel: { fontSize: 15, color: colors.textSecondary },
  modalSave: { fontSize: 15, fontWeight: '700', color: colors.primary },
  modalBody: { padding: 16 },
  // Photo picker in modal
  modalAvatarRow: { alignItems: 'center', marginBottom: 24 },
  modalAvatarWrap: { position: 'relative' },
  modalAvatarImage: { width: 90, height: 90, borderRadius: 45 },
  modalAvatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarInitial: { fontSize: 36, fontWeight: '700', color: colors.white },
  modalAvatarHint: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  // Form
  field: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textarea: { height: 90, paddingTop: 12 },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  sizeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeChipText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  sizeChipTextActive: { color: colors.white, fontWeight: '700' },
});
