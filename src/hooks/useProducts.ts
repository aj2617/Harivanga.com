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

let memoryCache: { products: Product[]; timestamp: number } | null = null;
let inflightProductsPromise: Promise<Product[]> | null = null;

function readStorageCache(key: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { products: Product[]; timestamp: number };
    return parsed;
  } catch {
    return null;
  }
}

function readCachedProducts(options?: { allowStale?: boolean }) {
  const allowStale = options?.allowStale ?? false;

  if (memoryCache) {
    const isFresh = Date.now() - memoryCache.timestamp < CACHE_TTL_MS;
    if (isFresh || allowStale) {
      return memoryCache.products;
    }
  }

  const parsed = readStorageCache(PERSISTENT_CACHE_KEY) ?? readStorageCache(LEGACY_CACHE_KEY);
  if (!parsed) {
    return null;
  }

  memoryCache = parsed;
  const isFresh = Date.now() - parsed.timestamp < CACHE_TTL_MS;
  if (!isFresh && !allowStale) {
    return null;
  }

  return parsed.products;
}

function writeCachedProducts(products: Product[]) {
  const nextCache = { products, timestamp: Date.now() };
  memoryCache = nextCache;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(STOREFRONT_PRODUCTS_CACHE_KEY, JSON.stringify(nextCache));
    window.localStorage.setItem(PERSISTENT_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    // Ignore cache write failures.
  }
}

async function loadProductsOnce(signal?: AbortSignal) {
  if (!inflightProductsPromise) {
    inflightProductsPromise = fetchStorefrontProducts(signal).finally(() => {
      inflightProductsPromise = null;
    });
  }

  return inflightProductsPromise;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => readCachedProducts({ allowStale: true }) ?? []);
  const [loading, setLoading] = useState(() => readCachedProducts({ allowStale: true }) == null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const win = typeof window !== 'undefined' ? window : null;
    const localDevMode = isLocalDevAdminMode();
    const abortController = new AbortController();

    const refreshLocalProducts = () => {
      const nextProducts = getLocalDevProducts();
      writeCachedProducts(nextProducts);
      setProducts(nextProducts);
      setLoading(false);
    };

    if (localDevMode) {
      refreshLocalProducts();
      window.addEventListener('storage', refreshLocalProducts);
      window.addEventListener(LOCAL_DEV_PRODUCTS_UPDATED_EVENT, refreshLocalProducts);
      window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refreshLocalProducts);

      return () => {
        window.removeEventListener('storage', refreshLocalProducts);
        window.removeEventListener(LOCAL_DEV_PRODUCTS_UPDATED_EVENT, refreshLocalProducts);
        window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refreshLocalProducts);
      };
    }

    const loadProducts = async () => {
      try {
        const nextProducts = await loadProductsOnce(abortController.signal);
        writeCachedProducts(nextProducts);
        setError(null);
        setProducts(nextProducts);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error('Failed to load storefront products', error);
        setError('Could not load the product catalog.');
        setProducts([]);
      }
      setLoading(false);
    };

    if (!hasSupabaseConfig) {
      setProducts([]);
      setError('Store configuration is incomplete.');
      setLoading(false);
      return;
    }

    const cachedProducts = readCachedProducts({ allowStale: true });
    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
      void loadProducts();
    } else {
      void loadProducts();
    }

    const handleStorefrontRefresh = () => {
      void loadProducts();
    };
    win?.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleStorefrontRefresh);

    return () => {
      abortController.abort();
      win?.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleStorefrontRefresh);
    };
  }, []);

  return { products, loading, error };
}
