export const STOREFRONT_PRODUCTS_CHANGED_EVENT = 'harivanga:storefront-products-changed';
export const STOREFRONT_PRODUCTS_CACHE_KEY = 'harivanga:storefront-products-cache';

export function notifyStorefrontProductsChanged() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(STOREFRONT_PRODUCTS_CACHE_KEY);
  window.dispatchEvent(new CustomEvent(STOREFRONT_PRODUCTS_CHANGED_EVENT));
}
