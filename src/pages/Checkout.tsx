import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mapOrderToRow, supabase } from '../supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { hasSupabaseConfig } from '../lib/env';
import { canUseLocalOrderFallback, saveLocalDevOrder } from '../lib/localDevOrders';
import { calculateDeliveryCharge, DELIVERY_RATE_PER_KG, getCartTotalWeightKg, type DeliveryMethod } from '../lib/delivery';
import {
  CheckCircle2, CreditCard, Truck, MapPin, Phone, User as UserIcon,
  Building2, LocateFixed, ChevronDown, ChevronUp, Copy, Check, ShieldCheck, Package,
} from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { getThumbnailImageSrc } from '../lib/imageSources';
import { saveRecentOrder } from '../lib/recentOrders';
import type { OrderPaymentMethod } from '../types';

const DISTRICTS_BY_DIVISION: Record<string, string[]> = {
  Barishal: ['Barguna', 'Barishal', 'Bhola', 'Jhalokathi', 'Patuakhali', 'Pirojpur'],
  Chattogram: ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', 'Cumilla', "Cox's Bazar", 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'],
  Dhaka: ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'],
  Khulna: ['Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'],
  Mymensingh: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
  Rajshahi: ['Bogura', 'Joypurhat', 'Naogaon', 'Natore', 'Chapai Nawabganj', 'Pabna', 'Rajshahi', 'Sirajganj'],
  Rangpur: ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'],
  Sylhet: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
};

type OrderCollectionMethod = 'Cash on Delivery';
type CheckoutOrderCollectionMethod = OrderCollectionMethod | '';
type PaymentChannel = Exclude<OrderPaymentMethod, 'Cash on Delivery'>;

const normalizePhoneNumber = (phone: string) => phone.replace(/\D/g, '');
const normalizeBdPhone11 = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('880')) {
    const rest = digits.slice(3);
    if (rest.startsWith('1')) return `0${rest}`.slice(0, 11);
    return rest.slice(0, 11);
  }
  if (digits.startsWith('1')) return `0${digits}`.slice(0, 11);
  return digits.slice(0, 11);
};
const isValidBdPhone11 = (value: string) => /^01\d{9}$/.test(normalizeBdPhone11(value));
const SEND_MONEY_NUMBER = '+8801342262821';
const MOBILE_PAYMENT_CONFIRMATION_AMOUNT = 120;

const inputClass =
  'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#1a1200] placeholder-gray-400 transition-all focus:border-mango-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-mango-orange/20';
const labelClass = 'flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2';

