import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';

interface FoodOrder {
  id: number;
  restaurant_name: string;
  restaurant_city: string;
  items: { name: string; quantity: number; price: number }[];
  total_amount: number;
  status: string;
  preparation_time_mins: number;
  user_arrival_time_mins: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#10b981',
  completed: '#6366f1',
  cancelled: '#ef4444',
};

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await client.get('/api/food/my-orders');
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const renderOrderCard = ({ item }: { item: FoodOrder }) => {
    const statusColor = statusColors[item.status] || '#64748b';
    const itemsList = (item.items || []).map((i) => `${i.name} × ${i.quantity}`).join(', ');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🍽️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.restaurant_name}</Text>
            <Text style={styles.cardCity}>📍 {item.restaurant_city}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.itemsList} numberOfLines={2}>{itemsList}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.totalAmount}>₹{item.total_amount?.toLocaleString('en-IN')}</Text>
          <View style={styles.timeInfo}>
            {item.preparation_time_mins > 0 && (
              <Text style={styles.timeText}>👨‍🍳 {item.preparation_time_mins}m prep</Text>
            )}
            <Text style={styles.timeText}>📅 {new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
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
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Your food orders will appear here</Text>
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
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardIcon: { fontSize: 24, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardCity: { fontSize: 11, color: '#64748b', marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  itemsList: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  totalAmount: { fontSize: 17, fontWeight: '800', color: '#10b981' },
  timeInfo: { flexDirection: 'row', gap: 10 },
  timeText: { fontSize: 11, color: '#94a3b8' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8' },
});
