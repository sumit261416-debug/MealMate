import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/Colors';
import { CustomerService, Order, quickDemoLogin } from '@/lib/api';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadOrders() {
    try {
      await quickDemoLogin().catch(() => {});
      const list = await CustomerService.getOrders();
      setOrders(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function getStepIndex(status: string): number {
    switch (status) {
      case 'placed':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  }

  const steps = [
    { label: 'Placed', icon: 'checkmark-circle' },
    { label: 'Accepted', icon: 'restaurant' },
    { label: 'Cooking', icon: 'flame' },
    { label: 'Delivery', icon: 'bicycle' },
    { label: 'Delivered', icon: 'home' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="receipt-outline" size={48} color={BrandColors.textMuted} />
          <Text style={styles.emptyTitle}>No Orders Placed Yet</Text>
          <Text style={styles.emptySub}>
            Order your first homestyle thali from the Daily Tiffin tab!
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />
          }
          renderItem={({ item, index }) => {
            const currentStep = getStepIndex(item.status);
            const isLive = item.status !== 'delivered' && item.status !== 'cancelled';

            return (
              <View style={[styles.orderCard, isLive && styles.orderCardLive]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.kitchenTitle}>
                      {item.partner?.businessName || 'Ghar Ka Khana Kitchen'}
                    </Text>
                    <Text style={styles.orderMeta}>
                      #{item.id.slice(-6).toUpperCase()} • {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isLive ? styles.statusPillLive : styles.statusPillDone,
                    ]}>
                    <Text
                      style={[
                        styles.statusPillText,
                        isLive ? styles.statusTextLive : styles.statusTextDone,
                      ]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Progress Stepper for Live Orders */}
                {isLive && (
                  <View style={styles.stepperContainer}>
                    <Text style={styles.liveTrackerHeading}>
                      ⚡ LIVE STATUS: {item.status === 'placed' ? 'Kitchen is reviewing your order' : item.status === 'accepted' ? 'Kitchen accepted your order' : item.status === 'preparing' ? 'Chef is cooking fresh rotis & dal' : 'Tiffin packed & ready for delivery rider'}
                    </Text>
                    <View style={styles.stepperRow}>
                      {steps.map((st, i) => {
                        const isCompleted = i <= currentStep;
                        return (
                          <View key={st.label} style={styles.stepCol}>
                            <View
                              style={[
                                styles.stepCircle,
                                isCompleted && styles.stepCircleActive,
                              ]}>
                              <Ionicons
                                name={st.icon as any}
                                size={14}
                                color={isCompleted ? '#ffffff' : '#94a3b8'}
                              />
                            </View>
                            <Text
                              style={[
                                styles.stepLabel,
                                isCompleted && styles.stepLabelActive,
                              ]}>
                              {st.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Items snapshot */}
                <View style={styles.itemsList}>
                  {item.items.map((it) => (
                    <View key={it.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>
                        {it.quantity}x {it.nameSnapshot}
                      </Text>
                      <Text style={styles.itemPrice}>
                        ₹{(it.pricePaiseSnapshot * it.quantity) / 100}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Footer Total & Address */}
                <View style={styles.cardFooter}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.footerAddress} numberOfLines={1}>
                      📍 {item.address?.pgName || 'PG'} • Room {item.address?.roomFlat || '204'}
                    </Text>
                  </View>
                  <Text style={styles.totalAmount}>₹{item.totalPaise / 100}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContent: {
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: BrandColors.textMuted,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  orderCardLive: {
    borderColor: BrandColors.primary,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  kitchenTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.text,
  },
  orderMeta: {
    fontSize: 11,
    color: BrandColors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillLive: {
    backgroundColor: '#d1fae5',
  },
  statusPillDone: {
    backgroundColor: '#f1f5f9',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextLive: {
    color: '#047857',
  },
  statusTextDone: {
    color: '#64748b',
  },
  stepperContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  liveTrackerHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCol: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: BrandColors.primary,
  },
  stepLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: BrandColors.primaryDark,
    fontWeight: '700',
  },
  itemsList: {
    paddingVertical: 12,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 13,
    color: BrandColors.text,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerAddress: {
    fontSize: 11,
    color: BrandColors.textMuted,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.text,
  },
});
