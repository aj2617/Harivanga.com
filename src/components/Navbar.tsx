import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, Search, Home, ShoppingBag, Sparkles, Package, Phone, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

export const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    const { signOutUser } = await import('../supabase');
    await signOutUser();
    navigate('/');
  };

  const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
      isActive
        ? 'bg-mango-orange text-white shadow-md shadow-mango-orange/25'
        : 'text-[#3d2e1e] hover:text-mango-orange hover:bg-orange-50'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative group flex items-center gap-3.5 pl-4 pr-3 py-3 text-[15px] font-semibold rounded-xl transition-all ${
      isActive
        ? 'bg-orange-50 text-mango-orange'
        : 'text-[#3d2e1e] hover:bg-gray-50'
    }`;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_32px_rgba(0,0,0,0.08)] border-b border-black/5'
          : 'bg-white/90 backdrop-blur-lg border-b border-black/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="shrink-0 flex items-center gap-2 group">
            <BrandLogo size="md" />
          </Link>

          <div className="hidden md:flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50/80 px-2 py-1.5">
            <NavLink to="/" end className={desktopNavLinkClass}>Home</NavLink>
            <NavLink to="/products" className={desktopNavLinkClass}>Shop Mangoes</NavLink>
            <NavLink to="/about" className={desktopNavLinkClass}>Our Story</NavLink>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/account"
              className="p-2.5 text-[#3d2e1e] hover:text-mango-orange hover:bg-orange-50 rounded-full transition-all"
              title="Track Order"
            >
              <User size={20} />
            </Link>
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2.5 text-[#3d2e1e] hover:text-mango-orange hover:bg-orange-50 rounded-full transition-all"
              title="Cart"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-mango-orange text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md shadow-mango-orange/30 ring-2 ring-white">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
            {user && (
              <button
                onClick={handleLogout}
                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2.5 text-[#3d2e1e] hover:bg-orange-50 rounded-full"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-mango-orange text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-white">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 text-[#3d2e1e] hover:bg-orange-50 rounded-full transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      <div
        className="mobile-menu-panel md:hidden bg-white border-t border-gray-100"
        data-open={isMenuOpen}
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-menu-panel-inner">
          <div className="px-4 pt-4 pb-5">
            <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Menu</p>
            <div className="space-y-0.5">
              <NavLink to="/" end onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>
                {({ isActive }) => (
                  <>
                    <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${isActive ? 'bg-mango-orange text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-mango-orange'} transition-colors`}>
                      <Home size={16} />
                    </span>
                    <span className="flex-1">Home</span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400" />
                  </>
                )}
              </NavLink>
              <NavLink to="/products" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>
                {({ isActive }) => (
                  <>
                    <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${isActive ? 'bg-mango-orange text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-mango-orange'} transition-colors`}>
                      <ShoppingBag size={16} />
                    </span>
                    <span className="flex-1">Shop Mangoes</span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400" />
                  </>
                )}
              </NavLink>
              <NavLink to="/about" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>
                {({ isActive }) => (
                  <>
                    <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${isActive ? 'bg-mango-orange text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-mango-orange'} transition-colors`}>
                      <Sparkles size={16} />
                    </span>
                    <span className="flex-1">Our Story</span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400" />
                  </>
                )}
              </NavLink>
              <NavLink to="/account" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>
                {({ isActive }) => (
                  <>
                    <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${isActive ? 'bg-mango-orange text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-mango-orange'} transition-colors`}>
                      <Package size={16} />
                    </span>
                    <span className="flex-1">Track Order</span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400" />
                  </>
                )}
              </NavLink>
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full group flex items-center gap-3.5 pl-4 pr-3 py-3 text-[15px] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
                    <LogOut size={16} />
                  </span>
                  <span className="flex-1 text-left">Logout</span>
                </button>
              )}
            </div>

            <a
              href="https://wa.me/8801342262821"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] border border-orange-100 px-4 py-3.5 active:scale-[0.99] transition-transform"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-mango-orange text-white shrink-0">
                <Phone size={17} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-mango-orange">Need Help?</span>
                <span className="block text-sm font-semibold text-[#3d2e1e] truncate">Chat on WhatsApp</span>
              </span>
              <ChevronRight size={18} className="text-mango-orange shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};
