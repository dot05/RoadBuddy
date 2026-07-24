import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, FlatList, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ExploreStackParamList } from '../../navigation/AppNavigator';
import client from '../../api/client';

type TransportSearchRouteProp = RouteProp<ExploreStackParamList, 'TransportSearch'>;

interface TransportResult {
  id: string | number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration_hrs: number;
  fare_inr: number;
  seats_available: number;
  // Mode-specific
  operator_name?: string;
  bus_type?: string;
  train_name?: string;
  train_number?: string;
  travel_class?: string;
  airline?: string;
  flight_number?: string;
}

const MODES = [
  { key: 'trains', label: '🚆 Trains', searchEndpoint: '/api/booking/trains/search', bookEndpoint: '/api/booking/trains/book', idField: 'train_id' },
  { key: 'buses', label: '🚌 Buses', searchEndpoint: '/api/booking/buses/search', bookEndpoint: '/api/booking/buses/book', idField: 'bus_id' },
  { key: 'flights', label: '✈️ Flights', searchEndpoint: '/api/booking/flights/search', bookEndpoint: '/api/booking/flights/book', idField: 'flight_id' },
];

export default function TransportSearchScreen() {
  const route = useRoute<TransportSearchRouteProp>();
  const [origin, setOrigin] = useState(route.params?.origin || '');
  const [destination, setDestination] = useState(route.params?.destination || '');
  const [travelDate, setTravelDate] = useState(route.params?.date || '');
  const [activeMode, setActiveMode] = useState(0);
  const [results, setResults] = useState<TransportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Booking modal
  const [bookingItem, setBookingItem] = useState<TransportResult | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [booking, setBooking] = useState(false);

  const handleSearch = async () => {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert('Error', 'Please enter origin and destination');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const mode = MODES[activeMode];
      const res = await client.post(mode.searchEndpoint, {
        origin: origin.trim(),
        destination: destination.trim(),
        travel_date: travelDate.trim() || null,
      });
      setResults(res.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!bookingItem || !passengerName.trim()) {
      Alert.alert('Error', 'Please enter passenger name');
      return;
    }
    setBooking(true);
    try {
      const mode = MODES[activeMode];
      const body: any = {
        [mode.idField]: bookingItem.id,
        passenger_name: passengerName.trim(),
        travel_date: travelDate.trim() || new Date().toISOString().split('T')[0],
      };
      await client.post(mode.bookEndpoint, body);
      Alert.alert('🎉 Booked!', `${passengerName.trim()}'s ${MODES[activeMode].key.slice(0, -1)} booking confirmed!`);
      setBookingItem(null);
      setPassengerName('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const getItemTitle = (item: TransportResult) => {
    if (item.train_name) return `${item.train_name} (${item.train_number})`;
    if (item.airline) return `${item.airline} ${item.flight_number}`;
    if (item.operator_name) return `${item.operator_name} ${item.bus_type || ''}`.trim();
    return `${item.origin} → ${item.destination}`;
  };

  const renderResult = ({ item }: { item: TransportResult }) => (
    <TouchableOpacity style={styles.resultCard} activeOpacity={0.8} onPress={() => setBookingItem(item)}>
      <View style={styles.resultHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultTitle}>{getItemTitle(item)}</Text>
          <Text style={styles.resultRoute}>{item.origin} → {item.destination}</Text>
        </View>
        <View style={styles.fareBox}>
          <Text style={styles.fareText}>₹{item.fare_inr?.toLocaleString('en-IN')}</Text>
        </View>
      </View>
      <View style={styles.resultMeta}>
        <Text style={styles.metaText}>🕐 {item.departure_time} → {item.arrival_time}</Text>
        <Text style={styles.metaText}>⏱️ {item.duration_hrs}h</Text>
        <Text style={styles.metaText}>💺 {item.seats_available} seats</Text>
        {item.travel_class && <Text style={styles.metaText}>🎫 {item.travel_class}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Search Form */}
        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.inputLabel}>From</Text>
              <TextInput style={styles.input} placeholder="e.g. Delhi" placeholderTextColor="#94a3b8" value={origin} onChangeText={setOrigin} />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.inputLabel}>To</Text>
              <TextInput style={styles.input} placeholder="e.g. Mumbai" placeholderTextColor="#94a3b8" value={destination} onChangeText={setDestination} />
            </View>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Date (optional)</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={travelDate} onChangeText={setTravelDate} />
          </View>

          {/* Mode Tabs */}
          <View style={styles.modeRow}>
            {MODES.map((m, i) => (
              <TouchableOpacity key={m.key} style={[styles.modeTab, activeMode === i && styles.modeTabActive]} onPress={() => { setActiveMode(i); setResults([]); setSearched(false); }}>
                <Text style={[styles.modeTabText, activeMode === i && styles.modeTabTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>Search {MODES[activeMode].label}</Text>}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {searched && !loading && (
          <View>
            <Text style={styles.resultsHeader}>{results.length} result{results.length !== 1 ? 's' : ''} found</Text>
            {results.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>No {MODES[activeMode].key} found</Text>
                <Text style={styles.emptySubtitle}>Try different cities or dates</Text>
              </View>
            ) : (
              <FlatList data={results} keyExtractor={(item) => String(item.id)} renderItem={renderResult} scrollEnabled={false} />
            )}
          </View>
        )}
      </ScrollView>

      {/* Booking Modal */}
      <Modal visible={!!bookingItem} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book {MODES[activeMode].key.slice(0, -1)}</Text>
            {bookingItem && (
              <>
                <Text style={styles.modalInfo}>{getItemTitle(bookingItem)}</Text>
                <Text style={styles.modalRoute}>{bookingItem.origin} → {bookingItem.destination}</Text>
                <Text style={styles.modalFare}>₹{bookingItem.fare_inr?.toLocaleString('en-IN')}</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Passenger Name</Text>
                  <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#94a3b8" value={passengerName} onChangeText={setPassengerName} />
                </View>
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setBookingItem(null); setPassengerName(''); }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={booking}>
                    {booking ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Confirm Booking</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16 },
  formCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', gap: 12 },
  inputWrapper: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  input: { backgroundColor: '#f1f5f9', height: 46, borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modeTabActive: { backgroundColor: '#10b981' },
  modeTabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  modeTabTextActive: { color: '#fff' },
  searchBtn: { backgroundColor: '#10b981', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultsHeader: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 12 },
  resultCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  resultRoute: { fontSize: 12, color: '#10b981', fontWeight: '600', marginTop: 2 },
  fareBox: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  fareText: { fontSize: 16, fontWeight: '800', color: '#059669' },
  resultMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaText: { fontSize: 12, color: '#64748b' },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  modalInfo: { fontSize: 16, fontWeight: '700', color: '#334155' },
  modalRoute: { fontSize: 14, color: '#10b981', fontWeight: '600', marginBottom: 4 },
  modalFare: { fontSize: 22, fontWeight: '800', color: '#059669', marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  bookBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981' },
  bookBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
