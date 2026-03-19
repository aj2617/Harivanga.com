import { useEffect, useState } from 'react';
import { MOCK_PRODUCTS } from '../data/mockData';
import {
  getLocalDevProducts,
  isLocalDevAdminMode,
  LOCAL_DEV_PRODUCTS_UPDATED_EVENT,
} from '../lib/localDevProducts';
import { STOREFRONT_PRODUCTS_CACHE_KEY, STOREFRONT_PRODUCTS_CHANGED_EVENT } from '../lib/storefrontSync';
import { mapProductRow, supabase } from '../supabase';
import { Product } from '../types';

const CACHE_TTL_MS = 5 * 60 * 1000;

let memoryCache: { products: Product[]; timestamp: number } | null = null;

function readCachedProducts() {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.products;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STOREFRONT_PRODUCTS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { products: Product[]; timestamp: number };
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(STOREFRONT_PRODUCTS_CACHE_KEY);
      return null;
    }

    memoryCache = parsed;
    return parsed.products;
  } catch {
    return null;
  }
}

function writeCachedProducts(products: Product[]) {
  const nextCache = { products, timestamp: Date.now() };
  memoryCache = nextCache;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(STOREFRONT_PRODUCTS_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    // Ignore cache write failures.
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => readCachedProducts() ?? []);
  const [loading, setLoading] = useState(() => readCachedProducts() == null);

  useEffect(() => {
    const win = typeof window !== 'undefined' ? window : null;
    const localDevMode = isLocalDevAdminMode();

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
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });

      if (error) {
        console.error('Failed to load storefront products', error);
        writeCachedProducts(MOCK_PRODUCTS);
        setProducts(MOCK_PRODUCTS);
        setLoading(false);
        return;
      }

      const nextProducts = (data ?? []).map(mapProductRow);
      writeCachedProducts(nextProducts);
      setProducts(nextProducts);
      setLoading(false);
    };

    const cachedProducts = readCachedProducts();
    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
      void loadProducts();
    } else {
      void loadProducts();
    }

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const handleStorefrontRefresh = () => {
      void loadProducts();
    };
    win?.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleStorefrontRefresh);
    const idleCallback =
      win && 'requestIdleCallback' in win
        ? win.requestIdleCallback(
            () => {
              if (cancelled) return;
              channel = supabase
                .channel('storefront-products')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                  void loadProducts();
                })
                .subscribe();
            },
            { timeout: 2000 }
          )
        : win?.setTimeout(() => {
            if (cancelled) return;
            channel = supabase
              .channel('storefront-products')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                void loadProducts();
              })
              .subscribe();
          }, 1200);

    return () => {
      cancelled = true;
      if (typeof idleCallback === 'number') {
        win?.clearTimeout(idleCallback);
      } else if (win && 'cancelIdleCallback' in win && idleCallback !== undefined) {
        win.cancelIdleCallback(idleCallback);
      }

      if (channel) {
        void supabase.removeChannel(channel);
      }
      win?.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleStorefrontRefresh);
    };
  }, []);

  return { products, loading };
}
