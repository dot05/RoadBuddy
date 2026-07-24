import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
  Modal, TextInput, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';

interface Vehicle {
  id: string;
  user_id: string;
  name: string;
  fuel_type: 'petrol' | 'diesel' | 'cng' | 'electric';
  category: 'two_wheeler' | 'car' | 'suv' | 'van';
  mileage_kmpl: number;
  tank_capacity_litres: number | null;
  ev_range_km: number | null;
}

const fuelIcons: Record<string, string> = {
  petrol: '⛽',
  diesel: '🛢️',
  cng: '💨',
  electric: '⚡',
};

const categoryIcons: Record<string, string> = {
  two_wheeler: '🏍️',
  car: '🚗',
  suv: '🚙',
  van: '🚐',
};

const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'electric'] as const;
const CATEGORIES = ['two_wheeler', 'car', 'suv', 'van'] as const;

export default function GarageScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formFuelType, setFormFuelType] = useState<string>('petrol');
  const [formCategory, setFormCategory] = useState<string>('car');
  const [formMileage, setFormMileage] = useState('');

  const fetchVehicles = async () => {
    try {
      const res = await client.get('/api/users/vehicles');
      setVehicles(res.data || []);
    } catch {
      setVehicles([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchVehicles().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormName('');
    setFormFuelType('petrol');
    setFormCategory('car');
    setFormMileage('');
  };

  const handleAdd = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Please enter a vehicle name');
      return;
    }
    if (!formMileage.trim() || isNaN(Number(formMileage))) {
      Alert.alert('Error', 'Please enter a valid mileage');
      return;
    }

    setSaving(true);
    try {
      await client.post('/api/users/vehicles', {
        name: formName.trim(),
        fuel_type: formFuelType,
        category: formCategory,
        mileage_kmpl: parseFloat(formMileage),
      });
      setShowModal(false);
      resetForm();
      fetchVehicles();
      Alert.alert('Added!', `${formName.trim()} added to your garage.`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Could not add vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (vehicle: Vehicle) => {
    Alert.alert(
      'Remove Vehicle',
      `Remove "${vehicle.name}" from your garage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/api/users/vehicles/${vehicle.id}`);
              fetchVehicles();
            } catch {
              Alert.alert('Error', 'Could not remove vehicle');
            }
          },
        },
      ]
    );
  };

  const renderVehicleCard = ({ item }: { item: Vehicle }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.catIcon}>{categoryIcons[item.category] || '🚗'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCategory}>
            {item.category.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statIcon}>{fuelIcons[item.fuel_type]}</Text>
          <Text style={styles.statLabel}>{item.fuel_type}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statLabel}>{item.mileage_kmpl} km/L</Text>
        </View>
        {item.tank_capacity_litres && (
          <View style={styles.statChip}>
            <Text style={styles.statIcon}>🪣</Text>
            <Text style={styles.statLabel}>{item.tank_capacity_litres}L tank</Text>
          </View>
        )}
        {item.ev_range_km && (
          <View style={styles.statChip}>
            <Text style={styles.statIcon}>🔋</Text>
            <Text style={styles.statLabel}>{item.ev_range_km} km range</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicleCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🚗</Text>
            <Text style={styles.emptyTitle}>No vehicles in your garage yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first vehicle!</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Vehicle Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Add Vehicle</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Vehicle Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. My Swift, Royal Enfield"
                  placeholderTextColor="#94a3b8"
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Fuel Type</Text>
                <View style={styles.chipRow}>
                  {FUEL_TYPES.map((ft) => (
                    <TouchableOpacity
                      key={ft}
                      style={[styles.chip, formFuelType === ft && styles.chipActive]}
                      onPress={() => setFormFuelType(ft)}
                    >
                      <Text style={[styles.chipText, formFuelType === ft && styles.chipTextActive]}>
                        {fuelIcons[ft]} {ft}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.chipRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, formCategory === cat && styles.chipActive]}
                      onPress={() => setFormCategory(cat)}
                    >
                      <Text style={[styles.chipText, formCategory === cat && styles.chipTextActive]}>
                        {categoryIcons[cat]} {cat.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Mileage (km/L)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 18.5"
                  placeholderTextColor="#94a3b8"
                  value={formMileage}
                  onChangeText={setFormMileage}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setShowModal(false); resetForm(); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Add Vehicle</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 90 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  catIcon: { fontSize: 32, marginRight: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  cardCategory: { fontSize: 11, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statIcon: { fontSize: 14 },
  statLabel: { fontSize: 12, color: '#475569', fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 28, color: '#ffffff', fontWeight: '300', marginTop: -2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    backgroundColor: '#f1f5f9',
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#ecfdf5', borderColor: '#10b981' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#059669', fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10b981',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },
});
