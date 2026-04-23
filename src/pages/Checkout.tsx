import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mapOrderToRow, supabase } from '../supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { hasSupabaseConfig } from '../lib/env';
import { canUseLocalOrderFallback, saveLocalDevOrder } from '../lib/localDevOrders';
import { calculateDeliveryCharge, DELIVERY_RATE_PER_KG, getCartTotalWeightKg, type DeliveryMethod } from '../lib/delivery';
import { CheckCircle2, CreditCard, Truck, MapPin, Phone, User as UserIcon, Building2, LocateFixed } from 'lucide-react';
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
    if ('focus' in element) {
      (element as HTMLElement & { focus?: () => void }).focus?.();
    }
  };

  const deliveryAreaLabel = useMemo(
    () =>
      `${formData.division || 'Select division'} / ${formData.district || 'Select district'} / ${formData.deliveryMethod}`,
    [formData.division, formData.district, formData.deliveryMethod]
  );

  const orderSummaryCard = (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8 lg:sticky lg:top-24">
      <h3 className="mb-4 text-base font-bold sm:mb-6 sm:text-xl">Order Summary</h3>
      <div className="mb-4 max-h-56 space-y-2 overflow-y-auto pr-2 sm:mb-8 sm:max-h-60 sm:space-y-4">
        {cart.map((item) => (
          <div key={`${item.productId}-${item.variant}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-lg bg-gray-50 sm:h-10 sm:w-10">
                <img
                  src={getThumbnailImageSrc(item.image)}
                  alt={item.productName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-mango-dark sm:text-sm">{item.productName}</p>
                <p className="text-[10px] text-gray-400">
                  {item.quantity} x {item.variant}
                </p>
              </div>
            </div>
            <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-xl bg-gray-50 px-3 py-2.5 sm:mb-6 sm:rounded-2xl sm:px-4 sm:py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Delivery Destination</p>
        <p className="mt-2 text-sm font-bold text-mango-dark">{deliveryAreaLabel}</p>
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-4 sm:pt-6">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span className="font-bold text-mango-dark">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>
            {formData.deliveryMethod} ({totalWeightKg}kg)
          </span>
          <span className="font-bold text-mango-dark">{formatCurrency(deliveryCharge)}</span>
        </div>
        {isPaymentMethodSelected && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Advance payment</span>
            <span className="font-bold text-green-600">- {formatCurrency(advancePayment)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-4">
          <span className="text-base font-bold sm:text-lg">Total</span>
          <span className="text-xl font-black text-mango-orange sm:text-2xl">{formatCurrency(orderTotal)}</span>
        </div>
        {isPaymentMethodSelected && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-bold text-gray-500">Pay on delivery</span>
            <span className="text-lg font-black text-mango-dark">{formatCurrency(dueOnDelivery)}</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-orange-50 p-3.5 sm:mt-8 sm:p-4">
        <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-mango-orange" />
        <p className="text-[10px] font-medium leading-relaxed text-mango-orange">
          By placing this order, you agree to our terms of service and delivery policy.
        </p>
      </div>
    </div>
  );

  const handleDivisionChange = (division: string) => {
    if (!division) {
      setFormData((current) => ({
        ...current,
        division: '',
        district: '',
      }));
      return;
    }

    const nextDistrict = DISTRICTS_BY_DIVISION[division]?.[0] ?? '';
    setFormData((current) => ({
      ...current,
      division,
      district: nextDistrict,
    }));
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
    if (cart.length === 0) {
      navigate('/products');
      return;
    }

    const orderDate = new Date().toISOString().split('T')[0];

    if (!formData.name.trim()) {
      setSubmitError('Enter your full name.');
      scrollToField(nameInputRef.current);
      return;
    }

    if (!isValidBdPhone11(formData.phone)) {
      setSubmitError('Enter a valid 11-digit phone number (01XXXXXXXXX).');
      scrollToField(phoneInputRef.current);
      return;
    }

    if (!formData.division) {
      setSubmitError('Select your division.');
      scrollToField(divisionSelectRef.current);
      return;
    }

    if (!formData.district) {
      setSubmitError('Select your district.');
      scrollToField(districtSelectRef.current);
      return;
    }

    if (!formData.address.trim()) {
      setSubmitError('Enter your full delivery address.');
      scrollToField(addressTextareaRef.current);
      return;
    }

    if (!isPaymentMethodSelected) {
      setSubmitError('Select a payment method before placing the order.');
      scrollToField(paymentMethodSectionRef.current);
      return;
    }

    if (!isVerificationMethodSelected) {
      setSubmitError('Select which payment app you used before placing the order.');
      scrollToField(verificationMethodSectionRef.current);
      return;
    }

    if (!formData.paymentSenderPhone.trim()) {
      setSubmitError('Enter the sender phone number before placing the order.');
      scrollToField(senderPhoneInputRef.current);
      return;
    }

    if (!isValidBdPhone11(formData.paymentSenderPhone)) {
      setSubmitError('Enter a valid 11-digit sender phone number (01XXXXXXXXX).');
      scrollToField(senderPhoneInputRef.current);
      return;
    }

    if (!formData.paymentTransactionId.trim()) {
      setSubmitError('Enter the transaction ID before placing the order.');
      scrollToField(transactionIdInputRef.current);
      return;
    }

    setIsSubmitting(true);
    try {
      const orderBase = {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerPhoneNormalized: normalizePhoneNumber(formData.phone),
        deliveryAddress: formData.address,
        deliveryArea: deliveryAreaLabel,
        deliveryDivision: formData.division,
        deliveryDistrict: formData.district,
        deliveryMethod: formData.deliveryMethod,
        deliveryDate: orderDate,
        paymentMethod: formData.verificationMethod as OrderPaymentMethod,
        paymentStatus: 'Awaiting Verification' as const,
        paymentSenderPhone: formData.paymentSenderPhone.trim(),
        paymentTransactionId: formData.paymentTransactionId.trim(),
        paymentConfirmationAmount: MOBILE_PAYMENT_CONFIRMATION_AMOUNT,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          variant: item.variant,
          price: item.price,
        })),
        subtotal,
        deliveryCharge,
        total: subtotal + deliveryCharge,
        status: 'Pending' as const,
        createdAt: new Date().toISOString(),
      };

      const localFallbackOrderId = `local-order-${Date.now()}`;
      const localFallbackOrder = {
        id: localFallbackOrderId,
        userId: user?.id,
        ...orderBase,
      };

      if (canUseLocalOrderFallback()) {
        saveLocalDevOrder(localFallbackOrder);
        saveRecentOrder(localFallbackOrder);
        clearCart();
        navigate(`/order-confirmation/${localFallbackOrderId}`);
        return;
      }

      const orderRow = mapOrderToRow({
        userId: user?.id,
        ...orderBase,
      });

      let createdOrderId: string | null = null;

      if (user?.id) {
        const { data, error } = await supabase
          .from('orders')
          .insert(orderRow)
          .select('id')
          .single();

        if (error) {
          throw error;
        }

        createdOrderId = data.id;
      } else {
        const { data, error } = await supabase.rpc('create_public_order', {
          p_customer_name: orderRow.customer_name,
          p_customer_phone: orderRow.customer_phone,
          p_customer_phone_normalized: orderRow.customer_phone_normalized,
          p_delivery_address: orderRow.delivery_address,
          p_delivery_area: orderRow.delivery_area,
          p_delivery_division: orderRow.delivery_division,
          p_delivery_district: orderRow.delivery_district,
          p_delivery_location: orderRow.delivery_location,
          p_delivery_method: orderRow.delivery_method,
          p_delivery_date: orderRow.delivery_date,
          p_payment_method: orderRow.payment_method,
          p_payment_status: orderRow.payment_status,
          p_payment_sender_phone: orderRow.payment_sender_phone,
          p_payment_transaction_id: orderRow.payment_transaction_id,
          p_payment_confirmation_amount: orderRow.payment_confirmation_amount,
          p_items: orderRow.items,
          p_subtotal: orderRow.subtotal,
          p_delivery_charge: orderRow.delivery_charge,
          p_total: orderRow.total,
          p_status: orderRow.status,
          p_created_at: orderRow.created_at,
        });

        if (error || !data) {
          throw error ?? new Error('Could not create order.');
        }

        createdOrderId = data;
      }

      const savedOrder = {
        id: createdOrderId,
        userId: user?.id,
        ...orderBase,
      };

      if (hasSupabaseConfig && createdOrderId) {
        void (async () => {
          const { data, error } = await supabase.functions.invoke('order-notifications', {
            body: { orderId: createdOrderId },
          });
          if (error) {
            console.warn('Order notification failed', error);
            return;
          }

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
          id: localFallbackOrderId,
          userId: user?.id,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerPhoneNormalized: normalizePhoneNumber(formData.phone),
          deliveryAddress: formData.address,
          deliveryArea: deliveryAreaLabel,
          deliveryDivision: formData.division,
          deliveryDistrict: formData.district,
          deliveryMethod: formData.deliveryMethod,
          deliveryDate: orderDate,
          paymentMethod: formData.verificationMethod as OrderPaymentMethod,
          paymentStatus: 'Awaiting Verification' as const,
          paymentSenderPhone: formData.paymentSenderPhone.trim(),
          paymentTransactionId: formData.paymentTransactionId.trim(),
          paymentConfirmationAmount: MOBILE_PAYMENT_CONFIRMATION_AMOUNT,
          items: cart.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            variant: item.variant,
            price: item.price,
          })),
          subtotal,
          deliveryCharge,
          total: subtotal + deliveryCharge,
          status: 'Pending' as const,
          createdAt: new Date().toISOString(),
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

  return (
    <div className="font-ui min-h-screen bg-gray-50 py-4 text-[13px] sm:py-10 sm:text-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="fade-up-enter rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-lg font-black sm:mb-8 sm:text-2xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mango-orange/10 text-mango-orange sm:h-10 sm:w-10 sm:rounded-xl">
                  <Truck size={18} />
                </div>
                Delivery Details
              </h2>

              <form noValidate onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">
                      <UserIcon size={14} /> Full Name
                    </label>
                    <input
                      ref={nameInputRef}
                      required
                      type="text"
                      autoComplete="name"
                      enterKeyHint="next"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 transition-all focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/20 sm:rounded-2xl sm:px-4 sm:py-3"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">
                      <Phone size={14} /> Phone Number
                    </label>
                    <input
                      ref={phoneInputRef}
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      enterKeyHint="next"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: normalizeBdPhone11(e.target.value) })}
                      minLength={11}
                      maxLength={11}
                      pattern="01[0-9]{9}"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 transition-all focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/20 sm:rounded-2xl sm:px-4 sm:py-3"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 sm:rounded-3xl sm:p-6">
                  <div className="mb-3 flex items-center gap-3 sm:mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mango-orange/10 text-mango-orange sm:h-10 sm:w-10 sm:rounded-xl">
                      <LocateFixed size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-mango-dark sm:text-lg">Delivery Location</h3>
                      <p className="text-[11px] text-gray-500 sm:text-sm">
                        Select division and district before choosing delivery method.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">
                        <Building2 size={14} /> Division
                      </label>
                      <select
                        required
                        ref={divisionSelectRef}
                        value={formData.division}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 sm:rounded-2xl sm:px-4 sm:py-3"
                      >
                        <option value="" disabled>
                          Select division
                        </option>
                        {divisionOptions.map((division) => (
                          <option key={division} value={division}>
                            {division}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">
                        <MapPin size={14} /> District
                      </label>
                      <select
                        required
                        ref={districtSelectRef}
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        disabled={!formData.division}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 sm:rounded-2xl sm:px-4 sm:py-3"
                      >
                        <option value="" disabled>
                          Select district
                        </option>
                        {districtOptions.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 sm:mt-5">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">
                      <MapPin size={14} /> Full Delivery Address
                    </label>
                    <textarea
                      ref={addressTextareaRef}
                      required
                      rows={2}
                      autoComplete="street-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition-all focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/20 sm:rounded-2xl sm:px-4 sm:py-3"
                      placeholder="House, Road, Area, Landmark..."
                    />
                  </div>

                  <div className="mt-4 sm:mt-5">
                    <label className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:mb-3 sm:text-xs">
                      <Truck size={14} /> Delivery Method
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {(['Home Delivery', 'Courier Pickup'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setFormData({ ...formData, deliveryMethod: method })}
                          className={`min-w-0 rounded-xl border-2 px-3 py-2 text-left transition-all sm:rounded-2xl sm:px-4 sm:py-3 ${
                            formData.deliveryMethod === method
                              ? 'border-mango-orange bg-mango-orange/5 shadow-md'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12px] font-black leading-tight text-mango-dark sm:text-base">
                              {method}
                            </p>
                            <p className="shrink-0 text-[10px] font-bold leading-tight text-gray-500 sm:text-sm">
                              {formatCurrency(DELIVERY_RATE_PER_KG[method])}/kg
                            </p>
                          </div>
                          <p className="mt-1 hidden text-xs leading-snug text-gray-500 sm:block sm:text-sm">
                            {method === 'Home Delivery'
                              ? 'Delivered to the exact address selected above.'
                              : 'Pickup from courier point in the selected district.'}
                          </p>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] leading-snug text-gray-500 sm:hidden">
                      {formData.deliveryMethod === 'Home Delivery'
                        ? 'Delivered to the exact address selected above.'
                        : 'Pickup from courier point in the selected district.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">
                    Selected Delivery Route
                  </label>
                  <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] font-semibold text-mango-dark sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    {deliveryAreaLabel}
                  </div>
                </div>

                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => setIsOrderSummaryOpen((current) => !current)}
                    className="mt-2 flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-bold text-mango-dark shadow-sm"
                  >
                    <span className="text-sm">Order Summary</span>
                    <span className="text-sm text-mango-orange">
                      {isOrderSummaryOpen ? 'Hide' : 'View'} • {formatCurrency(orderTotal)}
                    </span>
                  </button>
                  {isOrderSummaryOpen && <div className="mt-3">{orderSummaryCard}</div>}
                </div>

                <div className="pt-4 sm:pt-8">
                  <div ref={paymentMethodSectionRef}>
                    <h3 className="mb-3 flex items-center gap-3 text-base font-bold sm:mb-6 sm:text-xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mango-orange/10 text-mango-orange sm:h-10 sm:w-10 sm:rounded-xl">
                      <CreditCard size={18} />
                    </div>
                    Payment Method
                  </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:gap-4">
                    {(['Cash on Delivery'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setSubmitError(null);
                          setFormData((current) => ({
                            ...current,
                            paymentMethod: method,
                            verificationMethod: '',
                            paymentSenderPhone: '',
                            paymentTransactionId: '',
                          }));
                          setCopyStatus('idle');
                        }}
                        className={`min-w-0 rounded-xl border-2 px-2 py-2 text-[12px] font-bold transition-all flex flex-col items-center justify-center gap-1 text-center sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:gap-1.5 ${
                          formData.paymentMethod === method
                            ? 'border-mango-orange bg-mango-orange/5 text-mango-orange shadow-md'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <Truck size={18} className="sm:h-5 sm:w-5" />
                        {method}
                      </button>
                    ))}
                  </div>
                  {!isPaymentMethodSelected && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                      Choose the payment method first. Then fill sender number and transaction ID to continue.
                    </div>
                  )}
                  {isPaymentMethodSelected && (
                    <div className="mt-4 rounded-xl border border-mango-orange/20 bg-mango-orange/5 p-4 sm:mt-5 sm:rounded-2xl sm:p-5">
                      <p className="text-sm font-black text-mango-dark sm:text-base">পেমেন্ট যাচাইকরণের তথ্য</p>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        আপনার অর্ডারটি নিশ্চিত করতে, অনুগ্রহ করে প্রথমে{' '}
                        <span className="font-bold text-mango-orange">{SEND_MONEY_NUMBER}</span> নম্বরে{' '}
                        <span className="font-bold text-mango-orange">{formatCurrency(MOBILE_PAYMENT_CONFIRMATION_AMOUNT)}</span> পাঠান। এরপর নিচে প্রেরকের ফোন নম্বর এবং ট্রানজ্যাকশন আইডি প্রদান করুন। এই তথ্যগুলো ছাড়া অর্ডারটি সম্পন্ন করা সম্ভব হবে না।
                      </p>
                      <div className="mt-4" ref={verificationMethodSectionRef}>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          আপনি কোন পেমেন্ট পদ্ধতি ব্যবহার করেছেন?
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-md">
                          {(['bKash', 'Nagad', 'Rocket'] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => {
                                setSubmitError(null);
                                setFormData((current) => ({ ...current, verificationMethod: method }));
                              }}
                              className={`flex min-w-0 items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[12px] font-bold transition-all sm:text-xs ${
                                formData.verificationMethod === method
                                  ? 'border-mango-orange bg-white text-mango-orange shadow-sm'
                                  : 'border-gray-200 bg-white text-gray-500 hover:border-mango-orange/40'
                              }`}
                            >
                              <CreditCard size={14} />
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>
                      {!isVerificationMethodSelected && (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                          Select `bKash`, `Nagad`, or `Rocket`.
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-sm sm:gap-3 sm:px-4 sm:py-3">
                        <p className="min-w-0 text-[11px] font-bold leading-tight text-mango-dark sm:text-sm">
                          <span className="whitespace-nowrap">{SEND_MONEY_NUMBER}</span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="whitespace-nowrap text-[10px] font-bold text-gray-600 sm:text-xs">
                            Confirm {formatCurrency(MOBILE_PAYMENT_CONFIRMATION_AMOUNT)}
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyPaymentNumber}
                          className="h-8 shrink-0 whitespace-nowrap rounded-lg bg-mango-orange px-3 text-[11px] font-black text-white transition-all hover:bg-mango-orange/90 sm:h-10 sm:text-xs"
                        >
                          {copyStatus === 'copied' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
                        <label className="min-w-0 space-y-1.5">
                          <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-xs">
                            Sender Phone
                          </span>
                          <input
                            ref={senderPhoneInputRef}
                            required={isPaymentMethodSelected}
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            enterKeyHint="next"
                            value={formData.paymentSenderPhone}
                            onChange={(e) =>
                              setFormData({ ...formData, paymentSenderPhone: normalizeBdPhone11(e.target.value) })
                            }
                            minLength={11}
                            maxLength={11}
                            pattern="01[0-9]{9}"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/20 sm:px-4 sm:py-3 sm:text-sm"
                            placeholder="01XXXXXXXXX"
                          />
                        </label>
                        <label className="min-w-0 space-y-1.5">
                          <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-xs">
                            Trx ID
                          </span>
                          <input
                            ref={transactionIdInputRef}
                            required={isPaymentMethodSelected}
                            type="text"
                            autoComplete="off"
                            autoCapitalize="characters"
                            enterKeyHint="done"
                            value={formData.paymentTransactionId}
                            onChange={(e) => setFormData({ ...formData, paymentTransactionId: e.target.value.toUpperCase() })}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] uppercase focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/20 sm:px-4 sm:py-3 sm:text-sm"
                            placeholder="Trx ID"
                          />
                        </label>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-gray-500">
                        Send exactly {formatCurrency(MOBILE_PAYMENT_CONFIRMATION_AMOUNT)}, then submit the sender number and transaction ID.
                        {copyStatus === 'failed' ? ' Copy failed on this device, so enter the number manually.' : ''}
                      </p>
                    </div>
                  )}
                  {isPaymentMethodSelected && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:mt-5 sm:rounded-2xl sm:p-5">
                      <p className="text-sm font-black text-mango-dark sm:text-base">ক্যাশ অন ডেলিভারি</p>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        আপনার দেওয়া পেমেন্ট তথ্য যাচাই হওয়ার পর, বাকি টাকাটি ডেলিভারির সময় সংগ্রহ করা হবে।
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-mango-orange py-3.5 text-base font-black text-white shadow-xl shadow-mango-orange/20 transition-all hover:bg-mango-orange/90 disabled:bg-gray-200 disabled:shadow-none sm:mt-12 sm:rounded-2xl sm:py-5 sm:text-lg"
                >
                  {isSubmitting ? 'Processing Order...' : `Place Order - ${formatCurrency(orderTotal)}`}
                </button>
                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    {submitError}
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-1">{orderSummaryCard}</div>
        </div>
      </div>
    </div>
  );
};
