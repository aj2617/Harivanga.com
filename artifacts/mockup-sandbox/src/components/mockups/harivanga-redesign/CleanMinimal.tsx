import React from "react";
import { Search, ShoppingBag, User, ArrowRight, Menu } from "lucide-react";

export function CleanMinimal() {
  return (
    <div className="min-h-screen bg-white text-[#111827] font-sans selection:bg-[#f97316] selection:text-white">
      {/* 1. Announcement Bar */}
      <div className="bg-[#fafaf9] py-2.5 text-center text-sm font-medium tracking-wide">
        <span className="text-[#111827]">Free delivery on orders </span>
        <span className="text-[#f97316]">৳1000+</span>
      </div>

      {/* 2. Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#f3f4f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6 md:hidden">
            <button className="p-2 -ml-2 text-gray-900 hover:text-[#f97316] transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#" className="hover:text-[#f97316] transition-colors">Shop</a>
            <a href="#" className="hover:text-[#f97316] transition-colors">Our Story</a>
            <a href="#" className="hover:text-[#f97316] transition-colors">Quality</a>
          </nav>

          <a href="#" className="text-2xl font-bold tracking-tight absolute left-1/2 -translate-x-1/2">
            HARIVANGA
          </a>

          <div className="flex items-center gap-4 sm:gap-6">
            <button className="text-gray-900 hover:text-[#f97316] transition-colors hidden sm:block">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-gray-900 hover:text-[#f97316] transition-colors hidden sm:block">
              <User className="w-5 h-5" />
            </button>
            <button className="text-gray-900 hover:text-[#f97316] transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#f97316] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                2
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col items-center text-center">
        <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-6 max-w-4xl">
          The Finest <span className="relative inline-block">
            Mangoes.
            <div className="absolute -bottom-2 left-0 w-full h-1.5 bg-[#f97316] opacity-80"></div>
          </span> Delivered.
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl font-light leading-relaxed">
          Hand-picked, tree-ripened, and chemical-free Harivanga mangoes directly from Rangpur, Bangladesh. Experience luxury in every bite.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button className="bg-[#f97316] text-white px-8 py-4 text-sm font-semibold tracking-wide hover:bg-[#ea580c] transition-colors w-full sm:w-auto">
            Shop the Harvest
          </button>
          <button className="bg-white text-[#111827] border border-[#111827] px-8 py-4 text-sm font-semibold tracking-wide hover:bg-gray-50 transition-colors w-full sm:w-auto">
            Explore Varieties
          </button>
        </div>
        
        <div className="mt-20 w-full max-w-5xl rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]">
          <img 
            src="/__mockup/images/clean-minimal-hero.png" 
            alt="Premium Harivanga Mango" 
            className="w-full h-auto object-cover aspect-[21/9]"
          />
        </div>
      </section>

      {/* 4. Stats Bar */}
      <section className="border-y border-[#f3f4f6] bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-[#e5e7eb]">
            <div className="text-center px-4">
              <p className="text-4xl font-bold mb-2">10k+</p>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Customers</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-bold mb-2">100%</p>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Chemical Free</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-bold mb-2">48h</p>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Delivery</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-bold mb-2">5</p>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Varieties</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-3xl font-bold tracking-tight">New Arrivals</h2>
          <a href="#" className="text-sm font-medium hover:text-[#f97316] transition-colors flex items-center gap-1 group">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {/* Product 1 */}
          <div className="group cursor-pointer">
            <div className="bg-[#fafaf9] mb-4 overflow-hidden relative aspect-[4/5]">
              <img src="/__mockup/images/clean-minimal-product-1.png" alt="Premium Harivanga" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            </div>
            <h3 className="font-medium text-lg mb-1">Premium Harivanga</h3>
            <p className="text-sm text-gray-500 mb-2">5kg Box • Medium Size</p>
            <p className="font-semibold text-[#f97316]">৳1,250</p>
          </div>
          
          {/* Product 2 */}
          <div className="group cursor-pointer">
            <div className="bg-[#fafaf9] mb-4 overflow-hidden relative aspect-[4/5]">
              <img src="/__mockup/images/clean-minimal-product-2.png" alt="Family Pack Harivanga" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            </div>
            <h3 className="font-medium text-lg mb-1">Family Pack Harivanga</h3>
            <p className="text-sm text-gray-500 mb-2">10kg Box • Large Size</p>
            <p className="font-semibold text-[#f97316]">৳2,400</p>
          </div>

          {/* Product 3 */}
          <div className="group cursor-pointer">
            <div className="bg-[#fafaf9] mb-4 overflow-hidden relative aspect-[4/5]">
              <img src="/__mockup/images/clean-minimal-product-1.png" alt="Export Quality Harivanga" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            </div>
            <h3 className="font-medium text-lg mb-1">Export Quality Harivanga</h3>
            <p className="text-sm text-gray-500 mb-2">5kg Box • Premium Large</p>
            <p className="font-semibold text-[#f97316]">৳1,600</p>
          </div>

          {/* Product 4 */}
          <div className="group cursor-pointer">
            <div className="bg-[#fafaf9] mb-4 overflow-hidden relative aspect-[4/5]">
              <img src="/__mockup/images/clean-minimal-product-2.png" alt="Mixed Mango Box" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            </div>
            <h3 className="font-medium text-lg mb-1">Mixed Mango Box</h3>
            <p className="text-sm text-gray-500 mb-2">10kg Box • 3 Varieties</p>
            <p className="font-semibold text-[#f97316]">৳2,800</p>
          </div>
        </div>
      </section>

      {/* 6. Brand Story */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[3/4] overflow-hidden">
              <img src="/__mockup/images/clean-minimal-story.png" alt="Mango Orchard" className="w-full h-full object-cover" />
            </div>
            <div className="max-w-lg">
              <h2 className="text-4xl font-bold tracking-tight mb-6">From Our Roots to Your Table</h2>
              <p className="text-gray-500 text-lg font-light leading-relaxed mb-8">
                In the heart of Rangpur, our orchards have been cultivating the perfect Harivanga mango for generations. We believe in patience over pesticides, letting nature take its course to produce the sweetest, most authentic flavor possible.
              </p>
              <button className="text-sm font-semibold tracking-wide border-b border-[#111827] pb-1 hover:text-[#f97316] hover:border-[#f97316] transition-colors inline-flex items-center gap-2 group">
                Read Our Story <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Newsletter */}
      <section className="bg-[#fff7ed] py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Join the Harvest Club</h2>
          <p className="text-gray-600 mb-8 font-light text-lg">Subscribe to receive updates on harvest seasons, exclusive offers, and mango recipes.</p>
          <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#f97316] transition-colors"
              required
            />
            <button 
              type="submit" 
              className="bg-[#111827] text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-white border-t border-[#f3f4f6] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-sm">
            <div className="md:col-span-1">
              <a href="#" className="text-2xl font-bold tracking-tight mb-6 block">
                HARIVANGA
              </a>
              <p className="text-gray-500 font-light leading-relaxed max-w-xs">
                Premium, chemical-free mangoes from Rangpur, Bangladesh. Delivered fresh to your door.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-5 tracking-wide">Shop</h3>
              <ul className="space-y-4 text-gray-500 font-light">
                <li><a href="#" className="hover:text-[#f97316] transition-colors">All Mangoes</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Gift Boxes</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Corporate Orders</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Track Order</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-5 tracking-wide">About</h3>
              <ul className="space-y-4 text-gray-500 font-light">
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Quality Promise</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">The Orchard</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Sustainability</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-5 tracking-wide">Support</h3>
              <ul className="space-y-4 text-gray-500 font-light">
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Shipping & Returns</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#f3f4f6] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-light">
            <p>&copy; {new Date().getFullYear()} Harivanga. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
