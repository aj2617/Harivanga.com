import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { DEMO_ORDER_STORAGE_KEY, DEMO_PROFILE, isLocalDemoMode } from '../data/mockData';
import { CheckCircle2, CreditCard, Truck, MapPin, Phone, User as UserIcon, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Order } from '../types';

export const Checkout: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const deliveryCharge = 60;
  const isDemoMode = isLocalDemoMode() && !user;
  
  const [formData, setFormData] = useState({
    name: profile?.name || DEMO_PROFILE.name,
    phone: profile?.phone || DEMO_PROFILE.phone,
    address: profile?.savedAddresses[0] || DEMO_PROFILE.savedAddresses[0] || '',
    area: 'Dhaka - Dhanmondi',
    deliveryDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash on Delivery' as 'bKash' | 'Nagad' | 'Cash on Delivery'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isDemoMode) {
      alert('Please login to place an order');
      navigate('/account');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isDemoMode) {
        const demoOrder: Order = {
          id: `demo-live-${Date.now()}`,
          userId: DEMO_PROFILE.uid,
          customerName: formData.name,
          customerPhone: formData.phone,
          deliveryAddress: formData.address,
          deliveryArea: formData.area,
          deliveryDate: formData.deliveryDate,
          paymentMethod: formData.paymentMethod,
          items: cart.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            variant: item.variant,
            price: item.price
          })),
          subtotal,
          deliveryCharge,
          total: subtotal + deliveryCharge,
          status: 'Pending',
          createdAt: new Date().toISOString()
        };
        localStorage.setItem(DEMO_ORDER_STORAGE_KEY, JSON.stringify(demoOrder));
        clearCart();
        navigate(`/order-confirmation/${demoOrder.id}`);
        return;
      }

      const orderData = {
        userId: user.uid,
        customerName: formData.name,
        customerPhone: formData.phone,
        deliveryAddress: formData.address,
        deliveryArea: formData.area,
        deliveryDate: formData.deliveryDate,
        paymentMethod: formData.paymentMethod,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          variant: item.variant,
          price: item.price
        })),
        subtotal,
        deliveryCharge,
        total: subtotal + deliveryCharge,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      navigate(`/order-confirmation/${docRef.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
            >
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-mango-orange/10 text-mango-orange rounded-xl flex items-center justify-center">
                  <Truck size={20} />
                </div>
                Delivery Details
              </h2>
              {isDemoMode && (
                <div className="mb-6 rounded-2xl border border-mango-orange/20 bg-mango-orange/5 px-4 py-3 text-sm text-mango-orange">
                  Local demo mode: placing an order here creates a browser-only sample order for UI testing.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <UserIcon size={14} /> Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <Phone size={14} /> Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <MapPin size={14} /> Full Delivery Address
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all resize-none"
                    placeholder="House, Road, Area, Landmark..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <MapPin size={14} /> Delivery Area
                    </label>
                    <select
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all"
                    >
                      <option>Dhaka - Dhanmondi</option>
                      <option>Dhaka - Gulshan</option>
                      <option>Dhaka - Banani</option>
                      <option>Dhaka - Uttara</option>
                      <option>Dhaka - Mirpur</option>
                      <option>Outside Dhaka</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <Calendar size={14} /> Preferred Delivery Date
                    </label>
                    <input
                      required
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all"
                    />
                  </div>
                </div>

                <div className="pt-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-mango-orange/10 text-mango-orange rounded-xl flex items-center justify-center">
                      <CreditCard size={20} />
                    </div>
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(['bKash', 'Nagad', 'Cash on Delivery'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: method })}
                        className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-2 ${
                          formData.paymentMethod === method
                            ? 'border-mango-orange bg-mango-orange/5 text-mango-orange shadow-md'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {method === 'Cash on Delivery' ? <Truck size={24} /> : <CreditCard size={24} />}
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full mt-12 bg-mango-orange text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-mango-orange/20 hover:bg-mango-orange/90 transition-all disabled:bg-gray-200 disabled:shadow-none"
                >
                  {isSubmitting ? 'Processing Order...' : `Place Order - ৳${subtotal + deliveryCharge}`}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.variant}`} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50">
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-mango-dark">{item.productName}</p>
                        <p className="text-[10px] text-gray-400">{item.quantity} x {item.variant}</p>
                      </div>
                    </div>
                    <span className="font-bold">৳{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-mango-dark">৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-mango-dark">৳{deliveryCharge}</span>
                </div>
                <div className="pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-mango-orange">৳{subtotal + deliveryCharge}</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-orange-50 rounded-2xl flex items-start gap-3">
                <CheckCircle2 size={16} className="text-mango-orange shrink-0 mt-0.5" />
                <p className="text-[10px] text-mango-orange font-medium leading-relaxed">
                  By placing this order, you agree to our terms of service and delivery policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
