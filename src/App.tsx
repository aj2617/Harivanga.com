import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

const Layout = lazy(() => import('./components/Layout').then((module) => ({ default: module.Layout })));
const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const ProductListing = lazy(() => import('./pages/ProductListing').then((module) => ({ default: module.ProductListing })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then((module) => ({ default: module.ProductDetail })));
const CartPage = lazy(() => import('./pages/CartPage').then((module) => ({ default: module.CartPage })));
const Checkout = lazy(() => import('./pages/Checkout').then((module) => ({ default: module.Checkout })));
const OrderConfirmation = lazy(() =>
  import('./pages/OrderConfirmation').then((module) => ({ default: module.OrderConfirmation }))
);
const Account = lazy(() => import('./pages/Account').then((module) => ({ default: module.Account })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminResetPassword = lazy(() =>
  import('./pages/AdminResetPassword').then((module) => ({ default: module.AdminResetPassword }))
);
const InfoPage = lazy(() => import('./pages/InfoPage').then((module) => ({ default: module.InfoPage })));
const UnifiedContactWidget = lazy(() =>
  import('./components/UnifiedContactWidget').then((module) => ({ default: module.UnifiedContactWidget }))
);

const AppShellFallback: React.FC = () => (
  <div className="flex min-h-[40vh] items-center justify-center bg-white">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-mango-orange" aria-label="Loading page" />
  </div>
);

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
};

function AppRoutes() {
  return (
    <Suspense fallback={<AppShellFallback />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<ProductListing />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="account" element={<Account />} />
          <Route path="about" element={<InfoPage />} />
          <Route path="contact" element={<InfoPage />} />
          <Route path="shipping" element={<InfoPage />} />
          <Route path="returns" element={<InfoPage />} />
          <Route path="faq" element={<InfoPage />} />
          <Route path="privacy" element={<InfoPage />} />
        </Route>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/reset" element={<AdminResetPassword />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <>
            <ScrollToTop />
            <AppRoutes />
            <Suspense fallback={null}>
              <UnifiedContactWidget />
            </Suspense>
          </>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
