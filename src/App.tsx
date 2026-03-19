import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ProductListing } from './pages/ProductListing';
import { ProductDetail } from './pages/ProductDetail';
import { CartPage } from './pages/CartPage';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Account } from './pages/Account';
import { AdminDashboard } from './pages/AdminDashboard';
import { InfoPage } from './pages/InfoPage';
import { WhatsAppWidget } from './components/WhatsAppWidget';

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <>
        <Routes location={location}>
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
        </Routes>
      </>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <>
            <AppRoutes />
            <WhatsAppWidget />
          </>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
