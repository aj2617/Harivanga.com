import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { MOCK_PRODUCTS } from '../data/mockData';
import { motion } from 'motion/react';

export const ProductListing: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('All');

  const varieties = ['All', ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.variety)))];

  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.variety.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVariety = selectedVariety === 'All' || product.variety === selectedVariety;
    return matchesSearch && matchesVariety;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-mango-dark mb-2">Shop Fresh Mangoes</h1>
            <p className="text-gray-500">Discover the finest varieties from Rajshahi's orchards.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search variety..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <select
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                className="appearance-none pl-12 pr-10 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all cursor-pointer"
              >
                {varieties.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No mangoes found</h3>
            <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedVariety('All'); }}
              className="mt-6 text-mango-orange font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
