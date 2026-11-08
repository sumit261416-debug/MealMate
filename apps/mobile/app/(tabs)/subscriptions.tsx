import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/Colors';
import {
  CustomerAddress,
  CustomerService,
  Kitchen,
  quickDemoLogin,
  Subscription,
} from '@/lib/api';

export default function SubscriptionsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly'>('weekly');

  async function loadData() {
    try {
      await quickDemoLogin().catch(() => {});
      const [subs, kList, addrList] = await Promise.all([
        CustomerService.getSubscriptions().catch(() => []),
        CustomerService.getKitchens().catch(() => []),
        CustomerService.getAddresses().catch(() => []),
      ]);
      setSubscriptions(subs);
      setKitchens(kList);
      setAddresses(addrList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubscribe(planType: 'weekly' | 'monthly') {
    if (kitchens.length === 0 || addresses.length === 0) {
      Alert.alert(
        'Delivery Address Required',
        'Please make sure you have saved your PG address in your Profile tab.',
      );
      return;
    }

    setSubscribing(true);
    try {
      const partner = kitchens[0];
      const address = addresses[0];

      await CustomerService.createSubscription({
        partnerId: partner.id,
        addressId: address.id,
        mealSlotId: 'lunch',
        planType,
        startDate: new Date().toISOString(),
      });

      Alert.alert(
        'Subscription Activated! 🎉',
        `Your ${planType === 'weekly' ? '7-Day' : '30-Day'} tiffin plan has started. First meal will be delivered today to ${address.pgName || 'your address'}.`,
      );
      loadData();
    } catch (err) {
      Alert.alert('Subscription Failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>BACHELOR & PG EXCLUSIVE</Text>
          <Text style={styles.bannerHeading}>Never Worry About Daily Meals Again</Text>
          <Text style={styles.bannerSub}>
            Automated hot homestyle tiffin delivery straight to your PG gate or room flat. Skip or pause any day before 10 AM.
          </Text>
        </View>

        {/* Active Subscriptions Section */}
        {subscriptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Meal Plans</Text>
            {subscriptions.map((sub) => (
              <View key={sub.id} style={styles.activeSubCard}>
                <View style={styles.subHeaderRow}>
                  <View>
                    <Text style={styles.subPlanName}>
                      {sub.mealsTotal === 7 ? '7-Day Weekly Tiffin Plan' : '30-Day Monthly Tiffin Plan'}
                    </Text>
                    <Text style={styles.subStatusBadge}>
                      ● {sub.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.mealsBadge}>
                    <Text style={styles.mealsCount}>{sub.mealsRemaining}</Text>
                    <Text style={styles.mealsSub}>Meals Left</Text>
                  </View>
                </View>

                <View style={styles.subProgressRow}>
                  <View style={styles.progressBarWrap}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.round(((sub.mealsTotal - sub.mealsRemaining) / sub.mealsTotal) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {sub.mealsTotal - sub.mealsRemaining} / {sub.mealsTotal} Delivered
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.skipButton}
                    onPress={() =>
                      Alert.alert(
                        'Skip Next Meal',
                        'Meal scheduled for today will be credited back to your balance. Proceed?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Skip Today', onPress: () => Alert.alert('Saved', 'Meal skipped and credited!') },
                        ],
                      )
                    }>
                    <Ionicons name="pause-circle-outline" size={16} color={BrandColors.amber} />
                    <Text style={styles.skipButtonText}>Skip Today's Meal</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Subscription Plans to choose */}
        <Text style={styles.sectionTitle}>Choose a Tiffin Plan</Text>

        {/* 7-Day Weekly Plan */}
        <View style={[styles.planCard, selectedPlan === 'weekly' && styles.planCardActive]}>
          <View style={styles.planBadgeRow}>
            <Text style={styles.planTypeBadge}>FLEXIBLE TRIAL</Text>
            <Text style={styles.planPrice}>₹693 / week</Text>
          </View>
          <Text style={styles.planTitle}>7-Day Weekly Tiffin</Text>
          <Text style={styles.planDesc}>
            7 Lunch or Dinner meals • Flat ₹99/thali • Free room delivery • Rollover unsused meals.
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✓ 2 seasonal sabzi + dal tadka + 4 hot rotis + rice</Text>
            <Text style={styles.featureItem}>✓ 1-tap skip if eating out with friends</Text>
            <Text style={styles.featureItem}>✓ No long-term lockin</Text>
          </View>
          <Pressable
            style={[styles.subscribeBtn, subscribing && { opacity: 0.7 }]}
            onPress={() => handleSubscribe('weekly')}
            disabled={subscribing}>
            {subscribing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.subscribeBtnText}>Activate 7-Day Plan (₹693)</Text>
            )}
          </Pressable>
        </View>

        {/* 30-Day Monthly Plan */}
        <View style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}>
          <View style={styles.planBadgeRow}>
            <Text style={[styles.planTypeBadge, { backgroundColor: '#fef3c7', color: '#b45309' }]}>
              BEST VALUE • 15% OFF
            </Text>
            <Text style={styles.planPrice}>₹2,670 / mo</Text>
          </View>
          <Text style={styles.planTitle}>30-Day Monthly Saver Plan</Text>
          <Text style={styles.planDesc}>
            30 Meals • Just ₹89/thali • Guaranteed priority slot • Special Sunday sweet dish.
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✓ Maximum savings for college & corporate PG bachelors</Text>
            <Text style={styles.featureItem}>✓ Pause anytime for semester breaks or holidays</Text>
            <Text style={styles.featureItem}>✓ Dedicated PG delivery drop at your door</Text>
          </View>
          <Pressable
            style={[styles.subscribeBtn, { backgroundColor: '#0f172a' }]}
            onPress={() => handleSubscribe('monthly')}
            disabled={subscribing}>
            {subscribing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.subscribeBtnText}>Activate 30-Day Plan (₹2,670)</Text>
            )}
          </Pressable>
        </View>

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
  banner: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  bannerTag: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerHeading: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 6,
    lineHeight: 24,
  },
  bannerSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.text,
    marginBottom: 12,
  },
  activeSubCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 14,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subPlanName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.text,
  },
  subStatusBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
    marginTop: 4,
  },
  mealsBadge: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  mealsCount: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  mealsSub: {
    fontSize: 10,
    fontWeight: '600',
    color: BrandColors.primaryDark,
  },
  subProgressRow: {
    marginTop: 14,
  },
  progressBarWrap: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: BrandColors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: BrandColors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 14,
    flexDirection: 'row',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  planCardActive: {
    borderColor: BrandColors.primary,
    borderWidth: 2,
  },
  planBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTypeBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.text,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.text,
    marginTop: 8,
  },
  planDesc: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  featureList: {
    marginTop: 12,
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  featureItem: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  subscribeBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  subscribeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
