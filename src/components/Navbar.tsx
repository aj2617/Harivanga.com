import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-mango-orange rounded-full flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-mango-dark">Mango<span className="text-mango-orange">BD</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium hover:text-mango-orange transition-colors">Home</Link>
            <Link to="/products" className="text-sm font-medium hover:text-mango-orange transition-colors">Shop Mangoes</Link>
            <Link to="/about" className="text-sm font-medium hover:text-mango-orange transition-colors">Our Story</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-mango-orange/10 text-mango-orange rounded-xl font-bold text-sm hover:bg-mango-orange/20 transition-all">
                <LayoutDashboard size={18} />
                Admin Panel
              </Link>
            )}
            <Link to="/account" className="p-2 hover:bg-mango-yellow/10 rounded-full transition-colors">
              <User size={20} />
            </Link>
            <button onClick={() => navigate('/cart')} className="p-2 hover:bg-mango-yellow/10 rounded-full transition-colors relative">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-mango-orange text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
            {user && (
              <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500">
                <LogOut size={20} />
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => navigate('/cart')} className="p-2 relative">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-mango-orange text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium hover:bg-mango-yellow/10 rounded-md">Home</Link>
              <Link to="/products" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium hover:bg-mango-yellow/10 rounded-md">Shop Mangoes</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium hover:bg-mango-yellow/10 rounded-md">Our Story</Link>
              <Link to="/account" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium hover:bg-mango-yellow/10 rounded-md">My Account</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-mango-orange hover:bg-mango-yellow/10 rounded-md">Admin Dashboard</Link>
              )}
              {user && (
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-base font-medium text-red-500 hover:bg-red-50 rounded-md">Logout</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
