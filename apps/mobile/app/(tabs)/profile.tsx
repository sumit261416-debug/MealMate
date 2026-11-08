import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/Colors';
import {
  CustomerAddress,
  CustomerService,
  getCurrentUser,
  logout,
  quickDemoLogin,
} from '@/lib/api';

export default function ProfileScreen() {
  const [user, setUser] = useState(getCurrentUser());
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  // New address form
  const [pgName, setPgName] = useState('');
  const [roomFlat, setRoomFlat] = useState('');
  const [line1, setLine1] = useState('');
  const [landmark, setLandmark] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadProfile() {
    try {
      if (!getCurrentUser()) {
        await quickDemoLogin().catch(() => {});
        setUser(getCurrentUser());
      } else {
        setUser(getCurrentUser());
      }

      const list = await CustomerService.getAddresses().catch(() => []);
      setAddresses(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleAddAddress() {
    if (!line1.trim() || !pgName.trim()) {
      Alert.alert('Required Fields', 'Please enter your PG / Hostel Name and Area address.');
      return;
    }

    setSaving(true);
    try {
      await CustomerService.createAddress({
        label: 'PG',
        pgName: pgName.trim(),
        roomFlat: roomFlat.trim() || 'Room 101',
        line1: line1.trim(),
        landmark: landmark.trim() || undefined,
        instructions: instructions.trim() || undefined,
        serviceAreaId: 'cmvr11us90005scs76cm2v20g', // Sector 62
        isDefault: true,
      });

      setShowAddAddress(false);
      setPgName('');
      setRoomFlat('');
      setLine1('');
      setLandmark('');
      setInstructions('');
      Alert.alert('Address Saved', 'Your PG room address has been saved for all future tiffin deliveries.');
      loadProfile();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} />
        }>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={28} color={BrandColors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.fullName || 'Demo PG Resident'}</Text>
            <Text style={styles.userPhone}>+91 99990 00002 • customer.demo@mealmate.local</Text>
            <View style={styles.residentTag}>
              <Text style={styles.residentTagText}>🎓 Verified Student / Resident</Text>
            </View>
          </View>
        </View>

        {/* Saved Delivery Addresses */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Saved PG & Hostel Addresses</Text>
          <Pressable
            style={styles.addAddrButton}
            onPress={() => setShowAddAddress(true)}>
            <Ionicons name="add-circle" size={16} color={BrandColors.primary} />
            <Text style={styles.addAddrText}>Add New PG</Text>
          </Pressable>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyAddressCard}>
            <Ionicons name="home-outline" size={32} color={BrandColors.textMuted} />
            <Text style={styles.emptyAddrTitle}>No Saved PG Address</Text>
            <Text style={styles.emptyAddrSub}>Add your PG / Room number for seamless delivery.</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.addrHeaderRow}>
                <View style={styles.addrTypeBadge}>
                  <Text style={styles.addrTypeText}>
                    {addr.label || 'PG'} {addr.isDefault && '★ DEFAULT'}
                  </Text>
                </View>
              </View>

              <Text style={styles.pgNameText}>{addr.pgName || 'Sunrise PG'}</Text>
              <Text style={styles.roomFlatText}>
                Room / Flat: {addr.roomFlat || '204'}
              </Text>
              <Text style={styles.line1Text}>{addr.line1}</Text>
              {addr.landmark ? (
                <Text style={styles.landmarkText}>Landmark: {addr.landmark}</Text>
              ) : null}

              <View style={styles.localityRow}>
                <Ionicons name="location" size={13} color={BrandColors.primary} />
                <Text style={styles.localityText}>Noida Sector 62 (Serviceable Zone)</Text>
              </View>
            </View>
          ))
        )}

        {/* App Info & Settings */}
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={BrandColors.text} />
            <Text style={styles.settingLabel}>Food Safety & FSSAI Standards</Text>
            <Ionicons name="chevron-forward" size={18} color={BrandColors.textMuted} />
          </View>
          <View style={styles.settingRow}>
            <Ionicons name="help-buoy-outline" size={20} color={BrandColors.text} />
            <Text style={styles.settingLabel}>Customer Support & Ticket</Text>
            <Ionicons name="chevron-forward" size={18} color={BrandColors.textMuted} />
          </View>
          <View style={styles.settingRow}>
            <Ionicons name="document-text-outline" size={20} color={BrandColors.text} />
            <Text style={styles.settingLabel}>Cancellation & Skip Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={BrandColors.textMuted} />
          </View>
        </View>

        {/* Demo Fast Login / Switch Button */}
        <Pressable
          style={styles.switchButton}
          onPress={async () => {
            await quickDemoLogin();
            loadProfile();
            Alert.alert('Session Synced', 'Logged in as Demo PG Customer.');
          }}>
          <Ionicons name="refresh-circle" size={20} color={BrandColors.primary} />
          <Text style={styles.switchButtonText}>Sync Demo Account</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Add Address */}
      <Modal visible={showAddAddress} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add PG / Hostel Address</Text>
              <Pressable onPress={() => setShowAddAddress(false)}>
                <Ionicons name="close" size={22} color={BrandColors.text} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>PG or Hostel Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Royal PG for Boys / Stanza Living"
                value={pgName}
                onChangeText={setPgName}
              />

              <Text style={styles.inputLabel}>Room / Flat Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Room 204 (2nd Floor)"
                value={roomFlat}
                onChangeText={setRoomFlat}
              />

              <Text style={styles.inputLabel}>Street / Building Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Plot B-14, Block C, Near Fortis"
                value={line1}
                onChangeText={setLine1}
              />

              <Text style={styles.inputLabel}>Nearby Landmark</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Opposite Sector 62 Park"
                value={landmark}
                onChangeText={setLandmark}
              />

              <Text style={styles.inputLabel}>Instructions for Delivery Rider</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Call upon reaching gate / leave at guard desk"
                value={instructions}
                onChangeText={setInstructions}
              />
            </ScrollView>

            <Pressable
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={handleAddAddress}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save PG Address</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 20,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.text,
  },
  userPhone: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 2,
  },
  residentTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  residentTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.text,
  },
  addAddrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addAddrText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  emptyAddressCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  emptyAddrTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.text,
    marginTop: 6,
  },
  emptyAddrSub: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 2,
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },
  addrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  addrTypeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addrTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.textMuted,
  },
  pgNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.text,
  },
  roomFlatText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.primaryDark,
    marginTop: 2,
  },
  line1Text: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 4,
  },
  landmarkText: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 2,
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  localityText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.text,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 20,
  },
  switchButtonText: {
    color: BrandColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.text,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: BrandColors.text,
    backgroundColor: '#f8fafc',
  },
  saveButton: {
    backgroundColor: BrandColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
