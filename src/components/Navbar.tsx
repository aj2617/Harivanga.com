import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, Search } from 'lucide-react';
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
    `flex items-center px-4 py-3.5 text-base font-semibold rounded-xl transition-colors ${
      isActive
        ? 'bg-mango-orange text-white'
        : 'text-[#3d2e1e] hover:bg-orange-50 hover:text-mango-orange'
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
          <div className="px-4 pt-3 pb-5 space-y-1">
            <NavLink to="/" end onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>Home</NavLink>
            <NavLink to="/products" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>Shop Mangoes</NavLink>
            <NavLink to="/about" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>Our Story</NavLink>
            <NavLink to="/account" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>Track Order</NavLink>
            {user && (
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2 px-4 py-3.5 text-base font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
