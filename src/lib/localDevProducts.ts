import { MOCK_PRODUCTS } from '../data/mockData';
import { Product } from '../types';

export const LOCAL_DEV_ADMIN_KEY = 'harivanga_local_admin_access';
export const LOCAL_DEV_PRODUCTS_KEY = 'harivanga_local_products';
export const LOCAL_DEV_PRODUCTS_UPDATED_EVENT = 'harivanga:local-products-updated';

export function isLocalDevHost() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

export function isLocalDevAdminMode() {
  if (!isLocalDevHost() || typeof window === 'undefined') return false;
  return window.localStorage.getItem(LOCAL_DEV_ADMIN_KEY) === 'true';
}

export function getLocalDevProducts() {
  if (typeof window === 'undefined') return MOCK_PRODUCTS;

  const raw = window.localStorage.getItem(LOCAL_DEV_PRODUCTS_KEY);
  if (!raw) {
    window.localStorage.setItem(LOCAL_DEV_PRODUCTS_KEY, JSON.stringify(MOCK_PRODUCTS));
    return MOCK_PRODUCTS;
  }

  try {
    return JSON.parse(raw) as Product[];
  } catch {
    window.localStorage.setItem(LOCAL_DEV_PRODUCTS_KEY, JSON.stringify(MOCK_PRODUCTS));
    return MOCK_PRODUCTS;
  }
}

export function setLocalDevProducts(products: Product[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_DEV_PRODUCTS_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent(LOCAL_DEV_PRODUCTS_UPDATED_EVENT));
}
