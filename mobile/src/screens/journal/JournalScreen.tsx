import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';

interface JournalOut {
  id: string;
  trip_id: string;
  entries: any[];
  total_expense_inr: number;
  is_public: boolean;
}

export default function JournalScreen() {
  const [journals, setJournals] = useState<JournalOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJournals = async () => {
    try {
      const res = await client.get('/api/journal/');
      setJournals(res.data || []);
    } catch (err: any) {
      setJournals([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchJournals().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJournals();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const renderJournalCard = ({ item }: { item: JournalOut }) => {
    const entryCount = item.entries?.length || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Trip Journal</Text>
            <Text style={styles.tripId}>Trip #{item.trip_id}</Text>
          </View>
          <View style={[styles.visBadge, item.is_public ? styles.publicBadge : styles.privateBadge]}>
            <Text style={[styles.visText, item.is_public ? styles.publicText : styles.privateText]}>
              {item.is_public ? '🌍 Public' : '🔒 Private'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatCurrency(item.total_expense_inr)}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{entryCount}</Text>
            <Text style={styles.statLabel}>{entryCount === 1 ? 'Entry' : 'Entries'}</Text>
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
        data={journals}
        keyExtractor={(item) => item.id}
        renderItem={renderJournalCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📓</Text>
            <Text style={styles.emptyTitle}>No trip journals yet</Text>
            <Text style={styles.emptySubtitle}>
              Start documenting your adventures!
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIcon: { fontSize: 28, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  tripId: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  visBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  publicBadge: { backgroundColor: '#ecfdf5' },
  privateBadge: { backgroundColor: '#f1f5f9' },
  visText: { fontSize: 11, fontWeight: '700' },
  publicText: { color: '#059669' },
  privateText: { color: '#64748b' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#e2e8f0' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },
});
