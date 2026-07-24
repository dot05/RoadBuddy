import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { ExploreStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/authStore';
import client from '../../api/client';

type ExploreNav = StackNavigationProp<ExploreStackParamList, 'ExploreHome'>;

interface Trip {
  id: string;
  origin: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travel_mode: string;
  total_distance_km: number;
  total_estimated_cost_inr: number;
  ai_summary: string;
}

const modeIcons: Record<string, string> = {
  own_vehicle: '🚗',
  cab_service: '🚕',
  bus: '🚌',
  train: '🚆',
  flight: '✈️',
};

export default function ExploreScreen() {
  const navigation = useNavigation<ExploreNav>();
  const { user } = useAuthStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    try {
      const res = await client.get('/api/trips/my');
      setTrips(res.data || []);
    } catch {
      setTrips([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTrips().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  const handleTripPress = async (trip: Trip) => {
    try {
      const res = await client.get(`/api/trips/${trip.id}`);
      const detail = res.data;
      Alert.alert(
        `${detail.origin} → ${detail.destination}`,
        `${detail.ai_summary}\n\n📏 ${detail.total_distance_km} km\n💰 ₹${detail.total_estimated_cost_inr?.toLocaleString('en-IN')}\n📍 ${detail.stops?.length || 0} stops`
      );
    } catch {
      Alert.alert('Trip Details', `${trip.origin} → ${trip.destination}\n💰 ₹${trip.total_estimated_cost_inr?.toLocaleString('en-IN')}`);
    }
  };

  const handleDeleteTrip = (trip: Trip) => {
    Alert.alert('Delete Trip', `Delete ${trip.origin} → ${trip.destination}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/api/trips/${trip.id}`);
            fetchTrips();
          } catch {
            Alert.alert('Error', 'Could not delete trip');
          }
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View>
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>
          Hey, {user?.name?.split(' ')[0] || 'Traveler'}! 🚗
        </Text>
        <Text style={styles.greetingSub}>Where are you headed next?</Text>
      </View>

      {/* Plan Trip CTA */}
      <TouchableOpacity
        style={styles.ctaCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('TripPlanner')}
      >
        <View style={styles.ctaContent}>
          <Text style={styles.ctaEmoji}>🗺️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Plan a New Trip</Text>
            <Text style={styles.ctaSub}>AI-powered itinerary with cost breakdown</Text>
          </View>
          <Text style={styles.ctaArrow}>→</Text>
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('TransportSearch', {})}
        >
          <Text style={styles.qaIcon}>✈️</Text>
          <Text style={styles.qaLabel}>Transport</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('HotelSearch', {})}
        >
          <Text style={styles.qaIcon}>🏨</Text>
          <Text style={styles.qaLabel}>Hotels</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('RestaurantList', {})}
        >
          <Text style={styles.qaIcon}>🍽️</Text>
          <Text style={styles.qaLabel}>Food</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('MyOrders', undefined)}
        >
          <Text style={styles.qaIcon}>📦</Text>
          <Text style={styles.qaLabel}>Orders</Text>
        </TouchableOpacity>
      </View>

      {/* My Trips heading */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Trips</Text>
        <Text style={styles.sectionCount}>{trips.length} total</Text>
      </View>
    </View>
  );

  const renderTripCard = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      activeOpacity={0.8}
      onPress={() => handleTripPress(item)}
      onLongPress={() => handleDeleteTrip(item)}
    >
      <View style={styles.tripHeader}>
        <Text style={styles.tripIcon}>{modeIcons[item.travel_mode] || '🗺️'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.tripRoute}>
            {item.origin} → {item.destination}
          </Text>
          <Text style={styles.tripMode}>
            {item.travel_mode?.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.tripMeta}>
        <View style={styles.tripMetaItem}>
          <Text style={styles.metaLabel}>📅</Text>
          <Text style={styles.metaValue}>{item.start_date || '—'}</Text>
        </View>
        <View style={styles.tripMetaItem}>
          <Text style={styles.metaLabel}>📏</Text>
          <Text style={styles.metaValue}>{item.total_distance_km} km</Text>
        </View>
        <View style={styles.tripMetaItem}>
          <Text style={styles.metaLabel}>💰</Text>
          <Text style={[styles.metaValue, { color: '#10b981', fontWeight: '800' }]}>
            ₹{item.total_estimated_cost_inr?.toLocaleString('en-IN') || '0'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripCard}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏖️</Text>
            <Text style={styles.emptyTitle}>No trips yet!</Text>
            <Text style={styles.emptySubtitle}>Plan your first adventure above</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  greetingContainer: { marginBottom: 20, paddingTop: 8 },
  greeting: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  greetingSub: { fontSize: 15, color: '#64748b', marginTop: 4 },
  ctaCard: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  ctaContent: { flexDirection: 'row', alignItems: 'center' },
  ctaEmoji: { fontSize: 36, marginRight: 14 },
  ctaTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  ctaSub: { fontSize: 13, color: '#d1fae5', marginTop: 2 },
  ctaArrow: { fontSize: 24, color: '#d1fae5', fontWeight: '300' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  sectionCount: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  qaIcon: { fontSize: 22, marginBottom: 4 },
  qaLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
  tripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tripHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tripIcon: { fontSize: 28, marginRight: 12 },
  tripRoute: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  tripMode: { fontSize: 11, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  tripMeta: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    gap: 16,
  },
  tripMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaLabel: { fontSize: 13 },
  metaValue: { fontSize: 13, color: '#475569', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },
});
