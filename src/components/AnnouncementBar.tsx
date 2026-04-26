import React from 'react';
import { Facebook, Phone, Truck, Sparkles } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div
      className="text-white text-xs"
      style={{ background: 'linear-gradient(90deg, #1A1A1A 0%, #2d1a00 50%, #1A1A1A 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-white/75">
            <span className="inline-flex items-center gap-1.5 font-medium text-mango-yellow">
              <Sparkles size={12} className="shrink-0" />
              Season 2026 Is Here
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <a
              href="https://wa.me/8801342262821"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone size={12} className="shrink-0" />
              01342262821
            </a>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Truck size={12} className="shrink-0" />
              Delivery within 48 hours
            </span>
          </div>

          <a
            href="https://www.facebook.com/Jimbabu123"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 font-semibold text-white/80 hover:text-mango-yellow transition-colors"
          >
            <Facebook size={13} />
            Follow on Facebook
          </a>
        </div>
      </div>
    </div>
  );
};
