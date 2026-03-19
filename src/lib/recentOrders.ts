import { Order } from '../types';

const RECENT_ORDERS_KEY = 'harivanga_recent_orders';

export function saveRecentOrder(order: Order) {
  if (typeof window === 'undefined') return;

  const current = getRecentOrders();
  const nextOrders = [order, ...current.filter((entry) => entry.id !== order.id)].slice(0, 10);
  window.sessionStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(nextOrders));
}

export function getRecentOrders() {
  if (typeof window === 'undefined') return [] as Order[];

  const raw = window.sessionStorage.getItem(RECENT_ORDERS_KEY);
  if (!raw) return [] as Order[];

  try {
    return JSON.parse(raw) as Order[];
  } catch {
    return [] as Order[];
  }
}

export function getRecentOrderById(orderId: string) {
  return getRecentOrders().find((order) => order.id === orderId) ?? null;
}
