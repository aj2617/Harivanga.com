import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, Truck, Tag, ChevronRight } from 'lucide-react';
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

  /* ── Empty State ── */
  if (cart.length === 0) {
    return (
      <div className="min-h-[80vh] bg-[#FAFAF8] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-200" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1a1200] mb-3">Your cart is empty</h2>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-8">
          You haven't added any mangoes yet. Head to the shop and pick your favourites!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-mango-orange text-white px-7 py-3.5 rounded-2xl text-sm font-black shadow-xl shadow-mango-orange/25 hover:bg-orange-600 transition-all"
        >
          Browse Mangoes <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-6 pb-32 sm:py-10 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-6 sm:mb-10">
          <div>
            <p className="text-mango-orange text-xs font-black uppercase tracking-[0.2em] mb-1">
              {totalItems} item{totalItems !== 1 ? 's' : ''} · {totalWeightKg} kg
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1a1200]">Your Cart</h1>
          </div>
          <Link
            to="/products"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-mango-orange transition-colors"
          >
            <ArrowRight size={14} className="rotate-180" /> Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Cart Items ── */}
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item, index) => (
              <div
                key={`${item.productId}-${item.variant}`}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 transition-all"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  {/* Product image */}
                  <Link to={`/product/${item.productId}`} className="shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-50">
                      <img
                        src={getThumbnailImageSrc(item.image)}
                        alt={item.productName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/product/${item.productId}`}>
                          <h3 className="font-black text-[#1a1200] text-sm sm:text-base truncate hover:text-mango-orange transition-colors">
                            {item.productName}
                          </h3>
                        </Link>
                        <span className="inline-block mt-1.5 bg-gray-100 text-gray-500 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {item.variant}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variant)}
                        aria-label={`Remove ${item.productName}`}
                        className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    {/* Quantity + Price row */}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      {/* Stepper */}
                      <div className="inline-flex items-center border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                          aria-label="Decrease"
                          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:bg-white hover:text-[#1a1200] transition-all"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="w-9 sm:w-10 text-center text-sm font-black text-[#1a1200]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                          aria-label="Increase"
                          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:bg-white hover:text-[#1a1200] transition-all"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400 font-medium">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                        <p className="text-base sm:text-lg font-black text-[#1a1200]">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue shopping — mobile */}
            <div className="pt-2 sm:hidden">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-mango-orange transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* ── Desktop Order Summary ── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 sticky top-24">
              {/* Dark header */}
              <div className="bg-gradient-to-br from-[#1a1200] to-[#2d2000] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-mango-orange/20 flex items-center justify-center">
                    <Tag size={17} className="text-mango-orange" />
                  </div>
                  <div>
                    <p className="text-white font-black text-base">Order Summary</p>
                    <p className="text-white/50 text-xs">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-6 space-y-4">
                {/* Line items */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="font-bold text-[#1a1200]">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Home Delivery est. ({totalWeightKg} kg)</span>
                    <span className="font-bold text-[#1a1200]">{formatCurrency(deliveryCharge)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-base font-black text-[#1a1200]">Total</span>
                  <span className="text-2xl font-black text-mango-orange">{formatCurrency(total)}</span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full flex items-center justify-center gap-2 bg-mango-orange text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-mango-orange/25 hover:bg-orange-600 transition-all mt-2"
                >
                  Proceed to Checkout <ArrowRight size={17} />
                </button>
                <Link
                  to="/products"
                  className="w-full block text-center text-sm font-bold text-gray-400 hover:text-[#1a1200] transition-colors py-2"
                >
                  Continue Shopping
                </Link>

                {/* Delivery note */}
                <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4">
                  <Truck size={15} className="text-mango-orange shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Delivery is calculated by weight. Home Delivery rate is shown here — you can switch to Courier Pickup at a lower rate during checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile Sticky Checkout Bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Est. Total</p>
              <p className="text-xl font-black text-[#1a1200]">{formatCurrency(total)}</p>
              <p className="text-[11px] text-gray-400">incl. home delivery</p>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="flex items-center gap-2 bg-mango-orange text-white px-6 py-3.5 rounded-2xl text-sm font-black shadow-xl shadow-mango-orange/25 hover:bg-orange-600 transition-all shrink-0"
            >
              Checkout <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
