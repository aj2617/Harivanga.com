import { Order, Product, UserProfile } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'himsagar-01',
    name: 'Premium Himsagar',
    description: 'Known as the "King of Mangoes" in Bengal, Himsagar is famous for its sweet aroma and fiberless flesh.',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=800',
    pricePerKg: 120,
    stock: 500,
    variety: 'Himsagar',
    origin: 'Rajshahi',
    tasteProfile: 'Extremely sweet, aromatic, and creamy.',
    isAvailable: true,
    variants: [
      { weight: '1kg', price: 120 },
      { weight: '5kg Box', price: 550 },
      { weight: '10kg Box', price: 1050 }
    ]
  },
  {
    id: 'langra-01',
    name: 'Rajshahi Langra',
    description: 'Langra mangoes are known for their unique green skin even when ripe and their incredibly sweet, tangy flavor.',
    image: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
    pricePerKg: 100,
    stock: 300,
    variety: 'Langra',
    origin: 'Rajshahi',
    tasteProfile: 'Sweet with a hint of tanginess, very juicy.',
    isAvailable: true,
    variants: [
      { weight: '1kg', price: 100 },
      { weight: '5kg Box', price: 480 },
      { weight: '10kg Box', price: 900 }
    ]
  },
  {
    id: 'alphonso-01',
    name: 'Premium Alphonso',
    description: 'The global favorite, Alphonso is known for its rich, creamy texture and vibrant orange flesh.',
    image: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&q=80&w=800',
    pricePerKg: 250,
    stock: 100,
    variety: 'Alphonso',
    origin: 'Satkhira',
    tasteProfile: 'Rich, buttery, and intensely sweet.',
    isAvailable: true,
    variants: [
      { weight: '1kg', price: 250 },
      { weight: '2kg Gift Pack', price: 480 }
    ]
  },
  {
    id: 'amrapali-01',
    name: 'Sweet Amrapali',
    description: 'A hybrid variety that is exceptionally sweet and has a deep orange pulp.',
    image: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
    pricePerKg: 90,
    stock: 0,
    variety: 'Amrapali',
    origin: 'Chapainawabganj',
    tasteProfile: 'Very sweet, small seed, high pulp ratio.',
    isAvailable: false,
    variants: [
      { weight: '1kg', price: 90 },
      { weight: '5kg Box', price: 420 }
    ]
  }
];

export const DEMO_PROFILE: UserProfile = {
  uid: 'demo-user',
  name: 'Demo Customer',
  phone: '01700000000',
  email: 'demo@mangobd.local',
  role: 'customer',
  savedAddresses: ['House 12, Road 7, Dhanmondi, Dhaka']
};

export const DEMO_ORDERS: Order[] = [
  {
    id: 'demo-order-pending',
    userId: DEMO_PROFILE.uid,
    customerName: DEMO_PROFILE.name,
    customerPhone: DEMO_PROFILE.phone,
    deliveryAddress: DEMO_PROFILE.savedAddresses[0],
    deliveryArea: 'Dhaka - Dhanmondi',
    deliveryDate: '2026-03-18',
    paymentMethod: 'Cash on Delivery',
    items: [
      { productId: 'himsagar-01', productName: 'Premium Himsagar', quantity: 2, variant: '5kg Box', price: 550 },
      { productId: 'langra-01', productName: 'Rajshahi Langra', quantity: 1, variant: '1kg', price: 100 }
    ],
    subtotal: 1200,
    deliveryCharge: 60,
    total: 1260,
    status: 'Pending',
    createdAt: '2026-03-17T09:15:00.000Z'
  },
  {
    id: 'demo-order-confirmed',
    userId: DEMO_PROFILE.uid,
    customerName: DEMO_PROFILE.name,
    customerPhone: DEMO_PROFILE.phone,
    deliveryAddress: 'Flat 5B, House 22, Banani, Dhaka',
    deliveryArea: 'Dhaka - Banani',
    deliveryDate: '2026-03-17',
    paymentMethod: 'bKash',
    items: [
      { productId: 'alphonso-01', productName: 'Premium Alphonso', quantity: 1, variant: '2kg Gift Pack', price: 480 }
    ],
    subtotal: 480,
    deliveryCharge: 60,
    total: 540,
    status: 'Confirmed',
    createdAt: '2026-03-16T13:40:00.000Z'
  },
  {
    id: 'demo-order-delivery',
    userId: 'demo-user-2',
    customerName: 'Nusrat Jahan',
    customerPhone: '01811111111',
    deliveryAddress: 'Sector 7, Uttara, Dhaka',
    deliveryArea: 'Dhaka - Uttara',
    deliveryDate: '2026-03-17',
    paymentMethod: 'Nagad',
    items: [
      { productId: 'langra-01', productName: 'Rajshahi Langra', quantity: 2, variant: '5kg Box', price: 480 },
      { productId: 'amrapali-01', productName: 'Sweet Amrapali', quantity: 1, variant: '1kg', price: 90 }
    ],
    subtotal: 1050,
    deliveryCharge: 60,
    total: 1110,
    status: 'Out for Delivery',
    createdAt: '2026-03-15T08:10:00.000Z'
  },
  {
    id: 'demo-order-delivered',
    userId: 'demo-user-3',
    customerName: 'Rahim Ahmed',
    customerPhone: '01922222222',
    deliveryAddress: 'West Shewrapara, Mirpur, Dhaka',
    deliveryArea: 'Dhaka - Mirpur',
    deliveryDate: '2026-03-14',
    paymentMethod: 'Cash on Delivery',
    items: [
      { productId: 'himsagar-01', productName: 'Premium Himsagar', quantity: 1, variant: '10kg Box', price: 1050 }
    ],
    subtotal: 1050,
    deliveryCharge: 60,
    total: 1110,
    status: 'Delivered',
    createdAt: '2026-03-14T11:55:00.000Z'
  }
];

export const DEMO_ORDER_STORAGE_KEY = 'mangobd_demo_recent_order';

export function isLocalDemoMode() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}
