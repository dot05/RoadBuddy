import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, FlatList, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ExploreStackParamList } from '../../navigation/AppNavigator';
import client from '../../api/client';

type HotelSearchRouteProp = RouteProp<ExploreStackParamList, 'HotelSearch'>;

interface HotelResult {
  id: string | number;
  name: string;
  city: string;
  address: string | null;
  star_rating: number;
  price_per_night_inr: number;
  rooms_available: number;
  amenities: string | null;
  avg_rating: number;
  total_reviews: number;
}

export default function HotelSearchScreen() {
  const route = useRoute<HotelSearchRouteProp>();
  const [city, setCity] = useState(route.params?.city || '');
  const [checkIn, setCheckIn] = useState(route.params?.checkIn || '');
  const [checkOut, setCheckOut] = useState(route.params?.checkOut || '');
  const [numRooms, setNumRooms] = useState('1');
  const [results, setResults] = useState<HotelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Booking modal
  const [bookingHotel, setBookingHotel] = useState<HotelResult | null>(null);
  const [numGuests, setNumGuests] = useState('1');
  const [booking, setBooking] = useState(false);

  const handleSearch = async () => {
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await client.post('/api/booking/hotels/search', {
        city: city.trim(),
        check_in_date: checkIn.trim() || null,
        check_out_date: checkOut.trim() || null,
        num_rooms: parseInt(numRooms, 10) || 1,
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
    if (!bookingHotel) return;
    if (!checkIn.trim() || !checkOut.trim()) {
      Alert.alert('Error', 'Please enter check-in and check-out dates first');
      return;
    }
    setBooking(true);
    try {
      await client.post('/api/booking/hotels/book', {
        hotel_id: bookingHotel.id,
        check_in_date: checkIn.trim(),
        check_out_date: checkOut.trim(),
        num_rooms: parseInt(numRooms, 10) || 1,
        num_guests: parseInt(numGuests, 10) || 1,
      });
      Alert.alert('🎉 Booked!', `${bookingHotel.name} reservation confirmed!`);
      setBookingHotel(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const renderStars = (rating: number) => '⭐'.repeat(Math.round(rating));

  const renderHotelCard = ({ item }: { item: HotelResult }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => setBookingHotel(item)}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCity}>📍 {item.city}{item.address ? ` · ${item.address}` : ''}</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceText}>₹{item.price_per_night_inr?.toLocaleString('en-IN')}</Text>
          <Text style={styles.priceLabel}>/night</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>{renderStars(item.star_rating)} ({item.star_rating})</Text>
        <Text style={styles.metaText}>⭐ {item.avg_rating.toFixed(1)} ({item.total_reviews} reviews)</Text>
        <Text style={styles.metaText}>🛏️ {item.rooms_available} rooms</Text>
      </View>

      {item.amenities && (
        <View style={styles.amenitiesRow}>
          {item.amenities.split(',').slice(0, 4).map((a, i) => (
            <View key={i} style={styles.amenityBadge}>
              <Text style={styles.amenityText}>{a.trim()}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Search Form */}
        <View style={styles.formCard}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>City</Text>
            <TextInput style={styles.input} placeholder="e.g. Mumbai, Goa" placeholderTextColor="#94a3b8" value={city} onChangeText={setCity} />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Check-in</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={checkIn} onChangeText={setCheckIn} />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Check-out</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={checkOut} onChangeText={setCheckOut} />
            </View>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Rooms</Text>
            <TextInput style={styles.input} placeholder="1" placeholderTextColor="#94a3b8" value={numRooms} onChangeText={setNumRooms} keyboardType="number-pad" />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>🔍 Search Hotels</Text>}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {searched && !loading && (
          <View>
            <Text style={styles.resultsHeader}>{results.length} hotel{results.length !== 1 ? 's' : ''} found</Text>
            {results.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏨</Text>
                <Text style={styles.emptyTitle}>No hotels found</Text>
                <Text style={styles.emptySubtitle}>Try a different city</Text>
              </View>
            ) : (
              <FlatList data={results} keyExtractor={(item) => String(item.id)} renderItem={renderHotelCard} scrollEnabled={false} />
            )}
          </View>
        )}
      </ScrollView>

      {/* Booking Modal */}
      <Modal visible={!!bookingHotel} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Hotel</Text>
            {bookingHotel && (
              <>
                <Text style={styles.modalHotelName}>{bookingHotel.name}</Text>
                <Text style={styles.modalCity}>📍 {bookingHotel.city}</Text>
                <Text style={styles.modalPrice}>₹{bookingHotel.price_per_night_inr?.toLocaleString('en-IN')}/night</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Number of Guests</Text>
                  <TextInput style={styles.input} placeholder="1" placeholderTextColor="#94a3b8" value={numGuests} onChangeText={setNumGuests} keyboardType="number-pad" />
                </View>
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setBookingHotel(null)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={booking}>
                    {booking ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Confirm</Text>}
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
  searchBtn: { backgroundColor: '#10b981', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultsHeader: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  cardCity: { fontSize: 12, color: '#64748b', marginTop: 2 },
  priceBox: { alignItems: 'flex-end' },
  priceText: { fontSize: 18, fontWeight: '800', color: '#059669' },
  priceLabel: { fontSize: 11, color: '#94a3b8' },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#64748b' },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenityBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  amenityText: { fontSize: 10, fontWeight: '600', color: '#059669' },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  modalHotelName: { fontSize: 17, fontWeight: '700', color: '#334155' },
  modalCity: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  modalPrice: { fontSize: 22, fontWeight: '800', color: '#059669', marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  bookBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981' },
  bookBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
