import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ExploreStackParamList } from '../../navigation/AppNavigator';
import client from '../../api/client';

type Nav = StackNavigationProp<ExploreStackParamList, 'RestaurantList'>;
type RoutePropType = RouteProp<ExploreStackParamList, 'RestaurantList'>;

interface Restaurant {
  id: number;
  name: string;
  city: string;
  address: string;
  rating: number;
  reviews_count: number;
  contact_number: string;
}

export default function RestaurantListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RoutePropType>();
  const [city, setCity] = useState(route.params?.city || '');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await client.get('/api/food/restaurants', { params: { city: city.trim() } });
      setRestaurants(res.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Could not load restaurants');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('RestaurantMenu', { restaurantId: item.id, restaurantName: item.name })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>🍽️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCity}>📍 {item.city} · {item.address}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>⭐ {item.rating?.toFixed(1)} ({item.reviews_count} reviews)</Text>
        {item.contact_number && <Text style={styles.metaText}>📞 {item.contact_number}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search city (e.g. Mumbai, Goa)"
          placeholderTextColor="#94a3b8"
          value={city}
          onChangeText={setCity}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.searchBtnText}>🔍</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          searched && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>No restaurants found</Text>
              <Text style={styles.emptySubtitle}>Try a different city</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  searchBar: { flexDirection: 'row', padding: 16, gap: 10 },
  searchInput: { flex: 1, backgroundColor: '#fff', height: 46, borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  searchBtn: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { fontSize: 18 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardIcon: { fontSize: 28, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  cardCity: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 12, color: '#64748b' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8' },
});
