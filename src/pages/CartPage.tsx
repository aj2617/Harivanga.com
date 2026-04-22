import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { calculateDeliveryCharge, getCartTotalWeightKg } from '../lib/delivery';
import { formatCurrency } from '../lib/format';
import { getThumbnailImageSrc } from '../lib/imageSources';

export const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();
  const navigate = useNavigate();
  const totalWeightKg = getCartTotalWeightKg(cart);
  const deliveryCharge = calculateDeliveryCharge(cart, 'Home Delivery');
  const total = subtotal + deliveryCharge;

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-xl font-black tracking-tight text-mango-dark sm:text-3xl mb-3">Your cart is empty</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          Looks like you haven't added any delicious mangoes to your cart yet.
        </p>
        <Link 
          to="/products" 
          className="bg-mango-orange text-white px-6 py-3 rounded-xl text-sm font-bold shadow-xl shadow-mango-orange/20 hover:bg-mango-orange/90 transition-all"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 pb-28 sm:py-10 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-mango-dark sm:text-3xl">Shopping cart</h1>
            <p className="mt-1 text-sm text-gray-500">
              {totalItems} item{totalItems === 1 ? '' : 's'} • Est. delivery based on {totalWeightKg}kg
            </p>
          </div>
          <Link
            to="/products"
            className="hidden shrink-0 text-sm font-bold text-gray-400 hover:text-mango-dark transition-colors sm:block"
          >
            Continue shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.variant}`}
                className="fade-up-enter bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100"
              >
                <div className="grid grid-cols-[72px_1fr] gap-4 sm:grid-cols-[96px_1fr] sm:gap-6">
                  <div className="h-[72px] w-[72px] rounded-xl overflow-hidden shrink-0 bg-gray-50 sm:h-24 sm:w-24 sm:rounded-2xl">
                    <img
                      src={getThumbnailImageSrc(item.image)}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-mango-dark text-sm sm:text-lg break-words">{item.productName}</h3>
                        <p className="mt-1 inline-flex rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          {item.variant}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variant)}
                        className="rounded-xl p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label={`Remove ${item.productName} from cart`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex items-center justify-between gap-2 rounded-xl bg-gray-50 p-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-black text-sm text-mango-dark">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:hidden">Item total</p>
                        <span className="font-black text-mango-dark">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-1 sm:pt-3 lg:hidden">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-sm font-bold text-mango-dark hover:text-mango-orange transition-colors"
              >
                <ArrowRight size={16} className="rotate-180" />
                Continue shopping
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold mb-8">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-mango-dark">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Home Delivery Estimate ({totalWeightKg}kg)</span>
                  <span className="font-bold text-mango-dark">{formatCurrency(deliveryCharge)}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-mango-orange">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-mango-orange text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-mango-orange/20 hover:bg-mango-orange/90 transition-all"
                >
                  Proceed to Checkout
                  <ArrowRight size={20} />
                </button>
                <Link 
                  to="/products" 
                  className="w-full block text-center py-4 text-sm font-bold text-gray-400 hover:text-mango-dark transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>

              <div className="mt-8 p-4 bg-green-50 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                  <ShoppingBag size={16} />
                </div>
                <p className="text-[10px] text-green-800 leading-relaxed">
                  Delivery is calculated by weight. Home Delivery is charged per kg here, and Courier Pickup pricing is applied at checkout if selected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</p>
            <p className="text-lg font-black text-mango-dark">{formatCurrency(total)}</p>
            <p className="text-[11px] text-gray-500">Includes est. home delivery</p>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="shrink-0 rounded-xl bg-mango-orange px-5 py-3 text-sm font-black text-white shadow-xl shadow-mango-orange/20 transition-all hover:bg-mango-orange/90"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};
