import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Product, Order, OrderStatus } from '../types';
import { DEMO_ORDERS, MOCK_PRODUCTS, isLocalDemoMode } from '../data/mockData';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, TrendingUp, 
  Plus, Edit2, Trash2, CheckCircle, Clock, Truck, 
  Search, Filter, MoreVertical, X, Save, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

export const AdminDashboard: React.FC = () => {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLocalDevBypass = isAdmin && !user && isLocalDemoMode();
  
  // Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    image: '',
    pricePerKg: 0,
    stock: 0,
    variety: 'Himsagar',
    origin: 'Rajshahi',
    tasteProfile: '',
    isAvailable: true,
    variants: [{ weight: '1kg', price: 0 }]
  });

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    if (isLocalDevBypass) {
      setProducts(MOCK_PRODUCTS);
      setOrders(DEMO_ORDERS);
      setLoading(false);
      setErrorMessage(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const productsUnsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      },
      (error) => {
        console.error('Failed to load products', error);
        setErrorMessage('Failed to load admin data. Check Firestore permissions and indexes.');
        setLoading(false);
      }
    );

    const ordersUnsubscribe = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load orders', error);
        setErrorMessage('Failed to load admin data. Check Firestore permissions and indexes.');
        setLoading(false);
      }
    );

    return () => {
      productsUnsubscribe();
      ordersUnsubscribe();
    };
  }, [isAdmin, isLocalDevBypass]);

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productForm);
      } else {
        await addDoc(collection(db, 'products'), productForm);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        image: '',
        pricePerKg: 0,
        stock: 0,
        variety: 'Himsagar',
        origin: 'Rajshahi',
        tasteProfile: '',
        isAvailable: true,
        variants: [{ weight: '1kg', price: 0 }]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'products');
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mango-orange"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Admin Data Error</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">{errorMessage}</p>
        <button onClick={() => window.location.reload()} className="text-mango-orange font-bold">Reload Page</button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-500 mb-8">You do not have permission to view this page.</p>
        <button onClick={() => window.location.href = '/'} className="text-mango-orange font-bold">Back to Home</button>
      </div>
    );
  }

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const activeTabLabel = activeTab === 'overview' ? 'Overview' : activeTab === 'products' ? 'Products' : 'Orders';

  const chartData = orders.slice(0, 7).reverse().map(o => ({
    date: format(new Date(o.createdAt), 'MMM dd'),
    revenue: o.total
  }));

  const statusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: '#94a3b8' },
    { name: 'Confirmed', value: orders.filter(o => o.status === 'Confirmed').length, color: '#f5a623' },
    { name: 'Out for Delivery', value: orders.filter(o => o.status === 'Out for Delivery').length, color: '#3b82f6' },
    { name: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-64 bg-mango-dark text-white hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-mango-orange rounded-full flex items-center justify-center text-white font-bold">M</div>
            <span className="text-xl font-bold tracking-tight">Mango<span className="text-mango-orange">BD</span></span>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-mango-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <LayoutDashboard size={20} /> Overview
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-mango-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Package size={20} /> Products
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-mango-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <ShoppingBag size={20} /> Orders
            </button>
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mango-orange rounded-full flex items-center justify-center font-bold">A</div>
            <div>
              <p className="text-sm font-bold">MangoBD Admin</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <div className="lg:hidden bg-mango-dark text-white px-4 py-5 sticky top-0 z-20 shadow-lg">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-bold">Admin</p>
              <h1 className="text-2xl font-black">{activeTabLabel}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/50">Today</p>
              <p className="text-sm font-semibold">{format(new Date(), 'MMM dd')}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-mango-orange text-white' : 'bg-white/5 text-white/70'}`}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-xs font-bold transition-all ${activeTab === 'products' ? 'bg-mango-orange text-white' : 'bg-white/5 text-white/70'}`}
            >
              <Package size={18} />
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-mango-orange text-white' : 'bg-white/5 text-white/70'}`}
            >
              <ShoppingBag size={18} />
              Orders
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-12">
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl sm:text-3xl font-black text-mango-dark">Dashboard Overview</h1>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                <button 
                  onClick={async () => {
                    const { MOCK_PRODUCTS } = await import('../data/mockData');
                    for (const p of MOCK_PRODUCTS) {
                      const { id, ...data } = p;
                      await addDoc(collection(db, 'products'), data);
                    }
                    alert('Database seeded with mock products!');
                  }}
                  className="text-xs font-bold text-mango-orange hover:underline"
                >
                  Seed Database
                </button>
                <div className="text-sm text-gray-400 font-medium">{format(new Date(), 'PPPP')}</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <ShoppingBag size={24} />
                </div>
                <p className="text-sm text-gray-400 font-medium mb-1">Total Orders Today</p>
                <h3 className="text-3xl font-black">{todayOrders.length}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                  <Clock size={24} />
                </div>
                <p className="text-sm text-gray-400 font-medium mb-1">Pending Orders</p>
                <h3 className="text-3xl font-black">{pendingOrders}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp size={24} />
                </div>
                <p className="text-sm text-gray-400 font-medium mb-1">Revenue Today</p>
                <h3 className="text-3xl font-black">৳{todayRevenue}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp size={24} />
                </div>
                <p className="text-sm text-gray-400 font-medium mb-1">Total Revenue</p>
                <h3 className="text-3xl font-black">৳{totalRevenue}</h3>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 sm:mb-8">Revenue Trend</h3>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#ff6b35', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#ff6b35" strokeWidth={4} dot={{ r: 6, fill: '#ff6b35', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 sm:mb-8">Order Status Distribution</h3>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
                  {statusData.map(s => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-500">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl sm:text-3xl font-black text-mango-dark">Product Management</h1>
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: '',
                    description: '',
                    image: '',
                    pricePerKg: 0,
                    stock: 0,
                    variety: 'Himsagar',
                    origin: 'Rajshahi',
                    tasteProfile: '',
                    isAvailable: true,
                    variants: [{ weight: '1kg', price: 0 }]
                  });
                  setIsProductModalOpen(true);
                }}
                className="w-full sm:w-auto bg-mango-orange text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-mango-orange/20"
              >
                <Plus size={20} /> Add New Product
              </button>
            </div>

            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Variety</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Price</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Stock</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-bold text-mango-dark">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm text-gray-500">{product.variety}</td>
                      <td className="px-8 py-4 font-bold">৳{product.pricePerKg}</td>
                      <td className="px-8 py-4 text-sm">{product.stock} kg</td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.isAvailable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {product.isAvailable ? 'In Season' : 'Out of Season'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingProduct(product);
                              setProductForm(product);
                              setIsProductModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-mango-orange transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-mango-dark truncate">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.variety}</p>
                        </div>
                        <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.isAvailable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {product.isAvailable ? 'In Season' : 'Out'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Price</p>
                          <p className="font-bold">à§³{product.pricePerKg}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Stock</p>
                          <p className="font-bold">{product.stock} kg</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setProductForm(product);
                            setIsProductModalOpen(true);
                          }}
                          className="flex-1 rounded-2xl bg-mango-orange/10 px-4 py-3 text-sm font-bold text-mango-orange"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl sm:text-3xl font-black text-mango-dark">Order Management</h1>
                <div className="flex gap-3">
                  <button className="sm:hidden p-3 bg-white rounded-2xl border border-gray-200 text-gray-400 hover:text-mango-orange transition-all">
                    <Filter size={20} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" placeholder="Search orders..." className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                </div>
                <button className="hidden sm:inline-flex p-3 bg-white rounded-2xl border border-gray-200 text-gray-400 hover:text-mango-orange transition-all">
                  <Filter size={20} />
                </button>
              </div>
            </div>

            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Items</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <span className="text-xs font-bold text-gray-400">#{order.id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-mango-dark">{order.customerName}</span>
                          <span className="text-xs text-gray-400">{order.customerPhone}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                              {item.productName[0]}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-4 font-bold">৳{order.total}</td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                          order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'Confirmed' ? 'bg-mango-yellow/10 text-mango-yellow' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="text-xs font-bold bg-gray-50 border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-mango-orange/20 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order ID</p>
                      <p className="font-bold text-mango-dark">#{order.id.slice(-6).toUpperCase()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                      order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-600' :
                      order.status === 'Confirmed' ? 'bg-mango-yellow/10 text-mango-yellow' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="font-bold text-mango-dark">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{order.customerPhone}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Items</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
                          {item.quantity}x {item.productName}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total</p>
                      <p className="text-lg font-black text-mango-dark">à§³{order.total}</p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="max-w-[170px] rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-mango-orange/20"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-mango-dark/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh]"
            >
              <div className="p-5 sm:p-8 border-b border-gray-100 flex justify-between items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-black">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-5 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Product Name</label>
                    <input 
                      required
                      type="text" 
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Variety</label>
                    <select 
                      value={productForm.variety}
                      onChange={(e) => setProductForm({ ...productForm, variety: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                    >
                      <option>Himsagar</option>
                      <option>Langra</option>
                      <option>Alphonso</option>
                      <option>Amrapali</option>
                      <option>Fazli</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
                  <textarea 
                    required
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Price (৳/kg)</label>
                    <input 
                      required
                      type="number" 
                      value={productForm.pricePerKg}
                      onChange={(e) => setProductForm({ ...productForm, pricePerKg: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Stock (kg)</label>
                    <input 
                      required
                      type="number" 
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Origin</label>
                    <input 
                      required
                      type="text" 
                      value={productForm.origin}
                      onChange={(e) => setProductForm({ ...productForm, origin: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Image URL</label>
                  <div className="flex gap-4">
                    <div className="flex-grow relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        type="url" 
                        value={productForm.image}
                        onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20" 
                        placeholder="https://..."
                      />
                    </div>
                    {productForm.image && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200">
                        <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="isAvailable"
                    checked={productForm.isAvailable}
                    onChange={(e) => setProductForm({ ...productForm, isAvailable: e.target.checked })}
                    className="w-5 h-5 rounded text-mango-orange focus:ring-mango-orange"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-bold text-mango-dark">Product is currently in season</label>
                </div>

                <div className="pt-6 border-t border-gray-100 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-grow py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-grow bg-mango-orange text-white py-4 rounded-2xl font-bold shadow-xl shadow-mango-orange/20 hover:bg-mango-orange/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={20} /> {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