export const Checkout: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const divisionSelectRef = useRef<HTMLSelectElement | null>(null);
  const districtSelectRef = useRef<HTMLSelectElement | null>(null);
  const addressTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const paymentMethodSectionRef = useRef<HTMLDivElement | null>(null);
  const verificationMethodSectionRef = useRef<HTMLDivElement | null>(null);
  const senderPhoneInputRef = useRef<HTMLInputElement | null>(null);
  const transactionIdInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    address: profile?.savedAddresses[0] || '',
    division: '',
    district: '',
    deliveryMethod: 'Home Delivery' as DeliveryMethod,
    paymentMethod: '' as CheckoutOrderCollectionMethod,
    verificationMethod: '' as PaymentChannel | '',
    paymentSenderPhone: '',
    paymentTransactionId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFormData((current) => ({
      ...current,
      name: current.name || profile.name || '',
      phone: normalizeBdPhone11(current.phone || profile.phone || ''),
      address: current.address || profile.savedAddresses[0] || '',
      paymentSenderPhone: normalizeBdPhone11(current.paymentSenderPhone || profile.phone || ''),
    }));
  }, [profile]);

  const divisionOptions = Object.keys(DISTRICTS_BY_DIVISION);
  const districtOptions = formData.division ? DISTRICTS_BY_DIVISION[formData.division] ?? [] : [];
  const totalWeightKg = getCartTotalWeightKg(cart);
  const deliveryCharge = calculateDeliveryCharge(cart, formData.deliveryMethod);
  const isPaymentMethodSelected = formData.paymentMethod !== '';
  const isVerificationMethodSelected = formData.verificationMethod !== '';
  const orderTotal = subtotal + deliveryCharge;
  const advancePayment = isPaymentMethodSelected ? MOBILE_PAYMENT_CONFIRMATION_AMOUNT : 0;
  const dueOnDelivery = Math.max(orderTotal - advancePayment, 0);

  const scrollToField = (element: HTMLElement | null) => {
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if ('focus' in element) (element as HTMLElement & { focus?: () => void }).focus?.();
  };

  const deliveryAreaLabel = useMemo(
    () => `${formData.division || 'Select division'} / ${formData.district || 'Select district'} / ${formData.deliveryMethod}`,
    [formData.division, formData.district, formData.deliveryMethod]
  );

  const handleDivisionChange = (division: string) => {
    if (!division) { setFormData((c) => ({ ...c, division: '', district: '' })); return; }
    const nextDistrict = DISTRICTS_BY_DIVISION[division]?.[0] ?? '';
    setFormData((c) => ({ ...c, division, district: nextDistrict }));
  };

  const handleCopyPaymentNumber = async () => {
    try {
      await navigator.clipboard.writeText(SEND_MONEY_NUMBER);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (cart.length === 0) { navigate('/products'); return; }

    const orderDate = new Date().toISOString().split('T')[0];

    if (!formData.name.trim()) { setSubmitError('Enter your full name.'); scrollToField(nameInputRef.current); return; }
    if (!isValidBdPhone11(formData.phone)) { setSubmitError('Enter a valid 11-digit phone number (01XXXXXXXXX).'); scrollToField(phoneInputRef.current); return; }
    if (!formData.division) { setSubmitError('Select your division.'); scrollToField(divisionSelectRef.current); return; }
    if (!formData.district) { setSubmitError('Select your district.'); scrollToField(districtSelectRef.current); return; }
    if (!formData.address.trim()) { setSubmitError('Enter your full delivery address.'); scrollToField(addressTextareaRef.current); return; }
    if (!isPaymentMethodSelected) { setSubmitError('Select a payment method before placing the order.'); scrollToField(paymentMethodSectionRef.current); return; }
    if (!isVerificationMethodSelected) { setSubmitError('Select which payment app you used before placing the order.'); scrollToField(verificationMethodSectionRef.current); return; }
    if (!formData.paymentSenderPhone.trim()) { setSubmitError('Enter the sender phone number before placing the order.'); scrollToField(senderPhoneInputRef.current); return; }
    if (!isValidBdPhone11(formData.paymentSenderPhone)) { setSubmitError('Enter a valid 11-digit sender phone number (01XXXXXXXXX).'); scrollToField(senderPhoneInputRef.current); return; }
    if (!formData.paymentTransactionId.trim()) { setSubmitError('Enter the transaction ID before placing the order.'); scrollToField(transactionIdInputRef.current); return; }

    setIsSubmitting(true);
    try {
      const orderBase = {
        customerName: formData.name, customerPhone: formData.phone,
        customerPhoneNormalized: normalizePhoneNumber(formData.phone),
        deliveryAddress: formData.address, deliveryArea: deliveryAreaLabel,
        deliveryDivision: formData.division, deliveryDistrict: formData.district,
        deliveryMethod: formData.deliveryMethod, deliveryDate: orderDate,
        paymentMethod: formData.verificationMethod as OrderPaymentMethod,
        paymentStatus: 'Awaiting Verification' as const,
        paymentSenderPhone: formData.paymentSenderPhone.trim(),
        paymentTransactionId: formData.paymentTransactionId.trim(),
        paymentConfirmationAmount: MOBILE_PAYMENT_CONFIRMATION_AMOUNT,
        items: cart.map((item) => ({ productId: item.productId, productName: item.productName, quantity: item.quantity, variant: item.variant, price: item.price })),
        subtotal, deliveryCharge, total: subtotal + deliveryCharge,
        status: 'Pending' as const, createdAt: new Date().toISOString(),
      };

      const localFallbackOrderId = `local-order-${Date.now()}`;
      const localFallbackOrder = { id: localFallbackOrderId, userId: user?.id, ...orderBase };

      if (canUseLocalOrderFallback()) {
        saveLocalDevOrder(localFallbackOrder);
        saveRecentOrder(localFallbackOrder);
        clearCart();
        navigate(`/order-confirmation/${localFallbackOrderId}`);
        return;
      }

      const orderRow = mapOrderToRow({ userId: user?.id, ...orderBase });
      let createdOrderId: string | null = null;

      if (user?.id) {
        const { data, error } = await supabase.from('orders').insert(orderRow).select('id').single();
        if (error) throw error;
        createdOrderId = data.id;
      } else {
        const { data, error } = await supabase.rpc('create_public_order', {
          p_customer_name: orderRow.customer_name, p_customer_phone: orderRow.customer_phone,
          p_customer_phone_normalized: orderRow.customer_phone_normalized,
          p_delivery_address: orderRow.delivery_address, p_delivery_area: orderRow.delivery_area,
          p_delivery_division: orderRow.delivery_division, p_delivery_district: orderRow.delivery_district,
          p_delivery_location: orderRow.delivery_location, p_delivery_method: orderRow.delivery_method,
          p_delivery_date: orderRow.delivery_date, p_payment_method: orderRow.payment_method,
          p_payment_status: orderRow.payment_status, p_payment_sender_phone: orderRow.payment_sender_phone,
          p_payment_transaction_id: orderRow.payment_transaction_id,
          p_payment_confirmation_amount: orderRow.payment_confirmation_amount,
          p_items: orderRow.items, p_subtotal: orderRow.subtotal,
          p_delivery_charge: orderRow.delivery_charge, p_total: orderRow.total,
          p_status: orderRow.status, p_created_at: orderRow.created_at,
        });
        if (error || !data) throw error ?? new Error('Could not create order.');
        createdOrderId = data;
      }

      const savedOrder = { id: createdOrderId, userId: user?.id, ...orderBase };
      if (hasSupabaseConfig && createdOrderId) {
        void (async () => {
          const { data, error } = await supabase.functions.invoke('order-notifications', { body: { orderId: createdOrderId } });
          if (error) { console.warn('Order notification failed', error); return; }
          console.info('Order notification result', data);
        })();
      }

      clearCart();
      saveRecentOrder(savedOrder);
      navigate(`/order-confirmation/${createdOrderId}`);
    } catch (error) {
      if (canUseLocalOrderFallback()) {
        const localFallbackOrderId = `local-order-${Date.now()}`;
        const fallbackOrder = {
          id: localFallbackOrderId, userId: user?.id,
          customerName: formData.name, customerPhone: formData.phone,
          customerPhoneNormalized: normalizePhoneNumber(formData.phone),
          deliveryAddress: formData.address, deliveryArea: deliveryAreaLabel,
          deliveryDivision: formData.division, deliveryDistrict: formData.district,
          deliveryMethod: formData.deliveryMethod, deliveryDate: new Date().toISOString().split('T')[0],
          paymentMethod: formData.verificationMethod as OrderPaymentMethod,
          paymentStatus: 'Awaiting Verification' as const,
          paymentSenderPhone: formData.paymentSenderPhone.trim(),
          paymentTransactionId: formData.paymentTransactionId.trim(),
          paymentConfirmationAmount: MOBILE_PAYMENT_CONFIRMATION_AMOUNT,
          items: cart.map((item) => ({ productId: item.productId, productName: item.productName, quantity: item.quantity, variant: item.variant, price: item.price })),
          subtotal, deliveryCharge, total: subtotal + deliveryCharge,
          status: 'Pending' as const, createdAt: new Date().toISOString(),
        };
        saveLocalDevOrder(fallbackOrder);
        saveRecentOrder(fallbackOrder);
        clearCart();
        navigate(`/order-confirmation/${localFallbackOrderId}`);
        return;
      }
      console.error('Checkout failed', error);
      setSubmitError(
        hasSupabaseConfig
          ? 'Could not place the order right now. Please check your connection and try again.'
          : 'Store configuration is incomplete. Add the required Supabase environment variables before going live.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Order Summary Card ─── */
  const orderSummaryCard = (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden lg:sticky lg:top-24">
      <div className="bg-gradient-to-br from-[#1a1200] to-[#2d2000] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-mango-orange/20 flex items-center justify-center">
            <Package size={18} className="text-mango-orange" />
          </div>
          <div>
            <p className="text-white font-black text-base">Order Summary</p>
            <p className="text-white/50 text-xs">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 mb-5 max-h-52 overflow-y-auto pr-1">
          {cart.map((item) => (
            <div key={`${item.productId}-${item.variant}`} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img src={getThumbnailImageSrc(item.image)} alt={item.productName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#1a1200] truncate">{item.productName}</p>
                <p className="text-[11px] text-gray-400">{item.quantity} × {item.variant}</p>
              </div>
              <span className="text-[13px] font-black text-[#1a1200] shrink-0">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-gray-50 px-4 py-3 mb-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Delivery To</p>
          <p className="text-sm font-bold text-[#1a1200]">{deliveryAreaLabel}</p>
        </div>

        <div className="space-y-2.5 border-t border-gray-100 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-bold text-[#1a1200]">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{formData.deliveryMethod} ({totalWeightKg} kg)</span>
            <span className="font-bold text-[#1a1200]">{formatCurrency(deliveryCharge)}</span>
          </div>
          {isPaymentMethodSelected && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Advance paid</span>
              <span className="font-bold text-green-600">− {formatCurrency(advancePayment)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-base font-black text-[#1a1200]">Total</span>
            <span className="text-2xl font-black text-mango-orange">{formatCurrency(orderTotal)}</span>
          </div>
          {isPaymentMethodSelected && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Pay on delivery</span>
              <span className="text-lg font-black text-[#1a1200]">{formatCurrency(dueOnDelivery)}</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-orange-50 p-3.5">
          <ShieldCheck size={15} className="shrink-0 mt-0.5 text-mango-orange" />
          <p className="text-[11px] leading-relaxed text-mango-orange font-medium">
            By placing this order you agree to our delivery and payment policy.
          </p>
        </div>
      </div>
    </div>
  );

  /* ─── Step Header ─── */
  const steps = [
    { n: 1, label: 'Delivery', icon: Truck },
    { n: 2, label: 'Payment', icon: CreditCard },
    { n: 3, label: 'Confirm', icon: CheckCircle2 },
  ];
  const activeStep = !isPaymentMethodSelected ? 1 : !isVerificationMethodSelected ? 2 : 3;

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Progress Steps ── */}
        <div className="flex items-center justify-center gap-0 mb-8 sm:mb-12">
          {steps.map((step, i) => {
            const done = activeStep > step.n;
            const active = activeStep === step.n;
            const Icon = step.icon;
            return (
              <React.Fragment key={step.n}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                    done ? 'bg-green-500 text-white' : active ? 'bg-mango-orange text-white shadow-lg shadow-mango-orange/30' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {done ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold ${active ? 'text-mango-orange' : done ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 w-12 sm:w-20 mx-1 mb-4 rounded-full transition-all ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {/* ── Main Form ── */}
          <div className="lg:col-span-2 space-y-6">
            <form noValidate onSubmit={handleSubmit} className="space-y-6">

              {/* ── Section 1: Contact ── */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-mango-orange/10 text-mango-orange flex items-center justify-center">
                    <UserIcon size={17} />
                  </div>
                  <div>
                    <p className="font-black text-[#1a1200] text-base">Contact Information</p>
                    <p className="text-gray-400 text-xs">Who should we call for delivery?</p>
                  </div>
                </div>
                <div className="px-6 py-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}><UserIcon size={12} /> Full Name</label>
                    <input
                      ref={nameInputRef}
                      required type="text" autoComplete="name" enterKeyHint="next"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={inputClass} placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}><Phone size={12} /> Phone Number</label>
                    <input
                      ref={phoneInputRef}
                      required type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: normalizeBdPhone11(e.target.value) })}
                      minLength={11} maxLength={11} pattern="01[0-9]{9}"
                      className={inputClass} placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 2: Delivery Location ── */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <LocateFixed size={17} />
                  </div>
                  <div>
                    <p className="font-black text-[#1a1200] text-base">Delivery Location</p>
                    <p className="text-gray-400 text-xs">Where should we deliver your mangoes?</p>
                  </div>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}><Building2 size={12} /> Division</label>
                      <select
                        required ref={divisionSelectRef}
                        value={formData.division}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        className={inputClass + ' appearance-none cursor-pointer'}
                      >
                        <option value="" disabled>Select division</option>
                        {divisionOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}><MapPin size={12} /> District</label>
                      <select
                        required ref={districtSelectRef}
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        disabled={!formData.division}
                        className={inputClass + ' appearance-none cursor-pointer disabled:opacity-50'}
                      >
                        <option value="" disabled>Select district</option>
                        {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}><MapPin size={12} /> Full Delivery Address</label>
                    <textarea
                      ref={addressTextareaRef}
                      required rows={2} autoComplete="street-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={inputClass + ' resize-none'}
                      placeholder="House, Road, Area, Landmark…"
                    />
                  </div>

                  <div>
                    <label className={labelClass}><Truck size={12} /> Delivery Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['Home Delivery', 'Courier Pickup'] as const).map((method) => (
                        <button
                          key={method} type="button"
                          onClick={() => setFormData({ ...formData, deliveryMethod: method })}
                          className={`rounded-2xl border-2 p-4 text-left transition-all ${
                            formData.deliveryMethod === method
                              ? 'border-mango-orange bg-orange-50 shadow-md shadow-mango-orange/10'
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className={`text-sm font-black ${formData.deliveryMethod === method ? 'text-mango-orange' : 'text-[#1a1200]'}`}>
                              {method}
                            </span>
                            <span className="text-[11px] font-bold text-gray-400 shrink-0">
                              {formatCurrency(DELIVERY_RATE_PER_KG[method])}/kg
                            </span>
                          </div>
                          <p className="text-[11px] leading-snug text-gray-400">
                            {method === 'Home Delivery'
                              ? 'Delivered to your exact address.'
                              : 'Pick up from courier point in your district.'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(formData.division || formData.district) && (
                    <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center gap-2">
                      <MapPin size={14} className="text-mango-orange shrink-0" />
                      <span className="text-sm font-bold text-[#1a1200]">{deliveryAreaLabel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Mobile: Toggle Order Summary ── */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setIsOrderSummaryOpen((v) => !v)}
                  className="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 font-bold text-[#1a1200] shadow-sm"
                >
                  <span className="text-sm">View Order Summary</span>
                  <div className="flex items-center gap-2 text-mango-orange text-sm font-black">
                    {formatCurrency(orderTotal)}
                    {isOrderSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {isOrderSummaryOpen && <div className="mt-3">{orderSummaryCard}</div>}
              </div>

              {/* ── Section 3: Payment ── */}
              <div ref={paymentMethodSectionRef} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CreditCard size={17} />
                  </div>
                  <div>
                    <p className="font-black text-[#1a1200] text-base">Payment</p>
                    <p className="text-gray-400 text-xs">Choose how you'd like to pay</p>
                  </div>
                </div>
                <div className="px-6 py-5 space-y-5">
                  {/* Payment method toggle */}
                  <div className="grid grid-cols-1 gap-3">
                    {(['Cash on Delivery'] as const).map((method) => (
                      <button
                        key={method} type="button"
                        onClick={() => {
                          setSubmitError(null);
                          setFormData((c) => ({ ...c, paymentMethod: method, verificationMethod: '', paymentSenderPhone: '', paymentTransactionId: '' }));
                          setCopyStatus('idle');
                        }}
                        className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                          formData.paymentMethod === method
                            ? 'border-mango-orange bg-orange-50 shadow-md shadow-mango-orange/10'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.paymentMethod === method ? 'bg-mango-orange/10 text-mango-orange' : 'bg-gray-200 text-gray-500'}`}>
                          <Truck size={19} />
                        </div>
                        <div>
                          <p className={`font-black text-sm ${formData.paymentMethod === method ? 'text-mango-orange' : 'text-[#1a1200]'}`}>{method}</p>
                          <p className="text-[11px] text-gray-400">Send ৳120 advance to confirm, pay rest on delivery</p>
                        </div>
                        <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          formData.paymentMethod === method ? 'border-mango-orange bg-mango-orange' : 'border-gray-300'
                        }`}>
                          {formData.paymentMethod === method && <Check size={12} className="text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  {!isPaymentMethodSelected && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 font-medium">
                      Select a payment method to continue.
                    </div>
                  )}

                  {isPaymentMethodSelected && (
                    <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-5 space-y-4">
                      <div>
                        <p className="font-black text-[#1a1200] text-base">পেমেন্ট যাচাইকরণ</p>
                        <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                          অর্ডার নিশ্চিত করতে{' '}
                          <span className="font-black text-mango-orange">{SEND_MONEY_NUMBER}</span> নম্বরে{' '}
                          <span className="font-black text-mango-orange">{formatCurrency(MOBILE_PAYMENT_CONFIRMATION_AMOUNT)}</span> পাঠান,
                          তারপর নিচে সেন্ডার নম্বর ও ট্রানজ্যাকশন আইডি দিন।
                        </p>
                      </div>

                      {/* Copy number row */}
                      <div className="flex items-center justify-between gap-3 bg-white rounded-2xl px-4 py-3 border border-orange-100">
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Send To</p>
                          <p className="font-black text-[#1a1200] text-base">{SEND_MONEY_NUMBER}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyPaymentNumber}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                            copyStatus === 'copied' ? 'bg-green-500 text-white' : 'bg-mango-orange text-white hover:bg-orange-600'
                          }`}
                        >
                          {copyStatus === 'copied' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                        </button>
                      </div>

                      {/* App selector */}
                      <div ref={verificationMethodSectionRef}>
                        <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2.5">আপনি কোন অ্যাপ ব্যবহার করেছেন?</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(['bKash', 'Nagad', 'Rocket'] as const).map((method) => {
                            const colors: Record<string, string> = { bKash: '#E2136E', Nagad: '#F7941D', Rocket: '#8B1A89' };
                            const active = formData.verificationMethod === method;
                            return (
                              <button
                                key={method} type="button"
                                onClick={() => { setSubmitError(null); setFormData((c) => ({ ...c, verificationMethod: method })); }}
                                className={`rounded-2xl border-2 py-3 text-sm font-black transition-all ${
                                  active ? 'border-transparent text-white shadow-lg' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                }`}
                                style={active ? { backgroundColor: colors[method], borderColor: colors[method] } : {}}
                              >
                                {method}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sender phone + Trx ID */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Sender Phone</label>
                          <input
                            ref={senderPhoneInputRef}
                            required={isPaymentMethodSelected} type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next"
                            value={formData.paymentSenderPhone}
                            onChange={(e) => setFormData({ ...formData, paymentSenderPhone: normalizeBdPhone11(e.target.value) })}
                            minLength={11} maxLength={11} pattern="01[0-9]{9}"
                            className={inputClass} placeholder="01XXXXXXXXX"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Transaction ID</label>
                          <input
                            ref={transactionIdInputRef}
                            required={isPaymentMethodSelected} type="text" autoComplete="off" autoCapitalize="characters" enterKeyHint="done"
                            value={formData.paymentTransactionId}
                            onChange={(e) => setFormData({ ...formData, paymentTransactionId: e.target.value.toUpperCase() })}
                            className={inputClass + ' uppercase'} placeholder="Trx ID"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Send exactly {formatCurrency(MOBILE_PAYMENT_CONFIRMATION_AMOUNT)}, then submit the sender number and transaction ID above.
                        {copyStatus === 'failed' ? ' Copy failed — enter the number manually.' : ''}
                      </p>

                      {/* COD remainder note */}
                      <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3">
                        <p className="text-sm font-black text-[#1a1200] mb-1">ক্যাশ অন ডেলিভারি</p>
                        <p className="text-[12px] text-gray-500 leading-relaxed">
                          পেমেন্ট যাচাই হওয়ার পর বাকি{' '}
                          <span className="font-bold text-[#1a1200]">{formatCurrency(dueOnDelivery)}</span> ডেলিভারির সময় সংগ্রহ করা হবে।
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Submit ── */}
              {submitError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 font-medium">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-mango-orange py-5 text-lg font-black text-white shadow-xl shadow-mango-orange/25 transition-all hover:bg-orange-600 hover:shadow-2xl hover:shadow-mango-orange/30 disabled:bg-gray-200 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Processing…</>
                ) : (
                  <><CheckCircle2 size={22} /> Place Order · {formatCurrency(orderTotal)}</>
                )}
              </button>
            </form>
          </div>

          {/* ── Sticky Sidebar ── */}
          <div className="hidden lg:block lg:col-span-1">{orderSummaryCard}</div>
        </div>
      </div>
    </div>
  );
};
