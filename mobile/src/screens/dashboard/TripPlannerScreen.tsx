import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import client from '../../api/client';

const TRAVEL_MODES = [
  { key: 'own_vehicle', label: '🚗 Own Vehicle' },
  { key: 'cab_service', label: '🚕 Cab' },
  { key: 'bus', label: '🚌 Bus' },
  { key: 'train', label: '🚆 Train' },
  { key: 'flight', label: '✈️ Flight' },
];

const GROUP_TYPES = [
  { key: 'solo', label: '🧑 Solo' },
  { key: 'couple', label: '💑 Couple' },
  { key: 'family', label: '👨‍👩‍👧 Family' },
  { key: 'friends', label: '👫 Friends' },
];

export default function TripPlannerScreen() {
  const navigation = useNavigation();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetInr, setBudgetInr] = useState('');
  const [travelMode, setTravelMode] = useState('own_vehicle');
  const [groupType, setGroupType] = useState('solo');
  const [numPeople, setNumPeople] = useState('1');
  const [vehicleId, setVehicleId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert('Error', 'Please enter origin and destination');
      return;
    }
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert('Error', 'Please enter start and end dates (YYYY-MM-DD)');
      return;
    }
    if (!budgetInr.trim() || isNaN(Number(budgetInr))) {
      Alert.alert('Error', 'Please enter a valid budget');
      return;
    }
    if (travelMode === 'own_vehicle' && !vehicleId.trim()) {
      Alert.alert('Error', 'Please enter a vehicle ID for own vehicle mode');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        origin: origin.trim(),
        destination: destination.trim(),
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        budget_inr: parseFloat(budgetInr),
        travel_mode: travelMode,
        group_type: groupType,
        num_people: parseInt(numPeople, 10) || 1,
      };
      if (travelMode === 'own_vehicle') {
        body.vehicle_id = vehicleId.trim();
      }

      const res = await client.post('/api/trips/generate', body);
      const trip = res.data;

      Alert.alert(
        '🎉 Trip Planned!',
        `${trip.origin} → ${trip.destination}\n\n${trip.ai_summary}\n\n📏 ${trip.total_distance_km} km\n📍 ${trip.stops?.length || 0} stops\n💰 ₹${trip.total_estimated_cost_inr?.toLocaleString('en-IN')}`,
        [{ text: 'View Trips', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate trip. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Route Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Route</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Origin</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Delhi"
              placeholderTextColor="#94a3b8"
              value={origin}
              onChangeText={setOrigin}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Destination</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Goa"
              placeholderTextColor="#94a3b8"
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>

        {/* Dates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Dates</Text>
          <View style={styles.rowInputs}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>
        </View>

        {/* Budget Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Budget</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Budget (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15000"
              placeholderTextColor="#94a3b8"
              value={budgetInr}
              onChangeText={setBudgetInr}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Travel Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Travel Mode</Text>
          <View style={styles.chipRow}>
            {TRAVEL_MODES.map((tm) => (
              <TouchableOpacity
                key={tm.key}
                style={[styles.chip, travelMode === tm.key && styles.chipActive]}
                onPress={() => setTravelMode(tm.key)}
              >
                <Text style={[styles.chipText, travelMode === tm.key && styles.chipTextActive]}>
                  {tm.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {travelMode === 'own_vehicle' && (
            <View style={[styles.inputWrapper, { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>Vehicle ID</Text>
              <TextInput
                style={styles.input}
                placeholder="From your Garage"
                placeholderTextColor="#94a3b8"
                value={vehicleId}
                onChangeText={setVehicleId}
              />
            </View>
          )}
        </View>

        {/* Group */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Group</Text>
          <View style={styles.chipRow}>
            {GROUP_TYPES.map((gt) => (
              <TouchableOpacity
                key={gt.key}
                style={[styles.chip, groupType === gt.key && styles.chipActive]}
                onPress={() => setGroupType(gt.key)}
              >
                <Text style={[styles.chipText, groupType === gt.key && styles.chipTextActive]}>
                  {gt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.inputWrapper, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>Number of People</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#94a3b8"
              value={numPeople}
              onChangeText={setNumPeople}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>🗺️  Generate AI Itinerary</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16 },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  inputWrapper: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  input: {
    backgroundColor: '#f1f5f9',
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowInputs: { flexDirection: 'row', gap: 12 },
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
  submitBtn: {
    backgroundColor: '#10b981',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 4,
  },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
