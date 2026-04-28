import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleDatabaseError, mapOrderRow, mapProductRow, mapProductToRow, OperationType, ORDER_SELECT, supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Product, Order, OrderStatus, PaymentStatus } from '../types';
import { getLocalDevProducts, getMockProducts, isLocalDevAdminMode, isLocalDevHost, LOCAL_DEV_ADMIN_KEY, setLocalDevProducts } from '../lib/localDevProducts';
import { getLocalDevOrders, LOCAL_DEV_ORDERS_UPDATED_EVENT, setLocalDevOrders } from '../lib/localDevOrders';
import { notifyStorefrontProductsChanged } from '../lib/storefrontSync';
import { optimizeProductUpload } from '../lib/imageOptimization';
import { getThumbnailImageSrc } from '../lib/imageSources';
import { ADMIN_SETTINGS_KEY, LEGACY_ADMIN_SETTINGS_KEY, notifyAdminSettingsChanged } from '../lib/adminSettings';
import type { PromoStoryInput, CustomerReviewInput } from '../features/admin/components/AdminSettingsPanel';
import { BrandLogo } from '../components/BrandLogo';
import { formatLongDate, formatOrderTimestamp, formatShortMonthDay } from '../lib/dates';
import { 
  LayoutDashboard, Package, ShoppingBag, TrendingUp, 
  Plus, Edit2, Trash2,
  Search, Settings as SettingsIcon, House, Lock, LogOut, Eye, EyeOff,
  Bell, X, CheckCheck, ArrowRight
} from 'lucide-react';
import { canUseDevelopmentFallbacks, hasSupabaseConfig } from '../lib/env';

const AdminProductModal = lazy(() =>
  import('../features/admin/components/AdminProductModal').then((module) => ({ default: module.AdminProductModal }))
);
const AdminSettingsPanel = lazy(() =>
  import('../features/admin/components/AdminSettingsPanel').then((module) => ({ default: module.AdminSettingsPanel }))
);
const AdminChangePasswordPanel = lazy(() =>
  import('../features/admin/components/AdminChangePasswordPanel').then((module) => ({ default: module.AdminChangePasswordPanel }))
);

const LOCAL_DEV_ADMIN_EMAIL = 'admin@local';
const LOCAL_DEV_ADMIN_PASSWORD = 'admin1234';
type AdminTab = 'overview' | 'products' | 'orders' | 'settings';
type OrderNotification = {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  createdAt: string;
  seen: boolean;
};
type DeliveryZoneSetting = { id: string; name: string; charge: number };
type AdminUserSetting = { id: string; name: string; email: string; role: 'Admin' | 'Manager' | 'Staff' };
type LegacyPromoSettings = {
  promoTitle?: string;
  promoVideoUrl?: string;
  promoDescription?: string;
};

type AdminSettings = {
  storeName: string;
  logoUrl: string;
  website: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  deliveryZoneEntries: DeliveryZoneSetting[];
  deliveryZones: string;
  deliveryCharges: string;
  estimatedDeliveryTime: string;
  minimumOrderAmount: number;
  codEnabled: boolean;
  paymentMethods: string;
  cashPaymentEnabled: boolean;
  mobilePaymentEnabled: boolean;
  cardPaymentEnabled: boolean;
  mobilePaymentSettings: string;
  bankSettings: string;
  lowStockThreshold: number;
  stockAlertEnabled: boolean;
  autoDisableLowStockItems: boolean;
  trackInventory: boolean;
  outOfStockBehavior: 'Hide products' | 'Mark out of stock' | 'Allow backorders';
  defaultOrderStatus: OrderStatus;
  cancellationWindowMinutes: number;
  allowCustomerCancellation: boolean;
  autoConfirmOrders: boolean;
  cancellationRules: string;
  returnRefundNotes: string;
  adminUserEntries: AdminUserSetting[];
  adminUsers: string;
  rolesPermissions: string;
  emailAlertsEnabled: boolean;
  smsAlertsEnabled: boolean;
  emailNewOrderEnabled: boolean;
  emailOrderStatusEnabled: boolean;
  emailLowStockEnabled: boolean;
  smsUrgentOrdersEnabled: boolean;
  smsDailySummaryEnabled: boolean;
  seasonalAvailabilityControl: boolean;
  storeOpen: boolean;
  showOutOfSeasonProducts: boolean;
  autoToggleSeasonalProducts: boolean;
  storeOpensAt: string;
  storeClosesAt: string;
  promoStories: PromoStoryInput[];
};

