import { Order } from '../types';
import { canUseDevelopmentFallbacks } from './env';

export const LOCAL_DEV_ORDERS_KEY = 'harivanga_local_orders';
export const LOCAL_DEV_ORDERS_UPDATED_EVENT = 'harivanga:local-orders-updated';

export function canUseLocalOrderFallback() {
  return canUseDevelopmentFallbacks();
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    paymentStatus: order.paymentStatus ?? (order.paymentMethod === 'Cash on Delivery' ? 'Not Required' : 'Awaiting Verification'),
    paymentConfirmationAmount: order.paymentConfirmationAmount ?? 0,
  };
}

export function getLocalDevOrders() {
  if (typeof window === 'undefined') return [] as Order[];

  const raw = window.localStorage.getItem(LOCAL_DEV_ORDERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return (JSON.parse(raw) as Order[]).map(normalizeOrder);
  } catch {
    return [];
  }
}

export function saveLocalDevOrder(order: Order) {
  if (typeof window === 'undefined') return;
  const orders = getLocalDevOrders();
  const nextOrders = [normalizeOrder(order), ...orders.filter((existingOrder) => existingOrder.id !== order.id)];
  window.localStorage.setItem(LOCAL_DEV_ORDERS_KEY, JSON.stringify(nextOrders));
  window.dispatchEvent(new CustomEvent(LOCAL_DEV_ORDERS_UPDATED_EVENT));
}

export function getLocalDevOrderById(orderId: string) {
  return getLocalDevOrders().find((order) => order.id === orderId) ?? null;
}

export function setLocalDevOrders(orders: Order[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_DEV_ORDERS_KEY, JSON.stringify(orders.map(normalizeOrder)));
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
