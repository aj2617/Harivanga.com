import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mapOrderRow, supabase } from '../supabase';
import { canUseLocalOrderFallback, findLocalDevOrdersByPhone } from '../lib/localDevOrders';
import { saveRecentOrder } from '../lib/recentOrders';
import { formatMediumDate } from '../lib/dates';
import { formatCurrency } from '../lib/format';
import { Order, PaymentStatus } from '../types';
import { Search, Package, Clock, CheckCircle2, Truck, Phone } from 'lucide-react';
import { hasSupabaseConfig } from '../lib/env';

const normalizePhoneNumber = (phone: string) => phone.replace(/\D/g, '');

const getPaymentStatusClasses = (paymentStatus: PaymentStatus) => {
  if (paymentStatus === 'Received') return 'bg-green-50 text-green-600';
  if (paymentStatus === 'Rejected') return 'bg-red-50 text-red-500';
  if (paymentStatus === 'Awaiting Verification') return 'bg-amber-50 text-amber-600';
  return 'bg-gray-50 text-gray-500';
};

export const Account: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const normalizedPhone = useMemo(() => normalizePhoneNumber(phone), [phone]);

  const loadOrdersByPhone = async () => {
    if (!normalizedPhone) {
      setSearchError('Enter the phone number used for the order.');
      return;
    }

    setSearchError(null);
    setHasSearched(true);
    setIsSearching(true);

    try {
      const localOrders = findLocalDevOrdersByPhone(phone);
      const orderMap = new Map<string, Order>();
      localOrders.forEach((order) => {
        orderMap.set(order.id, order);
      });

      if (!canUseLocalOrderFallback()) {
        const { data, error } = await supabase.rpc('track_orders_by_phone', { p_phone: normalizedPhone });

        if (error) {
          throw error;
        }

        (data ?? []).forEach((row) => {
          const order = mapOrderRow(row);
          orderMap.set(order.id, order);
        });
      }

      const nextOrders = Array.from(orderMap.values())
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 1);

      setOrders(nextOrders);
    } catch (error) {
      const fallbackOrders = findLocalDevOrdersByPhone(phone);
      if (fallbackOrders.length > 0) {
        setOrders(fallbackOrders.slice(0, 1));
        setSearchError(null);
      } else {
        setOrders([]);
        setSearchError(error instanceof Error ? error.message : 'Could not check order status right now. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadOrdersByPhone();
  };

  useEffect(() => {
    if (!hasSearched || !normalizedPhone) {
      return;
    }

    const refreshTimer = window.setInterval(() => {
      void loadOrdersByPhone();
    }, 15000);

    return () => window.clearInterval(refreshTimer);
  }, [hasSearched, normalizedPhone]);

  return (
    <div className="min-h-screen bg-gray-50 py-6 pb-24 sm:py-12">
      <div className="mx-auto max-w-lg px-4 sm:max-w-2xl sm:px-6 lg:px-8">
        <div className="fade-up-enter rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8">
          <div className="max-w-xl">
            <h1 className="text-xl font-black tracking-tight text-mango-dark sm:text-2xl">Track your order</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Enter the phone number used at checkout to view your latest order update.
            </p>
          </div>

          {!canUseLocalOrderFallback() && !hasSupabaseConfig && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium leading-relaxed text-red-600 sm:text-sm">
              Store configuration is incomplete. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable live phone tracking.
            </div>
          )}

          <form onSubmit={handleTrackOrders} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-2">
              <span className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <Phone size={14} /> Phone number
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              />
            </label>
            <button
              type="submit"
              disabled={isSearching}
              className="w-full rounded-xl bg-mango-orange px-6 py-3 text-sm font-bold text-white transition-all hover:bg-mango-orange/90 disabled:bg-gray-200 sm:w-auto"
            >
              {isSearching ? 'Checking...' : 'Check Status'}
            </button>
          </form>

          {searchError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600 sm:text-sm">
              {searchError}
            </div>
          )}

          {(orders.length > 0 || hasSearched) && (
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Latest order</p>

              {orders.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {orders.map((order) => {
                    const visibleItems = order.items.slice(0, 3);
                    const remainingCount = Math.max(0, order.items.length - visibleItems.length);

                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                              Order #{order.id.slice(-6).toUpperCase()}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Placed {formatMediumDate(new Date(order.createdAt))}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                                order.status === 'Delivered'
                                  ? 'bg-green-50 text-green-600'
                                  : order.status === 'Out for Delivery'
                                    ? 'bg-blue-50 text-blue-600'
                                    : order.status === 'Confirmed'
                                      ? 'bg-mango-yellow/10 text-mango-yellow'
                                      : 'bg-gray-50 text-gray-500'
                              }`}
                            >
                              {order.status === 'Delivered' ? (
                                <CheckCircle2 size={13} />
                              ) : order.status === 'Out for Delivery' ? (
                                <Truck size={13} />
                              ) : order.status === 'Confirmed' ? (
                                <CheckCircle2 size={13} />
                              ) : (
                                <Clock size={13} />
                              )}
                              {order.status}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ${getPaymentStatusClasses(order.paymentStatus)}`}
                            >
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {visibleItems.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-3 text-[13px] sm:text-sm">
                              <span className="min-w-0 break-words text-gray-600">
                                {item.quantity} x {item.productName}{' '}
                                <span className="text-[11px] text-gray-400 sm:text-xs">({item.variant})</span>
                              </span>
                              <span className="shrink-0 font-bold text-mango-dark">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <p className="text-xs font-semibold text-gray-400">+ {remainingCount} more item(s)</p>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</p>
                            <p className="text-base font-black text-mango-dark sm:text-lg">{formatCurrency(order.total)}</p>
                          </div>
                          <button
                            onClick={() => {
                              saveRecentOrder(order);
                              navigate(`/order-confirmation/${order.id}`);
                            }}
                            className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-mango-dark transition-all hover:bg-gray-200"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                    <Package size={22} />
                  </div>
                  <p className="text-sm font-bold text-mango-dark">No orders found</p>
                  <p className="mt-1 text-[13px] text-gray-500 sm:text-sm">
                    We could not find an order with that phone number.
                  </p>
                  <button
                    onClick={() => navigate('/products')}
                    className="mt-4 text-sm font-bold text-mango-orange hover:underline"
                  >
                    Continue shopping
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
