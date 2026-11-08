import { Platform } from 'react-native';

export type RoleName = 'customer' | 'kitchen_partner' | 'admin';

export type MenuItem = {
  id: string;
  menuId: string;
  name: string;
  description: string | null;
  pricePaise: number;
  isVeg: boolean;
  allergens: string | null;
  dailyCapacity: number | null;
  isAvailable: boolean;
};

export type Menu = {
  id: string;
  partnerId: string;
  title: string;
  isPublished: boolean;
  items: MenuItem[];
};

export type ServiceArea = {
  id: string;
  name: string;
  code: string;
  description: string | null;
};

export type MealSlot = {
  id: string;
  code: 'breakfast' | 'lunch' | 'dinner';
  displayName: string;
  cutoffHour: number;
  cutoffMinute: number;
  cutoffPrevDay: boolean;
};

export type Kitchen = {
  id: string;
  businessName: string;
  contactPhone: string | null;
  serviceAreas: ServiceArea[];
  menus: Menu[];
  rating: number;
  deliveryTimeMins: number;
};

export type CustomerAddress = {
  id: string;
  userId: string;
  label: string | null;
  line1: string;
  line2: string | null;
  pgName: string | null;
  roomFlat: string | null;
  landmark: string | null;
  instructions: string | null;
  serviceAreaId: string | null;
  isDefault: boolean;
  serviceArea?: ServiceArea | null;
};

export type OrderItem = {
  id: string;
  orderId: string;
  nameSnapshot: string;
  pricePaiseSnapshot: number;
  quantity: number;
};

export type Order = {
  id: string;
  status:
    | 'placed'
    | 'accepted'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';
  subtotalPaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  totalPaise: number;
  deliveryDate: string;
  createdAt: string;
  items: OrderItem[];
  mealSlot?: MealSlot;
  address?: CustomerAddress;
  partner?: { id: string; businessName: string; contactPhone: string | null };
  deliveryTask?: { status: string; assigneeName: string | null };
};

export type Subscription = {
  id: string;
  partnerId: string;
  status: 'active' | 'pending_payment' | 'paused' | 'cancelled' | 'expired';
  mealsTotal: number;
  mealsRemaining: number;
  pricePaise: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
};

export type CartItem = {
  item: MenuItem;
  kitchenId: string;
  kitchenName: string;
  quantity: number;
};

// API Host Resolution
function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // If running on Android emulator, 10.0.2.2 points to host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/v1';
  }
  // iOS simulator or Web
  return 'http://localhost:4000/v1';
}

export const API_BASE_URL = getBaseUrl();

// Token Management
let currentToken: string | null = null;
let currentUser: { id: string; email: string | null; fullName: string | null } | null = null;

// Cart State (In-Memory with subscribers)
let cart: CartItem[] = [];
let cartListeners: (() => void)[] = [];

export function getCart(): CartItem[] {
  return [...cart];
}

export function subscribeCart(listener: () => void) {
  cartListeners.push(listener);
  return () => {
    cartListeners = cartListeners.filter((l) => l !== listener);
  };
}

function notifyCart() {
  cartListeners.forEach((l) => l());
}

export function addToCart(item: MenuItem, kitchen: Kitchen) {
  const existing = cart.find((c) => c.item.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    // If cart has items from another kitchen, clear cart (one kitchen per order for meal fresh delivery)
    if (cart.length > 0 && cart[0].kitchenId !== kitchen.id) {
      cart = [];
    }
    cart.push({
      item,
      kitchenId: kitchen.id,
      kitchenName: kitchen.businessName,
      quantity: 1,
    });
  }
  notifyCart();
}

export function removeFromCart(itemId: string) {
  const index = cart.findIndex((c) => c.item.id === itemId);
  if (index >= 0) {
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
    } else {
      cart.splice(index, 1);
    }
    notifyCart();
  }
}

export function clearCart() {
  cart = [];
  notifyCart();
}

export function getCartTotalPaise(): number {
  return cart.reduce((acc, c) => acc + c.item.pricePaise * c.quantity, 0);
}

export function getCartCount(): number {
  return cart.reduce((acc, c) => acc + c.quantity, 0);
}

// Authentication Helpers
export async function customerLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to login');
  }

  currentToken = data.accessToken;
  currentUser = data.user;
  return data;
}

export async function quickDemoLogin() {
  return customerLogin('customer.demo@mealmate.local', 'ChangeMe-Admin-2026!');
}

export function getAuthToken(): string | null {
  return currentToken;
}

export function getCurrentUser() {
  return currentUser;
}

export function logout() {
  currentToken = null;
  currentUser = null;
  clearCart();
}

// API Fetcher Helper
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// API Services
export const CustomerService = {
  getServiceAreas: () => apiFetch<ServiceArea[]>('/customer/service-areas'),
  getMealSlots: () => apiFetch<MealSlot[]>('/customer/meal-slots'),
  getKitchens: (serviceAreaId?: string) =>
    apiFetch<Kitchen[]>(
      serviceAreaId ? `/customer/kitchens?serviceAreaId=${serviceAreaId}` : '/customer/kitchens',
    ),
  getKitchenDetails: (id: string) => apiFetch<Kitchen>(`/customer/kitchens/${id}`),
  getAddresses: () => apiFetch<CustomerAddress[]>('/customer/addresses'),
  createAddress: (payload: {
    label?: string;
    pgName?: string;
    roomFlat?: string;
    line1: string;
    landmark?: string;
    instructions?: string;
    serviceAreaId: string;
    isDefault?: boolean;
  }) =>
    apiFetch<CustomerAddress>('/customer/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getOrders: () => apiFetch<Order[]>('/customer/orders'),
  getOrderDetails: (id: string) => apiFetch<Order>(`/customer/orders/${id}`),
  placeOrder: (payload: {
    partnerId: string;
    addressId: string;
    mealSlotId: string;
    deliveryDate?: string;
    notes?: string;
    items: { menuItemId: string; quantity: number }[];
  }) =>
    apiFetch<Order>('/customer/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSubscriptions: () => apiFetch<Subscription[]>('/customer/subscriptions'),
  createSubscription: (payload: {
    partnerId: string;
    addressId: string;
    mealSlotId: string;
    planType: 'weekly' | 'monthly';
    startDate: string;
  }) =>
    apiFetch<Subscription>('/customer/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
