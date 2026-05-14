import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Leaf, Package } from 'lucide-react';
import { ProductCard } from '../features/products/components/ProductCard';
import { useProducts } from '../features/products/hooks/useProducts';

export const ProductListing: React.FC = () => {
  const { products: allProducts, loading } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('All');
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const products = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.variety.toLowerCase().includes(normalizedSearch);
      const matchesVariety = selectedVariety === 'All' || product.variety === selectedVariety;
      return matchesSearch && matchesVariety;
    });
  }, [allProducts, normalizedSearch, selectedVariety]);

  const varieties = useMemo(
    () => ['All', ...Array.from(new Set(allProducts.map((product) => product.variety)))],
    [allProducts]
  );

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-mango-orange text-xs font-bold uppercase tracking-widest mb-3">
                <Leaf size={13} />
                Season 2026 · Fresh Harvest
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#1a1200] tracking-tight">Shop Fresh Mangoes</h1>
              <p className="mt-2 text-sm text-gray-500 max-w-lg">
                Authentic Harivanga and premium mango varieties from Podagonj, Mithapukur, Rangpur — delivered to your door.
              </p>
            </div>

            <div className="flex w-full items-center gap-3 md:w-auto">
              <div className="relative flex-1 md:w-72 md:flex-none">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Search mango variety..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/15 transition-all"
                />
              </div>
              <div className="relative shrink-0 w-36">
                <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <select
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/15 transition-all"
                >
                  {varieties.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!loading && (
            <div className="mt-6 flex flex-wrap gap-2">
              {varieties.map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedVariety(v)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    selectedVariety === v
                      ? 'bg-mango-orange text-white shadow-md shadow-mango-orange/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-mango-orange'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
                <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                  <div className="h-8 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <p className="text-sm text-gray-400 mb-6">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="fade-up-enter"
                  style={{ animationDelay: `${Math.min(index, 7) * 70}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-28">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5 text-gray-300">
              <Package size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No mangoes found</h3>
            <p className="text-gray-400 text-sm">Try a different search or filter.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedVariety('All'); }}
              className="mt-6 px-6 py-2.5 bg-mango-orange text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
