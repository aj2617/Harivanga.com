export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  pricePerKg: number;
  stock: number;
  variety: string;
  origin: string;
  tasteProfile: string;
  isAvailable: boolean;
  variants: ProductVariant[];
}

export interface ProductVariant {
  weight: string;
  price: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  variant: string;
  price: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Out for Delivery' | 'Delivered';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryArea: string;
  deliveryDate: string;
  paymentMethod: 'bKash' | 'Nagad' | 'Cash on Delivery';
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  userId: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  role: 'admin' | 'customer';
  savedAddresses: string[];
}

export interface CartItem extends OrderItem {
  image: string;
}
