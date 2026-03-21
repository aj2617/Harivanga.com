import { Product } from '../types';
import { canUseDevelopmentFallbacks, isLocalDevelopmentHost } from './env';

export const LOCAL_DEV_ADMIN_KEY = 'harivanga_local_admin_access';
export const LOCAL_DEV_PRODUCTS_KEY = 'harivanga_local_products';
export const LOCAL_DEV_PRODUCTS_UPDATED_EVENT = 'harivanga:local-products-updated';

export function isLocalDevHost() {
  return isLocalDevelopmentHost();
}

export function isLocalDevAdminMode() {
  if (!canUseDevelopmentFallbacks() || typeof window === 'undefined') return false;
  return window.localStorage.getItem(LOCAL_DEV_ADMIN_KEY) === 'true';
}

export async function getMockProducts() {
  const module = await import('../data/mockData');
  return module.MOCK_PRODUCTS;
}

export async function getLocalDevProducts() {
  const fallbackProducts = await getMockProducts();
  if (typeof window === 'undefined') return fallbackProducts;

  const raw = window.localStorage.getItem(LOCAL_DEV_PRODUCTS_KEY);
  if (!raw) {
    window.localStorage.setItem(LOCAL_DEV_PRODUCTS_KEY, JSON.stringify(fallbackProducts));
    return fallbackProducts;
  }

  try {
    return JSON.parse(raw) as Product[];
  } catch {
    window.localStorage.setItem(LOCAL_DEV_PRODUCTS_KEY, JSON.stringify(fallbackProducts));
    return fallbackProducts;
  }
}

export function setLocalDevProducts(products: Product[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_DEV_PRODUCTS_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent(LOCAL_DEV_PRODUCTS_UPDATED_EVENT));
}
