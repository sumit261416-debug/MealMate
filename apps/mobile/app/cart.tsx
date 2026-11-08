import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/Colors';
import {
  addToCart,
  clearCart,
  CustomerAddress,
  CustomerService,
  getCart,
  getCartTotalPaise,
  removeFromCart,
  subscribeCart,
} from '@/lib/api';

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState(getCart());
  const [subtotalPaise, setSubtotalPaise] = useState(getCartTotalPaise());
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [mealSlot, setMealSlot] = useState<string>('lunch');
  const [notes, setNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [loadingAddr, setLoadingAddr] = useState(true);

  useEffect(() => {
    const unsub = subscribeCart(() => {
      setCartItems(getCart());
      setSubtotalPaise(getCartTotalPaise());
    });
    return unsub;
  }, []);

  useEffect(() => {
    CustomerService.getAddresses()
      .then((list) => {
        setAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAddr(false));
  }, []);

  const deliveryFeePaise = 2000; // ₹20
  const platformFeePaise = 500;  // ₹5
  const grandTotalPaise = subtotalPaise + deliveryFeePaise + platformFeePaise;

  async function handlePlaceOrder() {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add dishes to your cart first.');
      return;
    }
    if (!selectedAddressId) {
      Alert.alert('Delivery Address Required', 'Please select or add a PG address.');
      return;
    }

    setPlacingOrder(true);
    try {
      const partnerId = cartItems[0].kitchenId;
      const order = await CustomerService.placeOrder({
        partnerId,
        addressId: selectedAddressId,
        mealSlotId: mealSlot,
        notes: notes.trim() || undefined,
        items: cartItems.map((c) => ({
          menuItemId: c.item.id,
          quantity: c.quantity,
        })),
      });

      clearCart();
      Alert.alert(
        'Order Placed! 🍛',
        `Your order #${order.id.slice(-6).toUpperCase()} is confirmed. The kitchen is preparing your fresh meal.`,
        [
          {
            text: 'Track Order',
            onPress: () => {
              router.replace('/(tabs)/orders');
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert('Order Failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setPlacingOrder(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerBox}>
          <Ionicons name="cart-outline" size={56} color={BrandColors.textMuted} />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySub}>Add hot homestyle thalis from today's menu!</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.back()}>
            <Text style={styles.browseBtnText}>Browse Daily Tiffins</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Kitchen Header */}
        <View style={styles.kitchenHeader}>
          <Ionicons name="restaurant" size={18} color={BrandColors.primary} />
          <Text style={styles.kitchenName}>{cartItems[0].kitchenName}</Text>
        </View>

        {/* Cart Items List */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Items in Cart</Text>
          {cartItems.map((cartItem) => (
            <View key={cartItem.item.id} style={styles.itemRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.itemName}>{cartItem.item.name}</Text>
                <Text style={styles.itemPrice}>
                  ₹{(cartItem.item.pricePaise * cartItem.quantity) / 100}
                </Text>
              </View>

              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => removeFromCart(cartItem.item.id)}>
                  <Text style={styles.stepBtnText}>−</Text>
                </Pressable>
                <Text style={styles.stepCount}>{cartItem.quantity}</Text>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() =>
                    addToCart(cartItem.item, {
                      id: cartItem.kitchenId,
                      businessName: cartItem.kitchenName,
                    } as any)
                  }>
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Meal Slot Selection */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Delivery Slot</Text>
          <View style={styles.slotToggleRow}>
            <Pressable
              style={[
                styles.slotButton,
                mealSlot === 'lunch' && styles.slotButtonActive,
              ]}
              onPress={() => setMealSlot('lunch')}>
              <Text
                style={[
                  styles.slotButtonText,
                  mealSlot === 'lunch' && styles.slotButtonTextActive,
                ]}>
                ☀️ Lunch (12:30 - 2 PM)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.slotButton,
                mealSlot === 'dinner' && styles.slotButtonActive,
              ]}
              onPress={() => setMealSlot('dinner')}>
              <Text
                style={[
                  styles.slotButtonText,
                  mealSlot === 'dinner' && styles.slotButtonTextActive,
                ]}>
                🌙 Dinner (7:30 - 9 PM)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardHeading}>Delivery PG / Hostel</Text>
            <Pressable onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.changeText}>Manage</Text>
            </Pressable>
          </View>

          {loadingAddr ? (
            <ActivityIndicator size="small" color={BrandColors.primary} />
          ) : addresses.length === 0 ? (
            <Text style={styles.noAddrText}>
              No address found. Please add in Profile tab.
            </Text>
          ) : (
            addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <Pressable
                  key={addr.id}
                  style={[styles.addrSelectRow, isSelected && styles.addrSelectActive]}
                  onPress={() => setSelectedAddressId(addr.id)}>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={isSelected ? BrandColors.primary : BrandColors.textMuted}
                  />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.addrTitle}>
                      {addr.pgName || 'PG'} • Room {addr.roomFlat || '204'}
                    </Text>
                    <Text style={styles.addrSub} numberOfLines={1}>
                      {addr.line1}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Notes for Kitchen & Delivery */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Delivery Note</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Call upon reaching PG gate, extra spicy dal"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Bill Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Bill Breakdown</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{subtotalPaise / 100}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee (PG Doorstep)</Text>
            <Text style={styles.billValue}>₹{deliveryFeePaise / 100}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform & Food Packaging</Text>
            <Text style={styles.billValue}>₹{platformFeePaise / 100}</Text>
          </View>
          <View style={[styles.billRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotalPaise / 100}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <Pressable
          style={[styles.placeOrderBtn, placingOrder && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}>
          {placingOrder ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View style={styles.orderBtnContent}>
              <Text style={styles.orderBtnText}>Confirm Tiffin Order</Text>
              <Text style={styles.orderBtnPrice}>₹{grandTotalPaise / 100} ➔</Text>
            </View>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  kitchenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  kitchenName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065f46',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.text,
    marginBottom: 10,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.text,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textMuted,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stepBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  stepCount: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  slotToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  slotButtonActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#ecfdf5',
  },
  slotButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textMuted,
  },
  slotButtonTextActive: {
    color: BrandColors.primaryDark,
    fontWeight: '800',
  },
  addrSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  addrSelectActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#f0fdf4',
  },
  addrTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.text,
  },
  addrSub: {
    fontSize: 11,
    color: BrandColors.textMuted,
    marginTop: 2,
  },
  noAddrText: {
    fontSize: 12,
    color: BrandColors.textMuted,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: BrandColors.text,
    backgroundColor: '#f8fafc',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  billLabel: {
    fontSize: 13,
    color: BrandColors.textMuted,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.text,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 8,
    paddingTop: 10,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.text,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  placeOrderBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 10,
    shadowColor: BrandColors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orderBtnContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  orderBtnPrice: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.text,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: BrandColors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  browseBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 18,
  },
  browseBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
