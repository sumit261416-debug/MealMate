import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/Colors';
import {
  addToCart,
  CustomerService,
  getCart,
  getCartCount,
  getCartTotalPaise,
  getCurrentUser,
  Kitchen,
  MealSlot,
  MenuItem,
  quickDemoLogin,
  removeFromCart,
  subscribeCart,
} from '@/lib/api';

export default function HomeScreen() {
  const router = useRouter();
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [mealSlots, setMealSlots] = useState<MealSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('lunch');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(getCartCount());
  const [cartTotal, setCartTotal] = useState(getCartTotalPaise());
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const unsubscribe = subscribeCart(() => {
      setCartCount(getCartCount());
      setCartTotal(getCartTotalPaise());
    });
    return unsubscribe;
  }, []);

  async function loadData() {
    setError(null);
    try {
      // Auto-login demo customer if not logged in for quick frictionless demo
      if (!getCurrentUser()) {
        await quickDemoLogin().catch(() => {});
        setUser(getCurrentUser());
      }

      const [slotsData, kitchensData] = await Promise.all([
        CustomerService.getMealSlots().catch(() => []),
        CustomerService.getKitchens().catch(() => []),
      ]);

      setMealSlots(slotsData);
      setKitchens(kitchensData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily tiffins');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  function getItemCartQuantity(itemId: string) {
    const item = getCart().find((c) => c.item.id === itemId);
    return item ? item.quantity : 0;
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header Locality & Quick User Bar */}
      <View style={styles.headerBar}>
        <View style={styles.locationContainer}>
          <View style={styles.locationPinRow}>
            <Ionicons name="location-sharp" size={16} color={BrandColors.primary} />
            <Text style={styles.locationTitle}>Sunrise PG, Room 204</Text>
            <Ionicons name="chevron-down" size={14} color={BrandColors.textMuted} />
          </View>
          <Text style={styles.locationSub}>Sector 62, Noida • Verified Delivery Zone</Text>
        </View>

        <Pressable
          style={styles.avatarButton}
          onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="person-circle" size={32} color={BrandColors.primary} />
        </Pressable>
      </View>

      {/* Meal Slots Selector */}
      <View style={styles.slotRow}>
        {['lunch', 'dinner', 'breakfast'].map((slotKey) => {
          const isSelected = selectedSlot === slotKey;
          const label =
            slotKey === 'lunch'
              ? '☀️ Lunch (12:30 PM)'
              : slotKey === 'dinner'
              ? '🌙 Dinner (8:00 PM)'
              : '☕ Breakfast (8:30 AM)';
          return (
            <Pressable
              key={slotKey}
              style={[styles.slotChip, isSelected && styles.slotChipActive]}
              onPress={() => setSelectedSlot(slotKey)}>
              <Text style={[styles.slotChipText, isSelected && styles.slotChipTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
          <Text style={styles.loadingText}>Fetching today’s homestyle tiffins...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={44} color={BrandColors.danger} />
          <Text style={styles.errorTitle}>Unable to connect</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {/* Quality Guarantee Banner */}
          <View style={styles.trustBanner}>
            <View style={styles.trustIconWrap}>
              <Ionicons name="shield-checkmark" size={20} color="#047857" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustTitle}>100% Homestyle Quality Guaranteed</Text>
              <Text style={styles.trustDesc}>
                FSSAI certified kitchens • Prepared fresh with minimal oil & ghar ka swaad.
              </Text>
            </View>
          </View>

          {/* Kitchens & Menus List */}
          <Text style={styles.sectionHeading}>Today’s Available Tiffin Kitchens</Text>

          {kitchens.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="restaurant-outline" size={38} color={BrandColors.textMuted} />
              <Text style={styles.emptyTitle}>No Kitchens in this Slot</Text>
              <Text style={styles.emptySub}>
                Kitchens open orders 3 hours before delivery time.
              </Text>
            </View>
          ) : (
            kitchens.map((kitchen) => (
              <View key={kitchen.id} style={styles.kitchenCard}>
                {/* Kitchen Header */}
                <View style={styles.kitchenHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.kitchenName}>{kitchen.businessName}</Text>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#ffffff" />
                        <Text style={styles.ratingText}>{kitchen.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text style={styles.kitchenMeta}>
                      🚀 {kitchen.deliveryTimeMins} mins • Sector 62 • Pure North Indian
                    </Text>
                  </View>
                </View>

                {/* Kitchen Dishes */}
                <View style={styles.dishesList}>
                  {kitchen.menus.flatMap((menu) =>
                    menu.items.map((item) => {
                      const qty = getItemCartQuantity(item.id);
                      return (
                        <View key={item.id} style={styles.dishCard}>
                          <View style={styles.dishInfo}>
                            <View style={styles.dishHeaderRow}>
                              <View style={styles.vegIndicator}>
                                <View style={styles.vegDot} />
                              </View>
                              <Text style={styles.dishName}>{item.name}</Text>
                            </View>

                            <Text style={styles.dishPrice}>₹{item.pricePaise / 100}</Text>

                            {item.description ? (
                              <Text style={styles.dishDesc} numberOfLines={2}>
                                {item.description}
                              </Text>
                            ) : null}

                            {item.dailyCapacity ? (
                              <View style={styles.capacityBadge}>
                                <Text style={styles.capacityText}>
                                  🔥 {item.dailyCapacity} portions left today
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Add / Quantity Stepper */}
                          <View style={styles.dishAction}>
                            {qty === 0 ? (
                              <Pressable
                                style={styles.addButton}
                                onPress={() => addToCart(item, kitchen)}>
                                <Text style={styles.addButtonText}>ADD +</Text>
                              </Pressable>
                            ) : (
                              <View style={styles.stepperBox}>
                                <Pressable
                                  style={styles.stepperBtn}
                                  onPress={() => removeFromCart(item.id)}>
                                  <Text style={styles.stepperBtnText}>−</Text>
                                </Pressable>
                                <Text style={styles.stepperCount}>{qty}</Text>
                                <Pressable
                                  style={styles.stepperBtn}
                                  onPress={() => addToCart(item, kitchen)}>
                                  <Text style={styles.stepperBtnText}>+</Text>
                                </Pressable>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    }),
                  )}
                </View>
              </View>
            ))
          )}

          <View style={{ height: cartCount > 0 ? 100 : 40 }} />
        </ScrollView>
      )}

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <View style={styles.floatingCartWrap}>
          <Pressable
            style={styles.floatingCart}
            onPress={() => router.push('/cart')}>
            <View>
              <Text style={styles.floatingCartItems}>
                {cartCount} {cartCount === 1 ? 'Tiffin' : 'Tiffins'} • ₹{cartTotal / 100}
              </Text>
              <Text style={styles.floatingCartSub}>PG Room Delivery Included</Text>
            </View>
            <View style={styles.cartActionRow}>
              <Text style={styles.cartActionText}>View Cart</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </View>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  locationContainer: {
    flex: 1,
  },
  locationPinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.text,
  },
  locationSub: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 2,
  },
  avatarButton: {
    marginLeft: 12,
  },
  slotRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  slotChipActive: {
    backgroundColor: BrandColors.primaryLight,
    borderColor: BrandColors.primary,
  },
  slotChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textMuted,
  },
  slotChipTextActive: {
    color: BrandColors.primaryDark,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  trustIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
  },
  trustDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.text,
    marginBottom: 12,
  },
  kitchenCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kitchenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kitchenName: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  kitchenMeta: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 4,
  },
  dishesList: {
    paddingTop: 10,
    gap: 12,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  dishInfo: {
    flex: 1,
    paddingRight: 12,
  },
  dishHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  dishName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.text,
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.text,
    marginTop: 3,
  },
  dishDesc: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  capacityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  capacityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b45309',
  },
  dishAction: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  addButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: BrandColors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  addButtonText: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stepperBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  stepperCount: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: BrandColors.textMuted,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.text,
    marginTop: 10,
  },
  errorText: {
    fontSize: 13,
    color: BrandColors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.text,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  floatingCartWrap: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  floatingCart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  floatingCartItems: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  floatingCartSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  cartActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
