import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin, ArrowUpRight, Leaf } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0f0c07] text-white [content-visibility:auto] [contain-intrinsic-size:1px_640px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-12 pb-8 sm:pt-16 sm:pb-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-4 space-y-4 sm:space-y-5">
            <BrandLogo size="md" dark={false} />
            <p className="text-sm leading-relaxed text-white/55 max-w-xs">
              Straight from Podaganj&apos;s legendary red-soil farms — tree-ripened, chemical-free Harivanga mangoes delivered fresh to your door.
            </p>
            <div className="flex gap-3 pt-1">
              <a
                href="https://www.facebook.com/Jimbabu123"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:bg-mango-orange hover:text-white hover:border-mango-orange transition-all"
              >
                <Facebook size={15} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:bg-mango-orange hover:text-white hover:border-mango-orange transition-all"
              >
                <Instagram size={15} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:bg-mango-orange hover:text-white hover:border-mango-orange transition-all"
              >
                <Twitter size={15} />
              </a>
            </div>
          </div>

          {/* Mobile: 2-column layout for Shop / Support / Contact */}
          <div className="md:hidden grid grid-cols-2 gap-x-6 gap-y-8">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3">Shop</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><Link to="/products" className="hover:text-white transition-colors">Mangoes</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
                <li><Link to="/account" className="hover:text-white transition-colors">Track Order</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3">Support</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
                <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping</Link></li>
                <li><Link to="/returns" className="hover:text-white transition-colors">Returns</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
            <div className="col-span-2">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3">Contact</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li className="flex items-start gap-2.5">
                  <MapPin size={14} className="text-mango-orange shrink-0 mt-0.5" />
                  <span>Podagonj, Mithapukur, Rangpur, Bangladesh</span>
                </li>
                <li>
                  <a
                    href="https://wa.me/8801342262821"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 hover:text-white transition-colors"
                  >
                    <Phone size={14} className="text-mango-orange shrink-0" />
                    <span>01342262821 (WhatsApp)</span>
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail size={14} className="text-mango-orange shrink-0" />
                  <span>hello@harivanga.com</span>
                </li>
              </ul>

              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <Leaf size={14} className="text-green-400 shrink-0" />
                <span className="text-xs text-white/50">100% Chemical-Free · Pesticide-Free Farming</span>
              </div>
            </div>
          </div>

          {/* Desktop: original layout */}
          <div className="hidden md:block md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-5">Shop</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link to="/products" className="hover:text-white transition-colors inline-flex items-center gap-1 group">Mangoes <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors inline-flex items-center gap-1 group">Our Story <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
              <li><Link to="/account" className="hover:text-white transition-colors inline-flex items-center gap-1 group">Track Order <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
            </ul>
          </div>

          <div className="hidden md:block md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-5">Support</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="hidden md:block md:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-5">Contact</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-mango-orange shrink-0 mt-0.5" />
                <span>Podagonj, Mithapukur, Rangpur, Bangladesh</span>
              </li>
              <li>
                <a
                  href="https://wa.me/8801342262821"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 hover:text-white transition-colors"
                >
                  <Phone size={15} className="text-mango-orange shrink-0" />
                  <span>01342262821 (WhatsApp)</span>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-mango-orange shrink-0" />
                <span>hello@harivanga.com</span>
              </li>
            </ul>

            <div className="mt-8 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <Leaf size={14} className="text-green-400 shrink-0" />
              <span className="text-xs text-white/50">100% Chemical-Free · Pesticide-Free Farming</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/30 text-xs">
          <p>&copy; 2026 Harivanga.com · All rights reserved.</p>
          <p>Crafted for mango lovers across Bangladesh</p>
        </div>
      </div>
    </footer>
  );
};
