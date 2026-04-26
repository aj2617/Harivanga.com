import React from 'react';
import { ShoppingCart, Search, Leaf, Truck, ShieldCheck, Sun, Star, ArrowRight, Facebook, Twitter, Instagram } from 'lucide-react';

export function PremiumDark() {
  return (
    <div className="min-h-screen bg-[#0f0c07] text-[#fcf9f2] font-sans selection:bg-[#e8922a] selection:text-white">
      {/* Announcement Bar */}
      <div className="bg-[#1a1408] text-[#e8922a] text-center py-2 text-sm font-medium tracking-wide border-b border-[#2a2212]">
        Season 2026 — Free delivery on orders over ৳1000
      </div>

      {/* Navbar */}
      <nav className="px-6 py-4 md:px-12 flex justify-between items-center bg-[#0f0c07]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#2a2212]">
        <div className="flex items-center gap-8">
          <a href="#" className="text-2xl font-['Playfair_Display'] font-bold text-[#f5c842] tracking-wider">
            Harivanga
          </a>
          <div className="hidden md:flex gap-6 text-sm text-gray-300">
            <a href="#" className="hover:text-[#f5c842] transition-colors">Home</a>
            <a href="#" className="hover:text-[#f5c842] transition-colors">Shop Mangoes</a>
            <a href="#" className="hover:text-[#f5c842] transition-colors">Our Story</a>
          </div>
        </div>
        <div className="flex items-center gap-6 text-[#f5c842]">
          <button className="hover:opacity-80 transition-opacity">
            <Search size={20} />
          </button>
          <button className="hover:opacity-80 transition-opacity relative">
            <ShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 bg-[#e8922a] text-[#0f0c07] text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              0
            </span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 md:px-12 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#e8922a]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="flex-1 space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e8922a]/30 bg-[#e8922a]/10 text-[#e8922a] text-sm">
            <Star size={14} className="fill-[#e8922a]" />
            <span>Premium Export Quality</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-5xl md:text-7xl font-bold leading-tight">
            Premium Harivanga <br />
            <span className="text-[#f5c842]">Mangoes</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
            Tree-ripened, chemical-free, and hand-picked directly from the finest orchards of Rangpur, Bangladesh. Experience the true taste of luxury.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button className="bg-[#e8922a] hover:bg-[#d48123] text-[#0f0c07] px-8 py-4 rounded-none font-bold tracking-wide flex items-center justify-center gap-2 transition-colors">
              Shop Now <ArrowRight size={18} />
            </button>
            <button className="border border-[#e8922a]/50 hover:bg-[#e8922a]/10 text-[#f5c842] px-8 py-4 rounded-none font-bold tracking-wide transition-colors">
              Our Farming Process
            </button>
          </div>
        </div>
        
        <div className="flex-1 w-full z-10">
          <div className="relative aspect-[4/5] md:aspect-square w-full max-w-lg mx-auto overflow-hidden">
            {/* Elegant Gradient Placeholder for Mango */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#f5c842] via-[#e8922a] to-[#8a4e10] rounded-t-full shadow-[0_0_50px_rgba(232,146,42,0.15)] opacity-80 mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
            
            {/* Decorative frame */}
            <div className="absolute inset-4 border border-[#f5c842]/20 rounded-t-full rounded-b-lg pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="px-6 md:px-12 py-12 bg-[#1a1408] border-y border-[#2a2212]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {[
            { icon: Sun, title: "100% Fresh", desc: "Harvested daily" },
            { icon: Truck, title: "Fast Delivery", desc: "Nationwide shipping" },
            { icon: ShieldCheck, title: "Pesticide Free", desc: "Naturally grown" },
            { icon: Leaf, title: "Farm to Table", desc: "Direct from Rangpur" },
          ].map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#0f0c07] border border-[#2a2212] flex items-center justify-center text-[#f5c842]">
                <feature.icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="font-['Playfair_Display'] text-lg font-semibold">{feature.title}</h3>
              <p className="text-xs text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="px-6 md:px-12 py-24 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold mb-4">Artisan Selection</h2>
            <p className="text-gray-400">Our most prized harvests of the season.</p>
          </div>
          <a href="#" className="hidden md:flex items-center gap-2 text-[#e8922a] hover:text-[#f5c842] transition-colors pb-2 border-b border-[#e8922a]/30">
            View All Harvests <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "Premium Harivanga", weight: "5 kg Box", price: "৳ 850", tag: "Best Seller" },
            { name: "Special Langra", weight: "10 kg Box", price: "৳ 1,600", tag: "Limited" },
            { name: "Export Himsagar", weight: "5 kg Box", price: "৳ 900", tag: "" },
            { name: "Mixed Heritage Box", weight: "8 kg Box", price: "৳ 1,450", tag: "Curated" },
          ].map((product, idx) => (
            <div key={idx} className="group relative bg-[#1a1408]/50 backdrop-blur-sm border border-[#2a2212] hover:border-[#e8922a]/50 transition-all duration-300 overflow-hidden">
              {product.tag && (
                <div className="absolute top-4 left-4 z-10 bg-[#e8922a] text-[#0f0c07] text-xs font-bold px-2 py-1 uppercase tracking-wider">
                  {product.tag}
                </div>
              )}
              <div className="aspect-[4/5] bg-[#0f0c07] relative overflow-hidden flex items-center justify-center p-8">
                {/* Product image placeholder */}
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#8a4e10] to-[#f5c842] opacity-40 group-hover:scale-105 transition-transform duration-700 blur-xl" />
                <div className="absolute inset-0 flex items-center justify-center text-[#e8922a]/20">
                  <Leaf size={64} />
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-2">{product.weight}</p>
                <h3 className="font-['Playfair_Display'] text-xl font-bold mb-4 group-hover:text-[#f5c842] transition-colors">
                  {product.name}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-[#e8922a] font-bold text-lg">{product.price}</span>
                  <button className="w-10 h-10 rounded-full border border-[#2a2212] flex items-center justify-center hover:bg-[#e8922a] hover:text-[#0f0c07] hover:border-[#e8922a] transition-all">
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="px-6 md:px-12 py-24 bg-[#120f09]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold">The Harivanga Difference</h2>
            <p className="text-gray-400 text-lg">
              We don't just sell mangoes; we curate an experience. Every fruit is a testament to the rich soil of Rangpur and our dedication to natural farming.
            </p>
            
            <div className="space-y-6 pt-4">
              {[
                { num: "01", title: "Hand-Picked Perfection", desc: "Every mango is selected at the precise moment of ripeness by master farmers." },
                { num: "02", title: "Zero Chemicals", desc: "We rely on traditional farming methods. No artificial ripeners, ever." },
                { num: "03", title: "Orchard to Doorstep", desc: "Harvested in the morning, shipped by evening. Unmatched freshness." },
              ].map((step, idx) => (
                <div key={idx} className="flex gap-6 items-start">
                  <span className="font-['Playfair_Display'] text-2xl text-[#e8922a]/50 font-bold">{step.num}</span>
                  <div>
                    <h4 className="text-lg font-bold mb-2">{step.title}</h4>
                    <p className="text-gray-500 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="aspect-[3/4] bg-[#1a1408] border border-[#2a2212] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c07] to-transparent z-10" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                {/* Abstract visual for why choose us */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[conic-gradient(from_90deg_at_50%_50%,#0f0c07_0%,#e8922a_50%,#0f0c07_100%)] opacity-10 animate-spin-slow" style={{ animationDuration: '20s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f0c07] border-t border-[#2a2212] pt-20 pb-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <a href="#" className="text-3xl font-['Playfair_Display'] font-bold text-[#f5c842] tracking-wider mb-6 block">
              Harivanga.com
            </a>
            <p className="text-gray-500 max-w-sm mb-8">
              Bringing the authentic taste of Rangpur's finest mangoes directly to your table. Premium quality, guaranteed.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-[#2a2212] flex items-center justify-center text-gray-400 hover:text-[#f5c842] hover:border-[#f5c842] transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-[#2a2212] flex items-center justify-center text-gray-400 hover:text-[#f5c842] hover:border-[#f5c842] transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-[#2a2212] flex items-center justify-center text-gray-400 hover:text-[#f5c842] hover:border-[#f5c842] transition-colors">
                <Instagram size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-['Playfair_Display'] text-lg font-bold mb-6 text-white">Shop</h4>
            <ul className="space-y-4 text-gray-500 text-sm">
              <li><a href="#" className="hover:text-[#e8922a] transition-colors">All Mangoes</a></li>
              <li><a href="#" className="hover:text-[#e8922a] transition-colors">Corporate Orders</a></li>
              <li><a href="#" className="hover:text-[#e8922a] transition-colors">Track Order</a></li>
              <li><a href="#" className="hover:text-[#e8922a] transition-colors">Return Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-['Playfair_Display'] text-lg font-bold mb-6 text-white">Contact</h4>
            <ul className="space-y-4 text-gray-500 text-sm">
              <li>Mithapukur, Rangpur</li>
              <li>Bangladesh</li>
              <li><a href="mailto:hello@harivanga.com" className="hover:text-[#e8922a] transition-colors">hello@harivanga.com</a></li>
              <li><a href="tel:+8801700000000" className="hover:text-[#e8922a] transition-colors">+880 1700 000 000</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-[#2a2212] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} Harivanga.com. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
