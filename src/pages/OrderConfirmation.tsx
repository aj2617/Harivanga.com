import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatCurrency } from '../lib/format';
import { CheckCircle, Package, Truck, MessageCircle, ArrowRight, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrderLookup } from '../features/orders/hooks/useOrderLookup';

export const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams();
  const { user, isAdmin } = useAuth();
  const { order, loading } = useOrderLookup({ orderId, userId: user?.id ?? null, isAdmin });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mango-orange"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Link to="/" className="text-mango-orange font-bold">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="font-ui min-h-screen bg-gray-50 py-4 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="fade-up-enter overflow-hidden rounded-2xl bg-white shadow-md sm:rounded-3xl sm:shadow-xl">
          <div className="relative overflow-hidden bg-mango-orange px-4 py-6 text-center text-white sm:p-12">
            <div className="pointer-events-none absolute top-0 left-0 hidden h-full w-full opacity-10 sm:block">
              <Package size={200} className="absolute -top-10 -left-10 rotate-12" />
              <Truck size={150} className="absolute -bottom-10 -right-10 -rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md sm:mb-6 sm:h-20 sm:w-20">
                <CheckCircle size={26} className="text-white sm:hidden" />
                <CheckCircle size={40} className="hidden text-white sm:block" />
              </div>
              <h1 className="mb-1 text-xl font-black tracking-tight sm:mb-2 sm:text-4xl">Thank You!</h1>
              <p className="text-[13px] font-medium text-white/85 sm:text-base">Your order has been placed successfully.</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest backdrop-blur-md sm:mt-6 sm:px-4 sm:text-xs">
                Order ID: #{order.id.slice(-6).toUpperCase()}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-white/90 sm:hidden">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                  <Calendar size={13} />
                  {order.deliveryDate}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                  <Package size={13} />
                  {order.items.length} items
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                  <Truck size={13} />
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8 md:p-12">
            <div className="space-y-3 sm:space-y-4">
              <details className="group rounded-2xl border border-gray-100 bg-white shadow-sm" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-mango-dark sm:text-base">
                  <span className="inline-flex items-center gap-2">
                    <Truck size={18} className="text-mango-orange" />
                    Delivery Information
                  </span>
                  <span className="text-xs font-bold text-gray-500 group-open:hidden">Tap to view</span>
                </summary>
                <div className="px-4 pb-4 text-[13px] sm:text-sm">
                  <div className="flex gap-3">
                    <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400" />
                    <div className="min-w-0">
                      <p className="font-bold text-mango-dark">{order.customerName}</p>
                      <p className="mt-1 break-words text-gray-600">{order.deliveryAddress}</p>
                      <p className="mt-1 break-words text-gray-500">{order.deliveryArea}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Calendar size={16} className="shrink-0 text-gray-400" />
                    <p className="text-gray-600">
                      Scheduled for: <span className="font-bold text-mango-dark">{order.deliveryDate}</span>
                    </p>
                  </div>
                </div>
              </details>

              <details className="group rounded-2xl border border-gray-100 bg-white shadow-sm" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-mango-dark sm:text-base">
                  <span className="inline-flex items-center gap-2">
                    <Package size={18} className="text-mango-orange" />
                    Order Summary
                  </span>
                  <span className="whitespace-nowrap text-sm font-black text-mango-orange sm:text-base">
                    {formatCurrency(order.total)}
                  </span>
                </summary>
                <div className="px-4 pb-4">
                  <div className="space-y-2 text-[13px] sm:text-sm">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3">
                        <span className="min-w-0 break-words text-gray-600">
                          {item.quantity} x {item.productName} ({item.variant})
                        </span>
                        <span className="shrink-0 font-bold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="font-bold">Total</span>
                      <span className="text-base font-black text-mango-orange sm:text-lg">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </details>

              <details className="group rounded-2xl border border-gray-100 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-mango-dark sm:text-base">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle size={18} className="text-mango-orange" />
                    Payment Details
                  </span>
                  <span className="truncate text-xs font-bold text-gray-500">{order.paymentStatus}</span>
                </summary>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2 text-[13px] sm:gap-3 sm:text-sm">
                    <div className="rounded-xl bg-gray-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Method</p>
                      <p className="mt-1 font-bold text-mango-dark">{order.paymentMethod}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</p>
                      <p className="mt-1 font-bold text-mango-dark">{order.paymentStatus}</p>
                    </div>
                    {order.paymentMethod !== 'Cash on Delivery' && (
                      <>
                        <div className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sender</p>
                          <p className="mt-1 break-all font-bold text-mango-dark">{order.paymentSenderPhone || 'Not submitted'}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Trx ID</p>
                          <p className="mt-1 break-all font-bold text-mango-dark">{order.paymentTransactionId || 'Not submitted'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </details>
              {order.paymentMethod !== 'Cash on Delivery' && order.paymentStatus === 'Awaiting Verification' && (
                <div className="rounded-2xl border border-mango-yellow/20 bg-mango-yellow/5 px-4 py-3 text-[13px] font-medium leading-relaxed text-mango-dark sm:text-sm">
                  আপনার প্রদত্ত পেমেন্টের তথ্য যাচাই করা হচ্ছে। অল্প সময়ের মধ্যেই আপনার মোবাইল নম্বরে নিশ্চিতকরণ
                  (কনফারমেশন) এসএমএস পাঠানো হবে। অর্ডার করার জন্য ধন্যবাদ।
                </div>
              )}

              <details className="group rounded-2xl border border-mango-yellow/10 bg-mango-yellow/5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-mango-dark sm:text-base">
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle size={18} className="text-mango-yellow" />
                    Need help?
                  </span>
                  <span className="text-xs font-bold text-gray-500">WhatsApp</span>
                </summary>
                <div className="px-4 pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-mango-dark sm:text-base">Need help with your order?</p>
                      <p className="mt-1 text-[13px] text-gray-600 sm:text-sm">Our support team is available 24/7 on WhatsApp.</p>
                    </div>
                    <a
                      href={`https://wa.me/8801342262821?text=I have a question about my order #${order.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-[#25D366]/90 sm:text-sm"
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </details>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:flex sm:gap-4">
              <Link
                to="/account"
                className="rounded-xl bg-mango-dark px-3 py-3 text-center text-sm font-bold text-white transition-all hover:bg-mango-dark/90 sm:rounded-2xl sm:px-6 sm:py-4"
              >
                Track Order
              </Link>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 py-3 text-center text-sm font-bold text-mango-dark transition-all hover:bg-gray-200 sm:rounded-2xl sm:px-6 sm:py-4"
              >
                Shop More
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
