import { useEffect, useState } from 'react';
import {
  getLocalDevProducts,
  isLocalDevAdminMode,
  LOCAL_DEV_PRODUCTS_UPDATED_EVENT,
} from '../lib/localDevProducts';
import { fetchStorefrontProducts } from '../lib/publicProducts';
import { STOREFRONT_PRODUCTS_CACHE_KEY, STOREFRONT_PRODUCTS_CHANGED_EVENT } from '../lib/storefrontSync';
import { hasSupabaseConfig } from '../lib/env';
import { Product } from '../types';

const CACHE_TTL_MS = 5 * 60 * 1000;
const LEGACY_CACHE_KEY = STOREFRONT_PRODUCTS_CACHE_KEY;
const PERSISTENT_CACHE_KEY = `${STOREFRONT_PRODUCTS_CACHE_KEY}:persistent`;
const memoryCache = new Map<string, { products: Product[]; timestamp: number }>();

type UseProductsOptions = {
  search?: string;
  variety?: string;
};

function readStorageCache(key: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
    if (!raw) return null;

    return JSON.parse(raw) as { products: Product[]; timestamp: number };
  } catch {
    return null;
  }
}

function readCachedProducts() {
  const inMemory = memoryCache.get(PERSISTENT_CACHE_KEY);
  if (inMemory && Date.now() - inMemory.timestamp < CACHE_TTL_MS) {
    return inMemory.products;
  }

  const parsed = readStorageCache(PERSISTENT_CACHE_KEY) ?? readStorageCache(LEGACY_CACHE_KEY);
  if (!parsed) {
    return null;
  }

  const isFresh = Date.now() - parsed.timestamp < CACHE_TTL_MS;
  return isFresh ? parsed.products : null;
}

function writeCachedProducts(products: Product[]) {
  memoryCache.set(PERSISTENT_CACHE_KEY, { products, timestamp: Date.now() });

  if (typeof window === 'undefined') {
    return;
  }

  const nextCache = { products, timestamp: Date.now() };

  try {
    window.sessionStorage.setItem(STOREFRONT_PRODUCTS_CACHE_KEY, JSON.stringify(nextCache));
    window.localStorage.setItem(PERSISTENT_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    // Ignore cache write failures.
  }
}

function getCacheKey(search: string, variety: string) {
  return JSON.stringify(['storefront-products', search, variety]);
}

export function useProducts(options?: UseProductsOptions) {
  const localDevMode = isLocalDevAdminMode();
  const search = options?.search?.trim() ?? '';
  const variety = options?.variety?.trim() ?? '';
  const isDefaultQuery = search.length === 0 && variety.length === 0;
  const cacheKey = getCacheKey(search, variety);
  const [products, setProducts] = useState<Product[]>(() => {
    if (isDefaultQuery) {
      return readCachedProducts() ?? [];
    }

    return memoryCache.get(cacheKey)?.products ?? [];
  });
  const [loading, setLoading] = useState(localDevMode || hasSupabaseConfig);
  const [error, setError] = useState<string | null>(hasSupabaseConfig ? null : 'Store configuration is incomplete.');

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async (forceRefresh = false) => {
      if (!localDevMode && !hasSupabaseConfig) {
        setProducts([]);
        setLoading(false);
        setError('Store configuration is incomplete.');
        return;
      }

      if (localDevMode) {
        setProducts(await getLocalDevProducts());
        setLoading(false);
        setError(null);
        return;
      }

      const cachedEntry = !forceRefresh ? memoryCache.get(cacheKey) : null;
      if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
        setProducts(cachedEntry.products);
        setLoading(false);
        setError(null);
        return;
      }

      if (isDefaultQuery) {
        const storageCache = !forceRefresh ? readCachedProducts() : null;
        if (storageCache) {
          memoryCache.set(cacheKey, { products: storageCache, timestamp: Date.now() });
          setProducts(storageCache);
          setLoading(false);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const nextProducts = await fetchStorefrontProducts({ search, variety });

        if (cancelled) {
          return;
        }

        memoryCache.set(cacheKey, { products: nextProducts, timestamp: Date.now() });
        if (isDefaultQuery) {
          writeCachedProducts(nextProducts);
        }
        setProducts(nextProducts);
      } catch (fetchError) {
        console.error('Could not load storefront products.', fetchError);
        if (!cancelled) {
          setProducts([]);
          setError('Could not load the product catalog.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const handleRefresh = () => {
      memoryCache.delete(cacheKey);
      if (isDefaultQuery) {
        memoryCache.delete(PERSISTENT_CACHE_KEY);
      }
      void loadProducts(true);
    };

    if (localDevMode) {
      void loadProducts();
      window.addEventListener('storage', handleRefresh);
      window.addEventListener(LOCAL_DEV_PRODUCTS_UPDATED_EVENT, handleRefresh);
      window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);

      return () => {
        window.removeEventListener('storage', handleRefresh);
        window.removeEventListener(LOCAL_DEV_PRODUCTS_UPDATED_EVENT, handleRefresh);
        window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);
      };
    }

    void loadProducts();
    window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);
    };
  }, [cacheKey, isDefaultQuery, localDevMode, search, variety]);

  return {
    products,
    loading,
    error,
  };
}
