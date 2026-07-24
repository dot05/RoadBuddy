import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';

interface RouteOut {
  id: string;
  title: string;
  origin: string;
  destination: string;
  description: string;
  tags: string[];
  avg_rating: number;
  total_reviews: number;
  clone_count: number;
  author_name: string;
}

function renderStars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

export default function CommunityScreen() {
  const [routes, setRoutes] = useState<RouteOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRoutes = async () => {
    try {
      const res = await client.get('/api/community/routes');
      setRoutes(res.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Could not load community routes';
      Alert.alert('Error', msg);
      setRoutes([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRoutes().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoutes();
    setRefreshing(false);
  };

  const handleClone = async (routeId: string) => {
    try {
      await client.post(`/api/community/routes/${routeId}/clone`);
      Alert.alert('Cloned!', 'Route has been added to your trips.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Could not clone route');
    }
  };

  const renderRouteCard = ({ item }: { item: RouteOut }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.routeText}>
            {item.origin} → {item.destination}
          </Text>
        </View>
        <TouchableOpacity style={styles.cloneBtn} onPress={() => handleClone(item.id)}>
          <Text style={styles.cloneBtnText}>📋 Clone</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {item.description}
      </Text>

      {item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.map((tag, i) => (
            <View key={i} style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.starsText}>
          {renderStars(item.avg_rating)}{' '}
          <Text style={styles.ratingNum}>{item.avg_rating.toFixed(1)}</Text>
        </Text>
        <Text style={styles.metaText}>{item.total_reviews} reviews</Text>
        <Text style={styles.metaText}>📋 {item.clone_count}</Text>
        <Text style={styles.authorText}>by {item.author_name}</Text>
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
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderRouteCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌐</Text>
            <Text style={styles.emptyTitle}>No community routes shared yet</Text>
            <Text style={styles.emptySubtitle}>
              Shared trip routes from other travelers will appear here
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
  listContent: { padding: 16 },
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  routeText: { fontSize: 13, color: '#10b981', fontWeight: '600', marginTop: 2 },
  cloneBtn: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  cloneBtnText: { fontSize: 12, fontWeight: '600', color: '#10b981' },
  description: { fontSize: 13, color: '#64748b', lineHeight: 19, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tagBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: '#059669' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    gap: 12,
  },
  starsText: { fontSize: 13, color: '#f59e0b' },
  ratingNum: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  metaText: { fontSize: 12, color: '#94a3b8' },
  authorText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginLeft: 'auto' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },
});
