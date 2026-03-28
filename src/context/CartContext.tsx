import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  replaceCart: (items: CartItem[]) => void;
  removeFromCart: (productId: string, variant: string) => void;
  updateQuantity: (productId: string, variant: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

type CartActions = Pick<CartContextType, 'addToCart' | 'replaceCart' | 'removeFromCart' | 'updateQuantity' | 'clearCart'>;
type CartSummary = Pick<CartContextType, 'totalItems' | 'subtotal'>;

const CART_STORAGE_KEY = 'mango_cart';
const EMPTY_CART: CartItem[] = [];

const CartItemsContext = createContext<CartItem[] | undefined>(undefined);
const CartActionsContext = createContext<CartActions | undefined>(undefined);
const CartSummaryContext = createContext<CartSummary | undefined>(undefined);

function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return EMPTY_CART;
  }

  try {
    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) {
      return EMPTY_CART;
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.variant === item.variant);
      if (existing) {
        return prev.map(i => 
          i.productId === item.productId && i.variant === item.variant 
            ? { ...i, quantity: i.quantity + item.quantity } 
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const replaceCart = useCallback((items: CartItem[]) => setCart(items), []);

  const removeFromCart = useCallback((productId: string, variant: string) => {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.variant === variant)));
  }, []);

  const updateQuantity = useCallback((productId: string, variant: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCart(prev => prev.map(i => 
      i.productId === productId && i.variant === variant 
        ? { ...i, quantity } 
        : i
    ));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const actions = useMemo(
    () => ({ addToCart, replaceCart, removeFromCart, updateQuantity, clearCart }),
    [addToCart, replaceCart, removeFromCart, updateQuantity, clearCart]
  );
  const summary = useMemo(() => ({ totalItems, subtotal }), [totalItems, subtotal]);

  return (
    <CartActionsContext.Provider value={actions}>
      <CartItemsContext.Provider value={cart}>
        <CartSummaryContext.Provider value={summary}>
          {children}
        </CartSummaryContext.Provider>
      </CartItemsContext.Provider>
    </CartActionsContext.Provider>
  );
};

export const useCartItems = () => {
  const context = useContext(CartItemsContext);
  if (!context) throw new Error('useCartItems must be used within a CartProvider');
  return context;
};

export const useCartActions = () => {
  const context = useContext(CartActionsContext);
  if (!context) throw new Error('useCartActions must be used within a CartProvider');
  return context;
};

export const useCartSummary = () => {
  const context = useContext(CartSummaryContext);
  if (!context) throw new Error('useCartSummary must be used within a CartProvider');
  return context;
};

export const useCart = () => {
  const cart = useCartItems();
  const actions = useCartActions();
  const summary = useCartSummary();

  return useMemo(
    () => ({ cart, ...actions, ...summary }),
    [actions, cart, summary]
  );
};
