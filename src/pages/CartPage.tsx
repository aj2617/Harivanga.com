import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, Truck } from 'lucide-react';
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
      <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 border border-[#f3f4f6] bg-[#fafaf9] flex items-center justify-center mb-6">
          <ShoppingBag size={28} strokeWidth={1.5} className="text-gray-300" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium mb-2">Cart</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-[#111827] mb-3">Your cart is empty</h2>
        <p className="text-gray-500 text-sm font-light max-w-sm leading-relaxed mb-8">
          You haven't added any mangoes yet. Head to the shop and pick your favourites.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-[#111827] text-white px-6 py-3 text-sm font-semibold tracking-wide hover:bg-gray-800 transition-colors"
        >
          Browse Mangoes <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 pb-32 sm:py-10 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex items-end justify-between border-b border-[#f3f4f6] pb-6 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium mb-1">
              {totalItems} item{totalItems !== 1 ? 's' : ''} · {totalWeightKg} kg
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-[#111827]">Your Cart</h1>
          </div>
          <Link
            to="/products"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#111827] transition-colors"
          >
            <ArrowRight size={12} className="rotate-180" /> Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Cart Items ── */}
          <div className="lg:col-span-2 divide-y divide-[#f3f4f6] border-t border-b border-[#f3f4f6]">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.variant}`}
                className="py-5 sm:py-6"
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Product image */}
                  <Link to={`/product/${item.productId}`} className="shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden bg-[#fafaf9] border border-[#f3f4f6]">
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
                          <h3 className="font-semibold text-[#111827] text-sm sm:text-base truncate hover:text-[#f97316] transition-colors">
                            {item.productName}
                          </h3>
                        </Link>
                        <p className="mt-1 text-xs text-gray-500 font-light uppercase tracking-wider">
                          {item.variant}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variant)}
                        aria-label={`Remove ${item.productName}`}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>

                    {/* Quantity + Price row */}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      {/* Stepper */}
                      <div className="inline-flex items-center border border-gray-200 bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                          aria-label="Decrease"
                          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-[#fafaf9] hover:text-[#111827] transition-colors"
                        >
                          <Minus size={13} strokeWidth={1.75} />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold text-[#111827] border-l border-r border-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                          aria-label="Increase"
                          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-[#fafaf9] hover:text-[#111827] transition-colors"
                        >
                          <Plus size={13} strokeWidth={1.75} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400 font-light">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                        <p className="text-base sm:text-lg font-bold tracking-tight text-[#111827]">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue shopping — mobile */}
            <div className="py-5 sm:hidden">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#111827] transition-colors"
              >
                <ArrowRight size={12} className="rotate-180" /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* ── Desktop Order Summary ── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="border border-[#f3f4f6] bg-white sticky top-24">
              {/* Header */}
              <div className="border-b border-[#f3f4f6] px-6 py-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium">Summary</p>
                <p className="mt-1 text-xl font-bold tracking-tight text-[#111827]">Order Total</p>
                <p className="mt-0.5 text-xs text-gray-500 font-light">{totalItems} item{totalItems !== 1 ? 's' : ''} · {totalWeightKg} kg</p>
              </div>

              <div className="px-6 py-6 space-y-5">
                {/* Line items */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-light">Subtotal</span>
                    <span className="font-semibold text-[#111827]">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-light">Home delivery est.</span>
                    <span className="font-semibold text-[#111827]">{formatCurrency(deliveryCharge)}</span>
                  </div>
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-[#f3f4f6]">
                  <span className="text-sm font-semibold text-[#111827]">Total</span>
                  <span className="text-2xl font-bold tracking-tight text-[#111827]">{formatCurrency(total)}</span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full flex items-center justify-center gap-2 bg-[#111827] text-white py-3.5 text-sm font-semibold tracking-wide hover:bg-gray-800 transition-colors mt-1"
                >
                  Proceed to Checkout <ArrowRight size={14} strokeWidth={2} />
                </button>
                <Link
                  to="/products"
                  className="w-full block text-center text-xs font-medium text-gray-500 hover:text-[#111827] transition-colors"
                >
                  Continue Shopping
                </Link>

                {/* Delivery note */}
                <div className="flex items-start gap-3 border border-[#f3f4f6] bg-[#fafaf9] p-4">
                  <Truck size={14} strokeWidth={1.75} className="text-[#f97316] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-500 leading-relaxed font-light">
                    Delivery is calculated by weight. Home Delivery is shown here — switch to Courier Pickup at a lower rate during checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile Sticky Checkout Bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="bg-white/95 backdrop-blur-md border-t border-[#f3f4f6] px-4 py-3.5">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium">Est. Total</p>
              <p className="text-lg font-bold tracking-tight text-[#111827]">{formatCurrency(total)}</p>
              <p className="text-[11px] text-gray-500 font-light">incl. home delivery</p>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="flex items-center gap-2 bg-[#111827] text-white px-5 py-3 text-sm font-semibold tracking-wide hover:bg-gray-800 transition-colors shrink-0"
            >
              Checkout <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