const createPromoStory = (overrides: Partial<PromoStoryInput> = {}): PromoStoryInput => ({
  id: overrides.id ?? `story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: overrides.title ?? '',
  videoUrl: overrides.videoUrl ?? '',
  description: overrides.description ?? '',
});

const normalizePromoStories = (value: unknown): PromoStoryInput[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null;
      const story = entry as Partial<PromoStoryInput>;
      const title = typeof story.title === 'string' ? story.title : '';
      const videoUrl = typeof story.videoUrl === 'string' ? story.videoUrl : '';
      const description = typeof story.description === 'string' ? story.description : '';

      if (!title.trim() && !videoUrl.trim() && !description.trim()) return null;

      return createPromoStory({
        id: typeof story.id === 'string' && story.id ? story.id : `story-${index + 1}`,
        title,
        videoUrl,
        description,
      });
    })
    .filter((story): story is PromoStoryInput => story !== null);
};

const PRODUCTS_PAGE_SIZE = 12;
const ORDERS_PAGE_SIZE = 10;
const PRODUCT_ORIGINS = ['Rangpur', 'Rajshahi', 'Podagonj'] as const;
const DEFAULT_PRODUCT_VARIANT = { weight: '1kg', price: 0 };
const DEFAULT_PRODUCT_FORM: Partial<Product> = {
  name: '',
  description: '',
  image: '',
  images: [],
  pricePerKg: 0,
  stock: 999,
  variety: 'Harivanga',
  origin: 'Rangpur',
  tasteProfile: '',
  isAvailable: true,
  variants: [{ ...DEFAULT_PRODUCT_VARIANT }]
};
const DEFAULT_SETTINGS: AdminSettings = {
  storeName: 'Harivanga.com',
  logoUrl: '',
  website: 'https://harivanga.com',
  supportPhone: '01342262821',
  supportEmail: 'support@harivanga.com',
  address: 'Dhaka, Bangladesh',
  deliveryZoneEntries: [
    { id: 'zone-a', name: 'Zone A (0-5 km)', charge: 80 },
    { id: 'zone-b', name: 'Zone B (5-10 km)', charge: 120 },
    { id: 'zone-c', name: 'Zone C (10-15 km)', charge: 180 },
  ],
  deliveryZones: 'Dhaka Metro, Uttara, Banani, Dhanmondi, Mirpur',
  deliveryCharges: 'Inside Dhaka: ৳80, Express zones: ৳120',
  estimatedDeliveryTime: '48 hours',
  minimumOrderAmount: 500,
  codEnabled: true,
  paymentMethods: 'Cash on Delivery, bKash, Nagad',
  cashPaymentEnabled: true,
  mobilePaymentEnabled: true,
  cardPaymentEnabled: false,
  mobilePaymentSettings: 'Confirm transaction ID before marking prepaid orders as confirmed.',
  bankSettings: 'Bank transfer is available for wholesale or bulk orders.',
  lowStockThreshold: 25,
  stockAlertEnabled: true,
  autoDisableLowStockItems: false,
  trackInventory: true,
  outOfStockBehavior: 'Mark out of stock',
  defaultOrderStatus: 'Pending',
  cancellationWindowMinutes: 30,
  allowCustomerCancellation: true,
  autoConfirmOrders: false,
  cancellationRules: 'Orders may be cancelled before dispatch. Confirmed prepaid orders require manual review.',
  returnRefundNotes: 'Report fruit-quality issues within 24 hours with photos for support review.',
  adminUserEntries: [
    { id: 'admin-user', name: 'Admin User', email: 'admin@harivanga.com', role: 'Admin' },
    { id: 'manager-one', name: 'Manager One', email: 'manager@harivanga.com', role: 'Manager' },
    { id: 'staff-member', name: 'Staff Member', email: 'staff@harivanga.com', role: 'Staff' },
  ],
  adminUsers: 'admin@harivanga.com',
  rolesPermissions: 'Super Admin: full access. Operations Admin: orders and products.',
  emailAlertsEnabled: true,
  smsAlertsEnabled: false,
  emailNewOrderEnabled: true,
  emailOrderStatusEnabled: true,
  emailLowStockEnabled: true,
  smsUrgentOrdersEnabled: true,
  smsDailySummaryEnabled: false,
  seasonalAvailabilityControl: true,
  storeOpen: true,
  showOutOfSeasonProducts: false,
  autoToggleSeasonalProducts: true,
  storeOpensAt: '08:00',
  storeClosesAt: '22:00',
  promoStories: [createPromoStory()],
};

const loadSettings = (): AdminSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw =
      window.localStorage.getItem(ADMIN_SETTINGS_KEY) ??
      window.localStorage.getItem(LEGACY_ADMIN_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<AdminSettings> & LegacyPromoSettings;
    const normalizedStories = normalizePromoStories(parsed.promoStories);
    const legacyStories =
      typeof parsed.promoVideoUrl === 'string' && parsed.promoVideoUrl.trim()
        ? [
            createPromoStory({
              title: typeof parsed.promoTitle === 'string' ? parsed.promoTitle : '',
              videoUrl: parsed.promoVideoUrl,
              description: typeof parsed.promoDescription === 'string' ? parsed.promoDescription : '',
            }),
          ]
        : [];

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      promoStories: normalizedStories.length ? normalizedStories : legacyStories.length ? legacyStories : [createPromoStory()],
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const loadPromoStoriesFromSupabase = async (): Promise<PromoStoryInput[] | null> => {
  if (!hasSupabaseConfig) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('home_promotion')
      .select('promo_stories')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const normalizedStories = normalizePromoStories((data as { promo_stories?: unknown } | null)?.promo_stories);
    return normalizedStories.length > 0 ? normalizedStories : null;
  } catch {
    return null;
  }
};

const createEmptyProductForm = (): Partial<Product> => ({
  ...DEFAULT_PRODUCT_FORM,
  images: [],
  variants: [{ ...DEFAULT_PRODUCT_VARIANT }],
});

const buildProductForm = (product: Product): Partial<Product> => {
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const primaryImage = product.image || images[0] || '';
  const normalizedImages = primaryImage
    ? [primaryImage, ...images.filter((image) => image !== primaryImage)]
    : images;

  return {
    ...product,
    image: primaryImage,
    images: normalizedImages,
    stock: product.stock || 999,
    variants: product.variants?.length ? product.variants : [{ ...DEFAULT_PRODUCT_VARIANT, price: product.pricePerKg }],
  };
};

export const AdminDashboard: React.FC = () => {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const localHost = isLocalDevHost();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [overviewOrders, setOverviewOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [productTotalCount, setProductTotalCount] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalCount, setOrderTotalCount] = useState(0);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'inSeason' | 'outOfSeason'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  const [settingsForm, setSettingsForm] = useState<AdminSettings>(loadSettings);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<CustomerReviewInput[]>([]);
  const [reviewsSavedMessage, setReviewsSavedMessage] = useState<string | null>(null);
  const [orderNotifications, setOrderNotifications] = useState<OrderNotification[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.sessionStorage.getItem('harivanga_admin_notifs');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as OrderNotification[];
      return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
    } catch {
      return [];
    }
  });
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [toastNotif, setToastNotif] = useState<OrderNotification | null>(null);
  const [adminEmail, setAdminEmail] = useState(localHost ? LOCAL_DEV_ADMIN_EMAIL : '');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminResetMessage, setAdminResetMessage] = useState<string | null>(null);
  const [isAdminResetting, setIsAdminResetting] = useState(false);
  const [isAdminAuthenticating, setIsAdminAuthenticating] = useState(false);
  const [isLocalDevAuthenticated, setIsLocalDevAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(LOCAL_DEV_ADMIN_KEY) === 'true';
  });
  const productImagesInputRef = useRef<HTMLInputElement | null>(null);
  const hasAdminAccess = isAdmin || (localHost && isLocalDevAuthenticated);
  const isLocalDevBypass = isLocalDevAdminMode() && !isAdmin;
  
  // Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>(createEmptyProductForm);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSubmitError, setProductSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin || !hasSupabaseConfig) {
      return;
    }

    let cancelled = false;

    (async () => {
      const remoteStories = await loadPromoStoriesFromSupabase();
      if (!remoteStories || cancelled) {
        return;
      }

      setSettingsForm((current) => ({
        ...current,
        promoStories: remoteStories,
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!settingsSavedMessage) return;
    const timeout = window.setTimeout(() => setSettingsSavedMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [settingsSavedMessage]);

  useEffect(() => {
    if (!reviewsSavedMessage) return;
    const timeout = window.setTimeout(() => setReviewsSavedMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [reviewsSavedMessage]);

  useEffect(() => {
    if (!toastNotif) return;
    const timer = window.setTimeout(() => setToastNotif(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toastNotif]);

  useEffect(() => {
    if (!hasAdminAccess) return;
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission().catch(() => { /* user dismissed */ });
    }
  }, [hasAdminAccess]);

  // Persist notifications across refreshes so unread alerts survive
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem('harivanga_admin_notifs', JSON.stringify(orderNotifications.slice(0, 30)));
    } catch { /* quota exceeded — ignore */ }
  }, [orderNotifications]);

  // Dedicated realtime subscription for new-order notifications.
  // Kept separate from the data-refresh channels above so filter/page changes
  // don't tear down the notification stream and miss inserts.
  useEffect(() => {
    if (!hasAdminAccess || !hasSupabaseConfig) return;

    const pushNotification = (
      orderId: string,
      customerName: string,
      amount: number,
      createdAt: string,
    ) => {
      const notifId = `notif-${orderId}`;
      setOrderNotifications((prev) => {
        if (prev.some((n) => n.id === notifId)) return prev;
        const notif: OrderNotification = {
          id: notifId,
          orderId,
          customerName,
          amount,
          createdAt,
          seen: false,
        };
        setToastNotif(notif);
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            void new Notification('New Order Received!', {
              body: `${customerName} placed an order for ৳${amount.toLocaleString()}`,
              icon: '/logo.png',
              tag: orderId,
            });
          } catch { /* notification API quirks — ignore */ }
        }
        return [notif, ...prev].slice(0, 30);
      });
    };

    const channel = supabase
      .channel('new-order-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const row = payload.new as {
            id: string;
            customer_name: string;
            total: number;
            created_at: string;
          };
          if (!row?.id) return;
          pushNotification(row.id, row.customer_name ?? 'Customer', Number(row.total) || 0, row.created_at ?? new Date().toISOString());
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('new-order-notifications channel status:', status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hasAdminAccess]);

  // Local dev: surface an in-app notification when a new local order is saved.
  useEffect(() => {
    if (!hasAdminAccess || !isLocalDevBypass) return;
    if (typeof window === 'undefined') return;

    const handleLocalOrders = () => {
      const latest = getLocalDevOrders()[0];
      if (!latest) return;
      const notifId = `notif-${latest.id}`;
      setOrderNotifications((prev) => {
        if (prev.some((n) => n.id === notifId)) return prev;
        const notif: OrderNotification = {
          id: notifId,
          orderId: latest.id,
          customerName: latest.customerName,
          amount: latest.total,
          createdAt: latest.createdAt,
          seen: false,
        };
        setToastNotif(notif);
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            void new Notification('New Order Received!', {
              body: `${latest.customerName} placed an order for ৳${latest.total.toLocaleString()}`,
              icon: '/logo.png',
              tag: latest.id,
            });
          } catch { /* ignore */ }
        }
        return [notif, ...prev].slice(0, 30);
      });
    };

    window.addEventListener(LOCAL_DEV_ORDERS_UPDATED_EVENT, handleLocalOrders);
    return () => window.removeEventListener(LOCAL_DEV_ORDERS_UPDATED_EVENT, handleLocalOrders);
  }, [hasAdminAccess, isLocalDevBypass]);

  useEffect(() => {
    if (!isAdmin || !hasSupabaseConfig) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('customer_reviews')
          .select('id, customer_name, location, rating, review_text, avatar_initials, is_featured')
          .order('created_at', { ascending: false });
        if (error || !data || cancelled) return;
        setReviews(
          (data as Array<{
            id: string; customer_name: string; location: string; rating: number;
            review_text: string; avatar_initials: string; is_featured: boolean;
          }>).map((row) => ({
            id: row.id,
            customerName: row.customer_name,
            location: row.location,
            rating: row.rating,
            reviewText: row.review_text,
            avatarInitials: row.avatar_initials,
            isFeatured: row.is_featured,
          }))
        );
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const handleAddReview = async (review: Omit<CustomerReviewInput, 'id'>) => {
    if (hasSupabaseConfig && isAdmin) {
      try {
        const { data, error } = await supabase
          .from('customer_reviews')
          .insert([{
            customer_name: review.customerName,
            location: review.location,
            rating: review.rating,
            review_text: review.reviewText,
            avatar_initials: review.avatarInitials,
            is_featured: review.isFeatured,
          }])
          .select('id, customer_name, location, rating, review_text, avatar_initials, is_featured')
          .single();
        if (error) throw error;
        if (data) {
          const mapped: CustomerReviewInput = {
            id: (data as { id: string }).id,
            customerName: review.customerName,
            location: review.location,
            rating: review.rating,
            reviewText: review.reviewText,
            avatarInitials: review.avatarInitials,
            isFeatured: review.isFeatured,
          };
          setReviews((prev) => [mapped, ...prev]);
          setReviewsSavedMessage('Review added');
          return;
        }
      } catch { /* fallback to local */ }
    }
    const localReview: CustomerReviewInput = { ...review, id: `local-${Date.now()}` };
    setReviews((prev) => [localReview, ...prev]);
    setReviewsSavedMessage('Review added');
  };

  const handleDeleteReview = async (id: string) => {
    if (hasSupabaseConfig && isAdmin && !id.startsWith('local-')) {
      try {
        await supabase.from('customer_reviews').delete().eq('id', id);
      } catch { /* ignore */ }
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setReviewsSavedMessage('Review removed');
  };

  const handleToggleReviewFeatured = async (id: string) => {
    const review = reviews.find((r) => r.id === id);
    if (!review) return;
    const newValue = !review.isFeatured;
    if (hasSupabaseConfig && isAdmin && !id.startsWith('local-')) {
      try {
        await supabase.from('customer_reviews').update({ is_featured: newValue }).eq('id', id);
      } catch { /* ignore */ }
    }
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, isFeatured: newValue } : r));
    setReviewsSavedMessage(newValue ? 'Review shown' : 'Review hidden');
  };

  const loadOverviewData = async () => {
    if (isLocalDevBypass) {
      setOverviewOrders(getLocalDevOrders());
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setOverviewOrders((data ?? []).map(mapOrderRow));
  };

  const loadProductsPage = async () => {
    if (isLocalDevBypass) {
      const query = productSearchQuery.trim().toLowerCase();
      const allProducts = (await getLocalDevProducts()).filter((product) => {
        const matchesQuery = !query || product.name.toLowerCase().includes(query);
        const matchesStatus =
          productStatusFilter === 'all' ||
          (productStatusFilter === 'inSeason' && product.isAvailable) ||
          (productStatusFilter === 'outOfSeason' && !product.isAvailable);
        return matchesQuery && matchesStatus;
      });

      setProductTotalCount(allProducts.length);
      const start = (productPage - 1) * PRODUCTS_PAGE_SIZE;
      setProducts(allProducts.slice(start, start + PRODUCTS_PAGE_SIZE));
      return;
    }

    const start = (productPage - 1) * PRODUCTS_PAGE_SIZE;
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    const trimmedQuery = productSearchQuery.trim();
    if (trimmedQuery) {
      query = query.ilike('name', `%${trimmedQuery}%`);
    }

    if (productStatusFilter === 'inSeason') {
      query = query.eq('is_available', true);
    } else if (productStatusFilter === 'outOfSeason') {
      query = query.eq('is_available', false);
    }

    const { data, error, count } = await query.range(start, start + PRODUCTS_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    setProducts((data ?? []).map(mapProductRow));
    setProductTotalCount(count ?? 0);
  };

  const loadOrdersPage = async () => {
    if (isLocalDevBypass) {
      const query = orderSearchQuery.trim().toLowerCase();
      const allOrders = getLocalDevOrders().filter((order) => {
        const matchesQuery =
          !query ||
          order.id.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.customerPhone.toLowerCase().includes(query);
        const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
        const matchesDate = !orderDateFilter || order.createdAt.startsWith(orderDateFilter);

        return matchesQuery && matchesStatus && matchesDate;
      });

      setOrderTotalCount(allOrders.length);
      const start = (orderPage - 1) * ORDERS_PAGE_SIZE;
      setOrders(allOrders.slice(start, start + ORDERS_PAGE_SIZE));
      return;
    }

    const start = (orderPage - 1) * ORDERS_PAGE_SIZE;
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    const trimmedQuery = orderSearchQuery.trim();
    if (trimmedQuery) {
      if (/^[0-9a-f-]{32,36}$/i.test(trimmedQuery)) {
        query = query.eq('id', trimmedQuery);
      } else {
        query = query.or(`customer_name.ilike.%${trimmedQuery}%,customer_phone.ilike.%${trimmedQuery}%`);
      }
    }

    if (orderStatusFilter !== 'all') {
      query = query.eq('status', orderStatusFilter);
    }

    if (orderDateFilter) {
      const nextDate = new Date(`${orderDateFilter}T00:00:00`);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateIso = nextDate.toISOString().slice(0, 10);
      query = query.gte('created_at', `${orderDateFilter}T00:00:00`).lt('created_at', `${nextDateIso}T00:00:00`);
    }

    const { data, error, count } = await query.range(start, start + ORDERS_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    setOrders((data ?? []).map(mapOrderRow));
    setOrderTotalCount(count ?? 0);
  };

  useEffect(() => {
    if (!hasAdminAccess) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    void loadOverviewData()
      .catch((error) => {
        console.error('Failed to load admin overview', error);
        setErrorMessage('Failed to load admin data. Check Supabase tables, policies, and realtime settings.');
      })
      .finally(() => setLoading(false));
  }, [hasAdminAccess]);

  useEffect(() => {
    if (!hasAdminAccess || activeTab === 'overview' || activeTab === 'settings') {
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    void (activeTab === 'products' ? loadProductsPage() : loadOrdersPage())
      .catch((error) => {
        console.error(`Failed to load admin ${activeTab}`, error);
        setErrorMessage('Failed to load admin data. Check Supabase tables, policies, and realtime settings.');
      })
      .finally(() => setLoading(false));
  }, [
    activeTab,
    hasAdminAccess,
    orderDateFilter,
    orderPage,
    orderSearchQuery,
    orderStatusFilter,
    productPage,
    productSearchQuery,
    productStatusFilter,
    settingsForm.lowStockThreshold,
  ]);

  useEffect(() => {
    if (!hasAdminAccess) {
      return;
    }

    const productsChannel = supabase
      .channel('admin-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        if (activeTab !== 'products') {
          return;
        }

        void loadProductsPage().catch((error) => {
          console.error('Failed to refresh admin products', error);
        });
      })
      .subscribe();

    const ordersChannel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void loadOverviewData().catch((error) => {
          console.error('Failed to refresh admin overview', error);
        });

        if (activeTab === 'orders') {
          void loadOrdersPage().catch((error) => {
            console.error('Failed to refresh admin orders', error);
          });
        }
      })
      .subscribe();

    const refreshLocalOrders = () => {
      if (!isLocalDevBypass) return;
      const nextOrders = getLocalDevOrders();
      setOverviewOrders(nextOrders);
      setOrders(nextOrders.slice(0, ORDERS_PAGE_SIZE));
      setOrderTotalCount(nextOrders.length);
    };
    window.addEventListener(LOCAL_DEV_ORDERS_UPDATED_EVENT, refreshLocalOrders);

    return () => {
      void supabase.removeChannel(productsChannel);
      void supabase.removeChannel(ordersChannel);
      window.removeEventListener(LOCAL_DEV_ORDERS_UPDATED_EVENT, refreshLocalOrders);
    };
  }, [
    activeTab,
    hasAdminAccess,
    isLocalDevBypass,
    orderDateFilter,
    orderPage,
    orderSearchQuery,
    orderStatusFilter,
    productPage,
    productSearchQuery,
    productStatusFilter,
    settingsForm.lowStockThreshold,
  ]);

  useEffect(() => {
    setProductPage(1);
  }, [productSearchQuery, productStatusFilter]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderSearchQuery, orderStatusFilter, orderDateFilter]);

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (isLocalDevBypass) {
      setOrders((current) => {
        const nextOrders = current.map((order) => (order.id === orderId ? { ...order, status } : order));
        setLocalDevOrders(nextOrders);
        return nextOrders;
      });
      return;
    }

    const previousOrders = orders;
    const previousOverviewOrders = overviewOrders;
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
    setOverviewOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select('id')
        .maybeSingle();
      if (error || !data) {
        throw error ?? new Error('Order status update was not applied.');
      }
      await Promise.all([loadOverviewData(), loadOrdersPage()]);
    } catch (error) {
      setOrders(previousOrders);
      setOverviewOrders(previousOverviewOrders);
      console.error('Failed to update order status', error);
      setErrorMessage('Could not update order status. Confirm this account has admin role in Supabase and try again.');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProduct) {
      return;
    }

    setIsSavingProduct(true);
    setProductSubmitError(null);
    const sanitizedVariants = (productForm.variants ?? [])
      .map((variant) => ({
        weight: variant.weight.trim(),
        price: Number(variant.price) || 0,
      }))
      .filter((variant) => variant.weight.length > 0);
    const finalVariants = sanitizedVariants.length > 0 ? sanitizedVariants : [{ ...DEFAULT_PRODUCT_VARIANT, price: Number(productForm.pricePerKg) || 0 }];
    const imageList = (productForm.images ?? []).filter(Boolean);
    const primaryImage = productForm.image || imageList[0] || '';
    const normalizedImages = primaryImage
      ? [primaryImage, ...imageList.filter((image) => image !== primaryImage)]
      : imageList;
    const sanitizedProductForm: Partial<Product> = {
      ...productForm,
      image: primaryImage,
      images: normalizedImages,
      stock: productForm.stock ?? 999,
      origin: productForm.origin || 'Rangpur',
      pricePerKg: finalVariants[0]?.price ?? (Number(productForm.pricePerKg) || 0),
      variants: finalVariants,
    };

    if (isLocalDevBypass) {
      const allExistingProducts = await getLocalDevProducts();
      const nextProduct: Product = {
        id: editingProduct?.id ?? `local-product-${Date.now()}`,
        name: sanitizedProductForm.name ?? '',
        description: sanitizedProductForm.description ?? '',
        image: sanitizedProductForm.image ?? '',
        images: sanitizedProductForm.images,
        pricePerKg: sanitizedProductForm.pricePerKg ?? 0,
        stock: sanitizedProductForm.stock ?? 999,
        variety: sanitizedProductForm.variety ?? 'Harivanga',
        origin: sanitizedProductForm.origin ?? 'Rangpur',
        tasteProfile: sanitizedProductForm.tasteProfile ?? '',
        isAvailable: sanitizedProductForm.isAvailable ?? true,
        variants: sanitizedProductForm.variants ?? [{ ...DEFAULT_PRODUCT_VARIANT }],
      };

      const nextProducts = editingProduct
        ? allExistingProducts.map((product) => (product.id === editingProduct.id ? nextProduct : product))
        : [...allExistingProducts, nextProduct];

      setLocalDevProducts(nextProducts);
      notifyStorefrontProductsChanged();
      await loadProductsPage();
      resetProductModal();
      setIsSavingProduct(false);
      return;
    }

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(mapProductToRow(sanitizedProductForm))
          .eq('id', editingProduct.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('products')
          .insert(mapProductToRow(sanitizedProductForm));
        if (error) {
          throw error;
        }
      }
      await loadProductsPage();
      notifyStorefrontProductsChanged();
      resetProductModal();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Could not save the product.';
      setProductSubmitError(nextMessage);
      console.error('Product save failed', error);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: PaymentStatus) => {
    if (isLocalDevBypass) {
      setOrders((current) => {
        const nextOrders = current.map((order) => (order.id === orderId ? { ...order, paymentStatus } : order));
        setLocalDevOrders(nextOrders);
        return nextOrders;
      });
      return;
    }

    const previousOrders = orders;
    const previousOverviewOrders = overviewOrders;
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, paymentStatus } : order)));
    setOverviewOrders((current) => current.map((order) => (order.id === orderId ? { ...order, paymentStatus } : order)));

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId)
        .select('id')
        .maybeSingle();
      if (error || !data) {
        throw error ?? new Error('Payment status update was not applied.');
      }
      await Promise.all([loadOverviewData(), loadOrdersPage()]);
    } catch (error) {
      setOrders(previousOrders);
      setOverviewOrders(previousOverviewOrders);
      console.error('Failed to update payment status', error);
      setErrorMessage('Could not update payment status. Confirm this account has admin role in Supabase and try again.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      if (isLocalDevBypass) {
        setProducts((current) => {
          const nextProducts = current.filter((product) => product.id !== id);
          setLocalDevProducts(nextProducts);
          notifyStorefrontProductsChanged();
          return nextProducts;
        });
        return;
      }

      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          throw error;
        }
        await loadProductsPage();
        notifyStorefrontProductsChanged();
      } catch (error) {
        handleDatabaseError(error, OperationType.DELETE, 'products');
      }
    }
  };

  const handlePromoStoryChange = (id: string, field: 'title' | 'videoUrl' | 'description', value: string) => {
    setSettingsForm((current) => ({
      ...current,
      promoStories: current.promoStories.map((story) => (story.id === id ? { ...story, [field]: value } : story)),
    }));
  };

  const handleAddPromoStory = () => {
    setSettingsForm((current) => ({
      ...current,
      promoStories: [...current.promoStories, createPromoStory()],
    }));
  };

  const handleRemovePromoStory = (id: string) => {
    setSettingsForm((current) => {
      if (current.promoStories.length <= 1) return current;

      return {
        ...current,
        promoStories: current.promoStories.filter((story) => story.id !== id),
      };
    });
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();

    window.localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settingsForm));
    notifyAdminSettingsChanged();

    // Local-dev admin bypass has no Supabase session/JWT, so it cannot write to the DB.
    if (hasSupabaseConfig && isAdmin) {
      setSettingsSavedMessage('Saving...');
      try {
        const { error } = await supabase.from('home_promotion').upsert(
          {
            id: 1,
            promo_stories: settingsForm.promoStories,
          },
          { onConflict: 'id' }
        );

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Failed to sync home promotion', error);
        setSettingsSavedMessage('Saved locally (cloud sync failed)');
        return;
      }
    }

    setSettingsSavedMessage('Settings saved');
  };

  const handleResetSettings = async () => {
    if (!window.confirm('Reset settings to default values?')) return;
    window.localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setSettingsForm(DEFAULT_SETTINGS);
    notifyAdminSettingsChanged();

    if (hasSupabaseConfig && isAdmin) {
      setSettingsSavedMessage('Resetting...');
      try {
        const { error } = await supabase.from('home_promotion').upsert(
          {
            id: 1,
            promo_stories: DEFAULT_SETTINGS.promoStories,
          },
          { onConflict: 'id' }
        );

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Failed to reset home promotion', error);
        setSettingsSavedMessage('Reset locally (cloud sync failed)');
        return;
      }
    }

    setSettingsSavedMessage('Settings reset');
  };

  const handleSeedDatabase = async () => {
    let existingNames = new Set(products.map((product) => product.name.toLowerCase()));

    try {
      if (isLocalDevBypass) {
        const mockProducts = await getMockProducts();
        const missingProducts = mockProducts.filter((product) => !existingNames.has(product.name.toLowerCase()));
        if (missingProducts.length === 0) {
          window.alert('All demo products are already available.');
          return;
        }

        setProducts((current) => {
          const nextProducts = [...current, ...missingProducts];
          setLocalDevProducts(nextProducts);
          notifyStorefrontProductsChanged();
          return nextProducts;
        });
        window.alert(`Added ${missingProducts.length} demo product${missingProducts.length > 1 ? 's' : ''}.`);
        return;
      }

      const { data: existingRows, error: existingError } = await supabase.from('products').select('name');
      if (existingError) {
        throw existingError;
      }
      existingNames = new Set((existingRows ?? []).map((row) => row.name.toLowerCase()));

      const mockProducts = await getMockProducts();
      const missingProducts = mockProducts.filter((product) => !existingNames.has(product.name.toLowerCase()));
      if (missingProducts.length === 0) {
        window.alert('All demo products are already available.');
        return;
      }

      for (const product of missingProducts) {
        const { id, ...data } = product;
        const { error } = await supabase.from('products').insert(mapProductToRow(data));
        if (error) {
          throw error;
        }
      }
      await loadProductsPage();
      notifyStorefrontProductsChanged();
      window.alert(`Added ${missingProducts.length} demo product${missingProducts.length > 1 ? 's' : ''}.`);
    } catch (error) {
      handleDatabaseError(error, OperationType.WRITE, 'products');
    }
  };

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []) as File[];
    if (files.length === 0) return;

    const images = await Promise.all(files.map((file) => optimizeProductUpload(file)));

    setProductForm((current) => {
      const currentImages = current.images ?? (current.image ? [current.image] : []);
      const nextImages = [...currentImages, ...images].filter(Boolean);
      return {
        ...current,
        image: current.image || nextImages[0] || '',
        images: nextImages,
      };
    });

    event.target.value = '';
  };

  const handlePrimaryImageSelect = (image: string) => {
    setProductForm((current) => ({
      ...current,
      image,
      images: [image, ...(current.images ?? []).filter((item) => item !== image)],
    }));
  };

  const handleRemoveProductImage = (image: string) => {
    setProductForm((current) => {
      const nextImages = (current.images ?? []).filter((item) => item !== image);
      const nextPrimary = current.image === image ? nextImages[0] ?? '' : current.image ?? nextImages[0] ?? '';
      return {
        ...current,
        image: nextPrimary,
        images: nextImages,
      };
    });
  };

  const handleVariantChange = (index: number, key: keyof Product['variants'][number], value: string) => {
    setProductForm((current) => {
      const nextVariants = (current.variants ?? [{ ...DEFAULT_PRODUCT_VARIANT }]).map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              [key]: key === 'price' ? Number(value) || 0 : value,
            }
          : variant
      );

      return {
        ...current,
        variants: nextVariants,
        pricePerKg: nextVariants[0]?.price ?? current.pricePerKg ?? 0,
      };
    });
  };

  const handleAddVariant = () => {
    setProductForm((current) => ({
      ...current,
      variants: [...(current.variants ?? [{ ...DEFAULT_PRODUCT_VARIANT }]), { weight: '', price: 0 }],
    }));
  };

  const handleAddPackageVariant = (weightLabel: string) => {
    setProductForm((current) => ({
      ...current,
      variants: [...(current.variants ?? [{ ...DEFAULT_PRODUCT_VARIANT }]), { weight: weightLabel, price: 0 }],
    }));
  };

  const handleRemoveVariant = (index: number) => {
    setProductForm((current) => {
      const currentVariants = current.variants ?? [{ ...DEFAULT_PRODUCT_VARIANT }];
      const nextVariants = currentVariants.length === 1
        ? [{ ...DEFAULT_PRODUCT_VARIANT }]
        : currentVariants.filter((_, variantIndex) => variantIndex !== index);

      return {
        ...current,
        variants: nextVariants,
        pricePerKg: nextVariants[0]?.price ?? 0,
      };
    });
  };

  const resetProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductForm(createEmptyProductForm());
    setProductSubmitError(null);
    setIsSavingProduct(false);
  };

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdminLoginError(null);
    setAdminResetMessage(null);

    const normalizedEmail = adminEmail.trim().toLowerCase();
    if (localHost && normalizedEmail === LOCAL_DEV_ADMIN_EMAIL && adminPassword === LOCAL_DEV_ADMIN_PASSWORD) {
      window.localStorage.setItem(LOCAL_DEV_ADMIN_KEY, 'true');
      setLocalDevProducts(await getLocalDevProducts());
      setIsLocalDevAuthenticated(true);
      setAdminPassword('');
      return;
    }

    setIsAdminAuthenticating(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: adminPassword,
      });

      if (error) {
        throw error;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (profileRow?.role !== 'admin') {
        await supabase.auth.signOut();
        setAdminLoginError('This account does not have admin access.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Admin authentication failed.';
      setAdminLoginError(message);
    } finally {
      setIsAdminAuthenticating(false);
    }
  };

  const handleAdminLogout = async () => {
    setAdminLoginError(null);
    setAdminResetMessage(null);

    if (localHost) {
      window.localStorage.removeItem(LOCAL_DEV_ADMIN_KEY);
      setIsLocalDevAuthenticated(false);
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      setAdminPassword('');
      setActiveTab('overview');
      navigate('/admin');
    }
  };

  const handleAdminPasswordReset = async () => {
    setAdminLoginError(null);
    setAdminResetMessage(null);

    const normalizedEmail = adminEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setAdminLoginError('Enter your admin email first.');
      return;
    }

    if (localHost && normalizedEmail === LOCAL_DEV_ADMIN_EMAIL) {
      setAdminLoginError('Password reset is not available for the local test login.');
      return;
    }

    setIsAdminResetting(true);
    try {
      const redirectTo = `${window.location.origin}/admin/reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
      if (error) {
        throw error;
      }
      setAdminResetMessage('Password reset email sent. Check your inbox.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not send reset email.';
      setAdminLoginError(message);
    } finally {
      setIsAdminResetting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#f3f4f6] border-t-[#f97316]"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-[#111827]">
        <h2 className="text-2xl font-bold tracking-tight mb-3">Admin Data Error</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md font-light">{errorMessage}</p>
        <button onClick={() => window.location.reload()} className="border border-[#111827] bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] hover:bg-[#fafaf9] transition-colors">Reload Page</button>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-white text-[#111827] font-sans px-4 py-12 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); navigate('/'); }}
              className="text-2xl font-bold tracking-tight inline-block"
            >
              HARIVANGA
            </a>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-gray-400 font-medium">Admin</p>
          </div>

          <div className="border border-[#f3f4f6] bg-white p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Sign in</h1>
              <p className="mt-1.5 text-sm text-gray-500 font-light">Enter your admin credentials to continue.</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="h-11 w-full border border-gray-200 bg-white px-4 text-sm text-[#111827] outline-none transition focus:border-[#f97316]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleAdminPasswordReset}
                    disabled={isAdminResetting || isAdminAuthenticating}
                    className="text-xs font-medium text-gray-500 hover:text-[#f97316] transition-colors disabled:opacity-50"
                  >
                    {isAdminResetting ? 'Sending...' : 'Forgot?'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="h-11 w-full border border-gray-200 bg-white px-4 pr-11 text-sm text-[#111827] outline-none transition focus:border-[#f97316]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((current) => !current)}
                    aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 transition hover:text-[#111827]"
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {adminLoginError && (
                <div className="border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-600">
                  {adminLoginError}
                </div>
              )}

              {adminResetMessage && (
                <div className="border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700">
                  {adminResetMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isAdminAuthenticating}
                className="flex h-11 w-full items-center justify-center bg-[#111827] text-sm font-semibold tracking-wide text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAdminAuthenticating ? 'Signing in...' : 'Sign in'}
              </button>

              {canUseDevelopmentFallbacks() && (
                <>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                    <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] uppercase tracking-widest text-gray-400 font-medium">Local dev</span></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminEmail(LOCAL_DEV_ADMIN_EMAIL);
                      setAdminPassword(LOCAL_DEV_ADMIN_PASSWORD);
                      setAdminLoginError(null);
                      setAdminResetMessage(null);
                      void handleAdminLogin({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    disabled={isAdminAuthenticating || isAdminResetting}
                    className="flex h-11 w-full items-center justify-center border border-[#111827] bg-white px-4 text-sm font-semibold tracking-wide text-[#111827] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Sign in as local admin
                  </button>
                  <p className="text-[11px] text-center text-gray-400 font-light">
                    {LOCAL_DEV_ADMIN_EMAIL} / {LOCAL_DEV_ADMIN_PASSWORD}
                  </p>
                </>
              )}
            </form>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 w-full text-center text-xs font-medium text-gray-500 hover:text-[#111827] transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = overviewOrders.filter(o => o.createdAt.startsWith(today));
  const totalOrders = overviewOrders.length;
  const totalRevenue = overviewOrders.reduce((acc, o) => acc + o.total, 0);
  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.total, 0);
  const activeTabLabel = activeTab === 'overview' ? 'Overview' : activeTab === 'products' ? 'Products' : activeTab === 'orders' ? 'Orders' : 'Settings';

  const recentOrders = overviewOrders.slice(0, 5);
  const attentionOrders = overviewOrders.filter((order) => order.status === 'Pending' || order.status === 'Cancelled').length;
  const productTotalPages = Math.max(1, Math.ceil(productTotalCount / PRODUCTS_PAGE_SIZE));
  const orderTotalPages = Math.max(1, Math.ceil(orderTotalCount / ORDERS_PAGE_SIZE));

  const formatCurrency = (value: number) => `\u09F3${value.toLocaleString()}`;
  const getOrderStatusClasses = (status: OrderStatus) => {
    if (status === 'Delivered') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    if (status === 'Out for Delivery') return 'bg-blue-50 text-blue-700 border border-blue-100';
    if (status === 'Confirmed') return 'bg-amber-50 text-amber-700 border border-amber-100';
    if (status === 'Cancelled') return 'bg-red-50 text-red-600 border border-red-100';
    return 'bg-[#fff7ed] text-[#f97316] border border-[#fed7aa]';
  };
  const getPaymentStatusClasses = (paymentStatus: PaymentStatus) => {
    if (paymentStatus === 'Received') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    if (paymentStatus === 'Rejected') return 'bg-red-50 text-red-600 border border-red-100';
    if (paymentStatus === 'Awaiting Verification') return 'bg-amber-50 text-amber-700 border border-amber-100';
    return 'bg-[#fafaf9] text-gray-600 border border-[#f3f4f6]';
  };
  return (
    <>
    <div className="font-admin min-h-screen bg-white text-[#111827] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-60 bg-white text-[#111827] hidden lg:flex flex-col sticky top-0 h-screen border-r border-[#f3f4f6]">
        <div className="px-6 pt-8 pb-4">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
            className="text-xl font-bold tracking-tight inline-block"
          >
            HARIVANGA
          </a>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium">Admin</p>
        </div>

        <div className="px-3 mt-4 flex-1">
          <nav className="space-y-0.5">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-[#111827] hover:bg-[#fafaf9] transition-colors"
            >
              <House size={16} strokeWidth={1.75} /> Home
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-[#111827] bg-[#fafaf9]' : 'text-gray-500 hover:text-[#111827] hover:bg-[#fafaf9]'}`}
            >
              <LayoutDashboard size={16} strokeWidth={1.75} /> Overview
              {activeTab === 'overview' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f97316]" />}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'products' ? 'text-[#111827] bg-[#fafaf9]' : 'text-gray-500 hover:text-[#111827] hover:bg-[#fafaf9]'}`}
            >
              <Package size={16} strokeWidth={1.75} /> Products
              {activeTab === 'products' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f97316]" />}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'orders' ? 'text-[#111827] bg-[#fafaf9]' : 'text-gray-500 hover:text-[#111827] hover:bg-[#fafaf9]'}`}
            >
              <ShoppingBag size={16} strokeWidth={1.75} /> Orders
              {activeTab === 'orders' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f97316]" />}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'text-[#111827] bg-[#fafaf9]' : 'text-gray-500 hover:text-[#111827] hover:bg-[#fafaf9]'}`}
            >
              <SettingsIcon size={16} strokeWidth={1.75} /> Settings
              {activeTab === 'settings' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f97316]" />}
            </button>
          </nav>

          {/* Notification Bell — Desktop Sidebar */}
          <div className="mt-4 pt-4 border-t border-[#f3f4f6] relative">
            <button
              onClick={() => setShowNotifPanel((v) => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-[#111827] hover:bg-[#fafaf9] transition-colors relative"
            >
              <span className="relative">
                <Bell size={16} strokeWidth={1.75} />
                {orderNotifications.filter((n) => !n.seen).length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-[#f97316] flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                    {orderNotifications.filter((n) => !n.seen).length > 9 ? '9+' : orderNotifications.filter((n) => !n.seen).length}
                  </span>
                )}
              </span>
              Notifications
            </button>

            {showNotifPanel && (
              <div className="absolute bottom-full left-2 right-2 mb-2 z-50 bg-white border border-[#f3f4f6] shadow-lg overflow-hidden max-h-[420px] flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f4f6]">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Recent Orders</span>
                  {orderNotifications.some((n) => !n.seen) && (
                    <button
                      onClick={() => setOrderNotifications((prev) => prev.map((n) => ({ ...n, seen: true })))}
                      className="flex items-center gap-1 text-[10px] font-medium text-[#f97316] hover:text-[#ea580c] transition-colors"
                    >
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1">
                  {orderNotifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 font-light">No new orders yet</div>
                  ) : (
                    orderNotifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setOrderNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, seen: true } : item));
                          setActiveTab('orders');
                          setShowNotifPanel(false);
                        }}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-[#f3f4f6] hover:bg-[#fafaf9] transition-colors ${!n.seen ? 'bg-[#fff7ed]/40' : ''}`}
                      >
                        {!n.seen ? <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#f97316]" /> : <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-transparent" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#111827] truncate">{n.customerName}</p>
                          <p className="text-[11px] text-gray-500 font-light">৳{n.amount.toLocaleString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <ArrowRight size={12} className="text-gray-300 shrink-0 mt-1" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto px-6 py-6 border-t border-[#f3f4f6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#fafaf9] border border-[#f3f4f6] flex items-center justify-center font-bold text-sm text-[#111827]">A</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-[#111827]">Admin</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Super Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleAdminLogout()}
            className="mt-4 w-full flex items-center justify-center gap-2 border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-[#111827] hover:text-[#111827]"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <div className="lg:hidden bg-white/90 backdrop-blur-md border-b border-[#f3f4f6] px-4 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium">Admin</p>
              <h1 className="text-xl font-bold tracking-tight text-[#111827]">{activeTabLabel}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center p-2.5 text-gray-500 transition hover:text-[#111827] hover:bg-[#fafaf9]"
                aria-label="Go to home page"
              >
                <House size={16} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => setShowNotifPanel((v) => !v)}
                className="relative inline-flex items-center justify-center p-2.5 text-gray-500 transition hover:text-[#111827] hover:bg-[#fafaf9]"
                aria-label="Notifications"
              >
                <Bell size={16} strokeWidth={1.75} />
                {orderNotifications.filter((n) => !n.seen).length > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-3.5 rounded-full bg-[#f97316] flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                    {orderNotifications.filter((n) => !n.seen).length > 9 ? '9+' : orderNotifications.filter((n) => !n.seen).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => void handleAdminLogout()}
                className="inline-flex items-center justify-center p-2.5 text-gray-500 transition hover:text-[#111827] hover:bg-[#fafaf9]"
                aria-label="Logout"
              >
                <LogOut size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 border border-[#f3f4f6]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-semibold tracking-wide transition-colors border-r border-[#f3f4f6] last:border-r-0 ${activeTab === 'overview' ? 'bg-[#fafaf9] text-[#111827]' : 'text-gray-500 hover:text-[#111827]'}`}
            >
              <LayoutDashboard size={15} strokeWidth={1.75} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-semibold tracking-wide transition-colors border-r border-[#f3f4f6] last:border-r-0 ${activeTab === 'products' ? 'bg-[#fafaf9] text-[#111827]' : 'text-gray-500 hover:text-[#111827]'}`}
            >
              <Package size={15} strokeWidth={1.75} />
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-semibold tracking-wide transition-colors border-r border-[#f3f4f6] last:border-r-0 ${activeTab === 'orders' ? 'bg-[#fafaf9] text-[#111827]' : 'text-gray-500 hover:text-[#111827]'}`}
            >
              <ShoppingBag size={15} strokeWidth={1.75} />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-semibold tracking-wide transition-colors ${activeTab === 'settings' ? 'bg-[#fafaf9] text-[#111827]' : 'text-gray-500 hover:text-[#111827]'}`}
            >
              <SettingsIcon size={15} strokeWidth={1.75} />
              Settings
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-12">
        {activeTab === 'overview' && (
          <section className="space-y-8 sm:space-y-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#f3f4f6] pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium">Dashboard</p>
                <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tighter text-[#111827]">Overview</h1>
              </div>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                {canUseDevelopmentFallbacks() && (
                  <button
                    onClick={handleSeedDatabase}
                    className="text-xs font-medium text-[#f97316] hover:text-[#ea580c] transition-colors"
                  >
                    Seed Database
                  </button>
                )}
                <div className="text-xs text-gray-500 font-medium">{formatLongDate(new Date())}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-[#f3f4f6] border border-[#f3f4f6] xl:grid-cols-4">
              <div className="bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <ShoppingBag size={14} strokeWidth={1.75} />
                  <p className="text-[11px] font-medium uppercase tracking-wider">Today's Orders</p>
                </div>
                <h3 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter text-[#111827]">{todayOrders.length}</h3>
              </div>
              <div className="bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <Package size={14} strokeWidth={1.75} />
                  <p className="text-[11px] font-medium uppercase tracking-wider">Total Orders</p>
                </div>
                <h3 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter text-[#111827]">{totalOrders}</h3>
              </div>
              <div className="bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <TrendingUp size={14} strokeWidth={1.75} />
                  <p className="text-[11px] font-medium uppercase tracking-wider">Today's Revenue</p>
                </div>
                <h3 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter text-[#111827]">{formatCurrency(todayRevenue)}</h3>
              </div>
              <div className="bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <TrendingUp size={14} strokeWidth={1.75} />
                  <p className="text-[11px] font-medium uppercase tracking-wider">Total Revenue</p>
                </div>
                <h3 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter text-[#111827]">{formatCurrency(totalRevenue)}</h3>
              </div>
            </div>

            <div>
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">Recent Orders</h3>
                  <p className="mt-1 text-sm text-gray-500 font-light">Latest orders with the key details only.</p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#f97316] border border-[#fed7aa] bg-[#fff7ed]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
                  {attentionOrders} require attention
                </div>
              </div>
              <div className="border border-[#f3f4f6] divide-y divide-[#f3f4f6]">
                {recentOrders.map((order, index) => (
                  <div key={order.id} className={`flex flex-col gap-2 bg-white px-4 sm:px-5 py-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-[#fafaf9] transition-colors ${index >= 1 ? 'hidden sm:flex' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#111827]">#{order.id.slice(-6).toUpperCase()} · {order.customerName}</p>
                      <p className="mt-1 text-xs font-light text-gray-500">{formatOrderTimestamp(new Date(order.createdAt))}</p>
                      <p className="mt-1 hidden text-xs text-gray-500 font-light sm:block">Phone: {order.customerPhone}</p>
                      <p className="mt-0.5 hidden text-xs text-gray-500 font-light sm:block">Address: {order.deliveryAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold tracking-tight text-[#111827]">{formatCurrency(order.total)}</p>
                      <p className={`mt-1 text-[10px] font-semibold uppercase tracking-wider ${order.status === 'Delivered' ? 'text-emerald-600' : order.status === 'Out for Delivery' ? 'text-blue-600' : order.status === 'Confirmed' ? 'text-amber-600' : order.status === 'Cancelled' ? 'text-red-500' : 'text-gray-500'}`}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <div className="bg-white px-6 py-14 text-center">
                    <p className="text-base font-semibold text-[#111827]">No orders yet</p>
                    <p className="mt-2 text-sm text-gray-500 font-light">New orders will appear here once customers start checking out.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'products' && (
          <section className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#f3f4f6] pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium">Catalog</p>
                <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tighter text-[#111827]">Products</h1>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm(createEmptyProductForm());
                  setProductSubmitError(null);
                  setIsProductModalOpen(true);
                }}
                className="w-full sm:w-auto bg-[#111827] text-white px-5 py-2.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <Plus size={16} strokeWidth={2} /> Add Product
              </button>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-2 sm:gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search by product name"
                  className="w-full border border-gray-200 bg-white h-10 pl-10 pr-4 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] transition"
                />
              </div>
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value as 'all' | 'inSeason' | 'outOfSeason')}
                className="min-w-0 border border-gray-200 bg-white px-3 h-10 text-sm text-[#111827] focus:outline-none focus:border-[#f97316] transition"
              >
                <option value="all">All statuses</option>
                <option value="inSeason">In season</option>
                <option value="outOfSeason">Out of season</option>
              </select>
            </div>

            <div className="hidden md:block bg-white border border-[#f3f4f6] overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-[#f3f4f6]">
                  <tr>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Variety</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Price</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-[#fafaf9] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden bg-[#fafaf9] border border-[#f3f4f6]">
                            <img
                              src={getThumbnailImageSrc(product.image)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                              width={96}
                              height={96}
                            />
                          </div>
                          <span className="font-semibold text-sm text-[#111827]">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-light">{product.variety}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#111827]">{formatCurrency(product.pricePerKg)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${product.isAvailable ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-gray-500 bg-[#fafaf9] border border-[#f3f4f6]'}`}>
                          <span className={`h-1 w-1 rounded-full ${product.isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {product.isAvailable ? 'In Season' : 'Out of Season'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setProductForm(buildProductForm(product));
                              setProductSubmitError(null);
                              setIsProductModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-[#111827] transition-colors"
                            aria-label="Edit"
                          >
                            <Edit2 size={15} strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 size={15} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-3 md:hidden">
              {products.map((product) => (
                <div key={product.id} className="bg-white border border-[#f3f4f6] p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 overflow-hidden bg-[#fafaf9] border border-[#f3f4f6] shrink-0">
                      <img
                        src={getThumbnailImageSrc(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={160}
                        height={160}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-[#111827] truncate">{product.name}</h3>
                          <p className="text-xs text-gray-500 font-light mt-0.5">{product.variety}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${product.isAvailable ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-gray-500 bg-[#fafaf9] border border-[#f3f4f6]'}`}>
                          <span className={`h-1 w-1 rounded-full ${product.isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {product.isAvailable ? 'In Season' : 'Out'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Price</p>
                        <p className="text-base font-bold tracking-tight text-[#111827] mt-0.5">{formatCurrency(product.pricePerKg)}</p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setProductForm(buildProductForm(product));
                            setProductSubmitError(null);
                            setIsProductModalOpen(true);
                          }}
                          className="flex-1 border border-[#111827] bg-white px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#fafaf9] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-red-500 hover:border-red-200 hover:bg-red-50/40 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
                <p className="text-base font-semibold text-[#111827]">No matching products</p>
                <p className="mt-2 text-sm text-gray-500 font-light">Adjust your search or stock filters to find products faster.</p>
              </div>
            )}
            {productTotalCount > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#f3f4f6] pt-5">
                <p className="text-xs text-gray-500 font-light">
                  Showing {(productPage - 1) * PRODUCTS_PAGE_SIZE + 1}-{Math.min(productPage * PRODUCTS_PAGE_SIZE, productTotalCount)} of {productTotalCount} products
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((current) => Math.max(1, current - 1))}
                    className="border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#fafaf9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-gray-500 px-2">Page {productPage} / {productTotalPages}</span>
                  <button
                    type="button"
                    disabled={productPage >= productTotalPages}
                    onClick={() => setProductPage((current) => Math.min(productTotalPages, current + 1))}
                    className="border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#fafaf9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#f3f4f6] pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium">Operations</p>
                <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tighter text-[#111827]">Orders</h1>
                <p className="mt-2 text-sm text-gray-500 font-light">Track active deliveries, confirm new orders, and resolve exceptions quickly.</p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#f97316] border border-[#fed7aa] bg-[#fff7ed]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
                {attentionOrders} pending or cancelled
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_140px_130px] gap-2 sm:gap-3 sm:grid-cols-[minmax(0,1fr)_220px_180px]">
              <div className="relative min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search by order ID, customer name, or phone"
                  className="w-full border border-gray-200 bg-white h-10 pl-10 pr-4 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] transition"
                />
              </div>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value as 'all' | OrderStatus)}
                className="min-w-0 border border-gray-200 bg-white px-3 h-10 text-sm text-[#111827] focus:outline-none focus:border-[#f97316] transition"
              >
                <option value="all">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <input
                type="date"
                value={orderDateFilter}
                onChange={(e) => setOrderDateFilter(e.target.value)}
                className="min-w-0 border border-gray-200 bg-white px-3 h-10 text-sm text-[#111827] focus:outline-none focus:border-[#f97316] transition"
              />
            </div>

            <div className="hidden md:block bg-white border border-[#f3f4f6] overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-[#f3f4f6]">
                  <tr>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Order ID</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Items</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Delivery</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Total</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Payment</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Order Status</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Payment Status</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Update Status</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Update Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {orders.map((order) => (
                    <tr key={order.id} className={`transition-colors hover:bg-[#fafaf9] ${order.status === 'Pending' || order.status === 'Cancelled' ? 'bg-[#fff7ed]/40' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#111827]">#{order.id.slice(-6).toUpperCase()}</span>
                          <span className="mt-1 text-[11px] text-gray-400 font-light">{formatOrderTimestamp(new Date(order.createdAt))}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#111827]">{order.customerName}</span>
                          <span className="mt-0.5 text-xs text-gray-500 font-light">{order.customerPhone}</span>
                          <span className="mt-0.5 text-xs text-gray-500 font-light">{order.deliveryAddress}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, i) => (
                            <p key={i} className="text-xs text-gray-600 font-light">
                              <span className="font-semibold text-[#111827]">{item.quantity}×</span> {item.productName} ({item.variant})
                            </p>
                          ))}
                          {order.items.length > 2 && <p className="text-[11px] font-medium text-gray-400">+{order.items.length - 2} more items</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs text-gray-500 font-light">
                          <span className="text-sm font-semibold text-[#111827]">{order.deliveryArea}</span>
                          <span className="mt-0.5">{order.deliveryDate}</span>
                          <span className="mt-0.5">{order.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#111827]">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-2 text-xs">
                          <div className="font-semibold text-[#111827]">{order.paymentMethod}</div>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getPaymentStatusClasses(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                          {order.paymentMethod !== 'Cash on Delivery' && (
                            <div className="space-y-0.5 text-[11px] text-gray-500 font-light">
                              <p>Sent from: {order.paymentSenderPhone || 'Not submitted'}</p>
                              <p>Txn ID: {order.paymentTransactionId || 'Not submitted'}</p>
                              <p>Confirmation: {formatCurrency(order.paymentConfirmationAmount ?? 0)}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getOrderStatusClasses(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getPaymentStatusClasses(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="text-xs font-semibold text-[#111827] bg-white border border-gray-200 px-2 py-1.5 focus:outline-none focus:border-[#f97316] cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={order.paymentStatus}
                          onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value as PaymentStatus)}
                          className="text-xs font-semibold text-[#111827] bg-white border border-gray-200 px-2 py-1.5 focus:outline-none focus:border-[#f97316] cursor-pointer"
                        >
                          <option value="Not Required">Not Required</option>
                          <option value="Awaiting Verification">Awaiting Verification</option>
                          <option value="Received">Received</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-3 md:hidden">
              {orders.map((order) => (
                <div key={order.id} className={`border bg-white p-4 ${order.status === 'Pending' || order.status === 'Cancelled' ? 'border-[#fed7aa]' : 'border-[#f3f4f6]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Order ID</p>
                      <p className="mt-0.5 text-sm font-bold tracking-tight text-[#111827]">#{order.id.slice(-6).toUpperCase()}</p>
                      <p className="mt-1 text-[11px] text-gray-400 font-light">{formatOrderTimestamp(new Date(order.createdAt))}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getOrderStatusClasses(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#f3f4f6]">
                    <p className="text-sm font-semibold text-[#111827]">{order.customerName}</p>
                    <p className="text-xs text-gray-500 font-light mt-0.5">{order.customerPhone}</p>
                    <p className="mt-0.5 text-xs text-gray-500 font-light">{order.deliveryAddress}</p>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Items</p>
                    <div className="flex flex-wrap gap-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="bg-[#fafaf9] border border-[#f3f4f6] px-2.5 py-1 text-[11px] text-gray-700 font-light">
                          {item.quantity}× {item.productName} ({item.variant})
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-px bg-[#f3f4f6] border border-[#f3f4f6] text-xs">
                    <div className="bg-white px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Delivery</p>
                      <p className="mt-1 text-sm font-semibold text-[#111827]">{order.deliveryArea}</p>
                      <p className="text-[11px] text-gray-500 font-light">{order.deliveryDate}</p>
                    </div>
                    <div className="bg-white px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Payment</p>
                      <p className="mt-1 text-sm font-semibold text-[#111827]">{order.paymentMethod}</p>
                      <p className={`mt-1.5 inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getPaymentStatusClasses(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </p>
                    </div>
                  </div>

                  {order.paymentMethod !== 'Cash on Delivery' && (
                    <div className="mt-3 border border-[#fed7aa] bg-[#fff7ed]/40 px-3 py-2.5 text-[12px] text-gray-700 font-light">
                      <p><span className="font-semibold text-[#111827]">Sender:</span> {order.paymentSenderPhone || 'Not submitted'}</p>
                      <p className="mt-1"><span className="font-semibold text-[#111827]">Txn ID:</span> {order.paymentTransactionId || 'Not submitted'}</p>
                      <p className="mt-1"><span className="font-semibold text-[#111827]">Confirmation:</span> {formatCurrency(order.paymentConfirmationAmount ?? 0)}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#f3f4f6] flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Total</p>
                      <p className="mt-0.5 text-xl font-bold tracking-tight text-[#111827]">{formatCurrency(order.total)}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="max-w-[180px] border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#f97316]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value as PaymentStatus)}
                        className="max-w-[180px] border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#f97316]"
                      >
                        <option value="Not Required">Not Required</option>
                        <option value="Awaiting Verification">Awaiting Verification</option>
                        <option value="Received">Received</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div className="border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
                <p className="text-base font-semibold text-[#111827]">No orders found</p>
                <p className="mt-2 text-sm text-gray-500 font-light">Try a different search, status, or date filter.</p>
              </div>
            )}
            {orderTotalCount > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#f3f4f6] pt-5">
                <p className="text-xs text-gray-500 font-light">
                  Showing {(orderPage - 1) * ORDERS_PAGE_SIZE + 1}-{Math.min(orderPage * ORDERS_PAGE_SIZE, orderTotalCount)} of {orderTotalCount} orders
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={orderPage <= 1}
                    onClick={() => setOrderPage((current) => Math.max(1, current - 1))}
                    className="border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#fafaf9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-gray-500 px-2">Page {orderPage} / {orderTotalPages}</span>
                  <button
                    type="button"
                    disabled={orderPage >= orderTotalPages}
                    onClick={() => setOrderPage((current) => Math.min(orderTotalPages, current + 1))}
                    className="border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#fafaf9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Suspense fallback={<div className="border border-[#f3f4f6] bg-white px-6 py-10 text-center text-sm text-gray-500 font-light">Loading settings...</div>}>
              <AdminSettingsPanel
                promoStories={settingsForm.promoStories}
                savedMessage={settingsSavedMessage}
                onPromoStoryChange={handlePromoStoryChange}
                onAddPromoStory={handleAddPromoStory}
                onRemovePromoStory={handleRemovePromoStory}
                onReset={handleResetSettings}
                onSubmit={handleSaveSettings}
                reviews={reviews}
                onAddReview={handleAddReview}
                onDeleteReview={handleDeleteReview}
                onToggleReviewFeatured={handleToggleReviewFeatured}
                reviewsSavedMessage={reviewsSavedMessage}
              />
            </Suspense>

            <Suspense fallback={<div className="rounded-3xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">Loading security...</div>}>
              <AdminChangePasswordPanel
                email={user?.email ?? adminEmail}
                disabled={isLocalDevBypass}
                disabledMessage="Password change is disabled in local test admin mode. Sign in with a real Supabase admin account to update your password."
                onAfterSuccess={() => navigate('/admin')}
              />
            </Suspense>
          </div>
        )}
        </div>
      </main>

      {/* Product Modal */}
      {isProductModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-md border border-[#f3f4f6] bg-white p-8 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#f3f4f6] border-t-[#f97316]" />
              <p className="mt-4 text-sm font-semibold text-[#111827]">Loading product form...</p>
            </div>
          </div>
        }>
          <AdminProductModal
            editingProduct={editingProduct}
            productForm={productForm}
            productOrigins={PRODUCT_ORIGINS}
            productImagesInputRef={productImagesInputRef}
            isSubmitting={isSavingProduct}
            submitError={productSubmitError}
            onClose={resetProductModal}
            onSubmit={handleSaveProduct}
                onChange={setProductForm}
                onVariantChange={handleVariantChange}
                onAddVariant={handleAddVariant}
                onAddPackageVariant={handleAddPackageVariant}
                onRemoveVariant={handleRemoveVariant}
                onProductImageUpload={handleProductImageUpload}
                onPrimaryImageSelect={handlePrimaryImageSelect}
            onRemoveProductImage={handleRemoveProductImage}
          />
        </Suspense>
        )}
    </div>

      {/* Mobile Notification Dropdown (full-width panel under header) */}
      {showNotifPanel && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setShowNotifPanel(false)}>
          <div
            className="absolute top-[120px] left-4 right-4 bg-white border border-[#f3f4f6] shadow-lg overflow-hidden max-h-[60vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f4f6]">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Notifications</span>
              <div className="flex items-center gap-3">
                {orderNotifications.some((n) => !n.seen) && (
                  <button
                    onClick={() => setOrderNotifications((prev) => prev.map((n) => ({ ...n, seen: true })))}
                    className="flex items-center gap-1 text-[10px] font-medium text-[#f97316] hover:text-[#ea580c] transition-colors"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
                <button onClick={() => setShowNotifPanel(false)} className="text-gray-400 hover:text-[#111827] transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {orderNotifications.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-400 font-light">No new orders yet</div>
              ) : (
                orderNotifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setOrderNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, seen: true } : item));
                      setActiveTab('orders');
                      setShowNotifPanel(false);
                    }}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-[#f3f4f6] hover:bg-[#fafaf9] transition-colors ${!n.seen ? 'bg-[#fff7ed]/40' : ''}`}
                  >
                    {!n.seen ? <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#f97316]" /> : <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-transparent" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">{n.customerName}</p>
                      <p className="text-xs text-gray-500 font-light">৳{n.amount.toLocaleString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <ArrowRight size={12} className="text-gray-300 shrink-0 mt-1" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Order Toast */}
      {toastNotif && (
        <div className="fixed bottom-6 right-6 z-[200] animate-slide-up">
          <div className="flex items-start gap-3 bg-white border border-[#f3f4f6] shadow-lg p-4 max-w-sm">
            <div className="shrink-0 w-9 h-9 bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center text-[#f97316]">
              <ShoppingBag size={16} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f97316] mb-0.5">New Order</p>
              <p className="text-sm font-semibold truncate text-[#111827]">{toastNotif.customerName}</p>
              <p className="text-xs text-gray-500 font-light">৳{toastNotif.amount.toLocaleString()} · Just now</p>
              <button
                onClick={() => { setActiveTab('orders'); setToastNotif(null); }}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#111827] hover:text-[#f97316] transition-colors"
              >
                View Order <ArrowRight size={12} />
              </button>
            </div>
            <button
              onClick={() => setToastNotif(null)}
              className="shrink-0 text-gray-300 hover:text-[#111827] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
