import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ExploreStackParamList } from '../../navigation/AppNavigator';
import client from '../../api/client';

type MenuRouteProp = RouteProp<ExploreStackParamList, 'RestaurantMenu'>;

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price_inr: number;
  category: string;
  rating: number;
}

interface CartItem {
  menu_item_id: number;
  name: string;
  quantity: number;
  price: number;
}

export default function RestaurantMenuScreen() {
  const route = useRoute<MenuRouteProp>();
  const { restaurantId, restaurantName } = route.params;
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await client.get(`/api/food/restaurants/${restaurantId}/menu`);
      setMenu(res.data?.menu_items || []);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Could not load menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menu_item_id: item.id, name: item.name, quantity: 1, price: item.price_inr }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menu_item_id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.menu_item_id !== itemId);
    });
  };

  const getCartQty = (itemId: number) => {
    return cart.find((c) => c.menu_item_id === itemId)?.quantity || 0;
  };

  const totalAmount = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Add items to your cart first');
      return;
    }
    setOrdering(true);
    try {
      await client.post('/api/food/orders', {
        restaurant_id: restaurantId,
        items: cart.map((c) => ({
          menu_item_id: c.menu_item_id,
          name: c.name,
          quantity: c.quantity,
          price: c.price,
        })),
        total_amount: totalAmount,
      });
      Alert.alert('🎉 Order Placed!', `Your order from ${restaurantName} has been placed!`);
      setCart([]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Could not place order');
    } finally {
      setOrdering(false);
    }
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const qty = getCartQty(item.id);
    return (
      <View style={styles.menuCard}>
        <View style={styles.menuInfo}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.menuName}>{item.name}</Text>
          <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.menuBottom}>
            <Text style={styles.menuPrice}>₹{item.price_inr}</Text>
            {item.rating > 0 && <Text style={styles.menuRating}>⭐ {item.rating.toFixed(1)}</Text>}
          </View>
        </View>
        <View style={styles.qtyControls}>
          {qty > 0 ? (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyCount}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          )}
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
        data={menu}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMenuItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No menu items</Text>
          </View>
        }
      />

      {/* Cart Footer */}
      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <View>
            <Text style={styles.cartItems}>
              {cart.reduce((sum, c) => sum + c.quantity, 0)} item{cart.reduce((sum, c) => sum + c.quantity, 0) !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.cartTotal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity style={styles.orderBtn} onPress={handleOrder} disabled={ordering}>
            {ordering ? <ActivityIndicator color="#fff" /> : <Text style={styles.orderBtnText}>Place Order →</Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  menuCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  menuInfo: { flex: 1, marginRight: 12 },
  categoryBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 4 },
  categoryText: { fontSize: 10, fontWeight: '700', color: '#059669' },
  menuName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  menuDesc: { fontSize: 12, color: '#64748b', lineHeight: 17, marginBottom: 6 },
  menuBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuPrice: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  menuRating: { fontSize: 12, color: '#f59e0b' },
  qtyControls: { justifyContent: 'center', alignItems: 'center', minWidth: 80 },
  addBtn: { borderWidth: 1.5, borderColor: '#10b981', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 },
  addBtnText: { fontSize: 13, fontWeight: '800', color: '#10b981' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', borderRadius: 8 },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  qtyCount: { fontSize: 15, fontWeight: '800', color: '#fff', minWidth: 20, textAlign: 'center' },
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cartItems: { fontSize: 12, color: '#94a3b8' },
  cartTotal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  orderBtn: { backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  orderBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
});
