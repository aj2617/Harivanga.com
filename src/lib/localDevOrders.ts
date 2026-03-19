import { Order } from '../types';
import { isLocalDevHost } from './localDevProducts';

export const LOCAL_DEV_ORDERS_KEY = 'harivanga_local_orders';
export const LOCAL_DEV_ORDERS_UPDATED_EVENT = 'harivanga:local-orders-updated';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export function canUseLocalOrderFallback() {
  return isLocalDevHost() || !hasSupabaseConfig;
}

export function getLocalDevOrders() {
  if (typeof window === 'undefined') return [] as Order[];

  const raw = window.localStorage.getItem(LOCAL_DEV_ORDERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

export function saveLocalDevOrder(order: Order) {
  if (typeof window === 'undefined') return;
  const orders = getLocalDevOrders();
  const nextOrders = [order, ...orders.filter((existingOrder) => existingOrder.id !== order.id)];
  window.localStorage.setItem(LOCAL_DEV_ORDERS_KEY, JSON.stringify(nextOrders));
  window.dispatchEvent(new CustomEvent(LOCAL_DEV_ORDERS_UPDATED_EVENT));
}

export function getLocalDevOrderById(orderId: string) {
  return getLocalDevOrders().find((order) => order.id === orderId) ?? null;
}

export function setLocalDevOrders(orders: Order[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_DEV_ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent(LOCAL_DEV_ORDERS_UPDATED_EVENT));
}

export function findLocalDevOrdersByPhone(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '');

  return getLocalDevOrders()
    .filter((order) => {
      const orderPhoneNormalized = order.customerPhoneNormalized ?? order.customerPhone.replace(/\D/g, '');
      return normalizedPhone.length > 0 && orderPhoneNormalized === normalizedPhone;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
