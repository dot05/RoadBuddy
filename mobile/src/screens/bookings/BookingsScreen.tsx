import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  ActivityIndicator, RefreshControl, TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';

interface Booking {
  id: string;
  user_id: string;
  transport_option_id: string;
  passenger_name: string;
  travel_date: string;
  include_return: boolean;
  return_date: string | null;
  going_fare_inr: number;
  return_fare_inr: number;
  total_fare_inr: number;
  status: string;
  created_at: string;
  selected_seats: string | null;
  travel_class: string | null;
  mode: string | null;
  transport_option_operator: string | null;
  origin: string | null;
  destination: string | null;
  hotel_name: string | null;
  hotel_city: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  num_guests: number | null;
  num_rooms: number | null;
  total_price_inr: number | null;
}

const modeIcons: Record<string, string> = {
  flight: '✈️',
  train: '🚆',
  bus: '🚌',
  hotel: '🏨',
  cab: '🚕',
};

const statusColors: Record<string, string> = {
  confirmed: '#10b981',
  completed: '#6366f1',
  cancelled: '#ef4444',
  pending: '#f59e0b',
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'transport' | 'hotels'>('transport');

  const fetchBookings = async () => {
    try {
      const res = await client.get('/api/booking/my');
      setBookings(res.data || []);
    } catch (err: any) {
      // Silently fail — user may have no bookings
      setBookings([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBookings().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Cancel your ${booking.mode || 'transport'} booking for ₹${booking.total_fare_inr?.toLocaleString('en-IN')}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/api/booking/${booking.id}/cancel`);
              Alert.alert('Cancelled', 'Booking has been cancelled.');
              fetchBookings();
            } catch {
              Alert.alert('Error', 'Could not cancel booking.');
            }
          },
        },
      ]
    );
  };

  const transportBookings = bookings.filter(b => !b.hotel_name);
  const hotelBookings = bookings.filter(b => !!b.hotel_name);
  const displayedBookings = activeTab === 'transport' ? transportBookings : hotelBookings;

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isHotel = !!item.hotel_name;
    const icon = isHotel ? '🏨' : modeIcons[item.mode || 'bus'] || '🎟️';
    const statusColor = statusColors[item.status] || '#64748b';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onLongPress={() => item.status === 'confirmed' && handleCancel(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <View style={styles.cardHeaderText}>
            {isHotel ? (
              <>
                <Text style={styles.cardTitle}>{item.hotel_name}</Text>
                <Text style={styles.cardSubtitle}>{item.hotel_city}</Text>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>
                  {item.origin} → {item.destination}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {item.transport_option_operator || item.mode?.toUpperCase()}
                </Text>
              </>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          {isHotel ? (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-in</Text>
                <Text style={styles.detailValue}>{item.check_in_date || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-out</Text>
                <Text style={styles.detailValue}>{item.check_out_date || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rooms / Guests</Text>
                <Text style={styles.detailValue}>{item.num_rooms} room · {item.num_guests} guests</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Travel Date</Text>
                <Text style={styles.detailValue}>{item.travel_date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Passenger</Text>
                <Text style={styles.detailValue}>{item.passenger_name}</Text>
              </View>
              {item.travel_class && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Class</Text>
                  <Text style={styles.detailValue}>{item.travel_class}</Text>
                </View>
              )}
              {item.include_return && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Return</Text>
                  <Text style={styles.detailValue}>{item.return_date || 'Yes'}</Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.fareLabel}>Total</Text>
          <Text style={styles.fareValue}>
            ₹{(isHotel ? item.total_price_inr : item.total_fare_inr)?.toLocaleString('en-IN') || '0'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transport' && styles.tabActive]}
          onPress={() => setActiveTab('transport')}
        >
          <Text style={[styles.tabText, activeTab === 'transport' && styles.tabTextActive]}>
            🎟️ Transport ({transportBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hotels' && styles.tabActive]}
          onPress={() => setActiveTab('hotels')}
        >
          <Text style={[styles.tabText, activeTab === 'hotels' && styles.tabTextActive]}>
            🏨 Hotels ({hotelBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>{activeTab === 'transport' ? '🎟️' : '🏨'}</Text>
            <Text style={styles.emptyTitle}>No {activeTab === 'transport' ? 'transport' : 'hotel'} bookings</Text>
            <Text style={styles.emptySubtitle}>
              Your {activeTab === 'transport' ? 'flight, train & bus' : 'hotel'} bookings will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#10b981',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#ffffff' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon: { fontSize: 28, marginRight: 12 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 13, color: '#94a3b8' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#334155' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  fareLabel: { fontSize: 13, color: '#64748b' },
  fareValue: { fontSize: 18, fontWeight: '800', color: '#10b981' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },
});
