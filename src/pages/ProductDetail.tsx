import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Star,
  MapPin,
  Truck,
  ShieldCheck,
  Leaf,
  MessageCircle,
  ChevronRight,
  Minus,
  Plus,
  Zap,
  Check,
  ArrowLeft,
  Award,
  Sprout,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getCachedStorefrontProducts, useProducts } from '../features/products/hooks/useProducts';
import { fetchStorefrontProductById } from '../lib/publicProducts';
import { hasSupabaseConfig } from '../lib/env';
import { formatCurrency } from '../lib/format';
import { Product } from '../types';
import { getDisplayImageSrc, getThumbnailImageSrc } from '../lib/imageSources';
import { getLocalDevProducts } from '../lib/localDevProducts';
import { ProductCard } from '../features/products/components/ProductCard';

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, replaceCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants[0] || null);
  const [selectedImage, setSelectedImage] = useState(product?.image || product?.images?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { products: allProducts } = useProducts({ limit: 8 });

  const galleryImages = product
    ? [product.image, ...(product.images ?? []).filter((img) => img !== product.image)]
    : [];

  const relatedProducts = allProducts.filter((p) => p.id !== id).slice(0, 4);

  useEffect(() => {
    let cancelled = false;
    if (!id) { setProduct(null); setProductLoading(false); return; }

    const loadFallback = async () => {
      const local = await getLocalDevProducts();
      if (!cancelled) setProduct(local.find((p) => p.id === id) ?? null);
    };

    const controller = new AbortController();
    const cached = getCachedStorefrontProducts().find((p) => p.id === id);
    if (cached) { setProduct(cached); setProductLoading(false); }
    else setProductLoading(true);

    const load = async () => {
      if (!hasSupabaseConfig) { await loadFallback(); if (!cancelled) setProductLoading(false); return; }
      try {
        const fetched = await fetchStorefrontProductById(id, controller.signal);
        if (fetched) { if (!cancelled) setProduct(fetched); return; }
        await loadFallback();
      } catch (e) {
        if (!controller.signal.aborted && !cancelled) await loadFallback();
      } finally {
        if (!controller.signal.aborted && !cancelled) setProductLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [id]);

  useEffect(() => {
    setSelectedVariant(product?.variants[0] || null);
    setSelectedImage(product?.image || product?.images?.[0] || '');
  }, [product]);

  if (productLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-3 border-mango-orange border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading product…</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
          <ShoppingCart size={28} />
        </div>
        <h2 className="text-2xl font-black text-[#1a1200]">Product not found</h2>
        <p className="text-gray-400 text-sm">This mango variety may be out of season.</p>
        <button
          onClick={() => navigate('/products')}
          className="mt-2 flex items-center gap-2 rounded-full bg-mango-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-all"
        >
          <ArrowLeft size={16} /> Browse All Mangoes
        </button>
      </div>
    );
  }

  const totalPrice = (selectedVariant?.price || 0) * quantity;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addToCart({ productId: product.id, productName: product.name, quantity, variant: selectedVariant.weight, price: selectedVariant.price, image: product.image });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
  };

  const handleBuyNow = () => {
    if (!selectedVariant || !product.isAvailable) return;
    replaceCart([{ productId: product.id, productName: product.name, quantity, variant: selectedVariant.weight, price: selectedVariant.price, image: product.image }]);
    navigate('/checkout');
  };

  const handleWhatsApp = () => {
    const msg = `Hello! I'd like to order ${quantity} x ${product.name} (${selectedVariant?.weight}). Total: ${formatCurrency(totalPrice)}`;
    window.open(`https://wa.me/8801342262821?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Link to="/" className="hover:text-mango-orange transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link to="/products" className="hover:text-mango-orange transition-colors">Shop</Link>
            <ChevronRight size={12} />
            <span className="text-[#1a1200] font-semibold">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ── Left: Image Gallery ── */}
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm aspect-square group">
              <img
                src={getDisplayImageSrc(selectedImage || product.image)}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                fetchPriority="high"
                decoding="async"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="bg-mango-orange text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {product.variety}
                </span>
                <span className="bg-white text-[#1a1200] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1">
                  <MapPin size={9} /> {product.origin}
                </span>
              </div>
              {!product.isAvailable && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white text-[#1a1200] font-black px-5 py-2.5 rounded-full text-sm uppercase tracking-widest">Out of Season</span>
                </div>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {galleryImages.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    onClick={() => setSelectedImage(img)}
                    className={`overflow-hidden rounded-2xl border-2 transition-all aspect-square ${
                      img === (selectedImage || product.image)
                        ? 'border-mango-orange shadow-lg shadow-mango-orange/20 scale-105'
                        : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={getThumbnailImageSrc(img)}
                      alt={`${product.name} view ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust badges — desktop only */}
            <div className="hidden lg:grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Leaf, label: 'Naturally Ripened', color: 'text-green-600', bg: 'bg-green-50' },
                { icon: Truck, label: '48h Delivery', color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: ShieldCheck, label: 'Quality Guaranteed', color: 'text-mango-orange', bg: 'bg-orange-50' },
              ].map(({ icon: Icon, label, color, bg }) => (
                <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} ${color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-[11px] font-bold text-center text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Product Info ── */}
          <div className="flex flex-col">
            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-bold text-[#1a1200]">4.9</span>
              <span className="text-xs text-gray-400">(200+ reviews)</span>
              {product.stock > 0 && product.stock <= 30 && (
                <span className="ml-auto text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                  Only {product.stock} kg left!
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#1a1200] leading-tight mb-3">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-4xl font-black text-mango-orange">{formatCurrency(selectedVariant?.price || product.pricePerKg)}</span>
              <span className="text-gray-400 text-sm">{selectedVariant ? `/ ${selectedVariant.weight}` : '/ kg'}</span>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed mb-6">{product.description}</p>

            {/* Taste Profile Card */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5 mb-7">
              <div className="flex items-center gap-2 mb-2">
                <Sprout size={14} className="text-mango-orange" />
                <span className="text-xs font-black uppercase tracking-wider text-mango-orange">Taste Profile</span>
              </div>
              <p className="text-sm text-[#1a1200] font-semibold leading-relaxed">{product.tasteProfile}</p>
            </div>

            {/* Variant Selector */}
            <div className="mb-7">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Select Weight / Size</h3>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v.weight}
                    onClick={() => setSelectedVariant(v)}
                    className={`flex flex-col items-center px-4 py-3 rounded-2xl font-bold text-sm transition-all border-2 min-w-[100px] ${
                      selectedVariant?.weight === v.weight
                        ? 'border-mango-orange bg-mango-orange/5 text-mango-orange shadow-md shadow-mango-orange/10'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[13px] font-black">{v.weight}</span>
                    <span className="text-[12px] opacity-70 mt-0.5">{formatCurrency(v.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + CTAs */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-5">
                <span className="text-sm font-bold text-gray-500">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-2xl bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-lg font-black text-[#1a1200]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {selectedVariant && (
                  <span className="ml-auto text-sm font-black text-[#1a1200]">
                    Total: <span className="text-mango-orange">{formatCurrency(totalPrice)}</span>
                  </span>
                )}
              </div>

              <div className="flex gap-3 mb-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all shadow-lg ${
                    addedToCart
                      ? 'bg-green-500 text-white shadow-green-500/20'
                      : 'bg-mango-orange text-white shadow-mango-orange/20 hover:bg-orange-600'
                  } disabled:bg-gray-200 disabled:shadow-none`}
                >
                  {addedToCart ? (
                    <><Check size={18} /> Added to Cart!</>
                  ) : (
                    <><ShoppingCart size={18} /> Add to Cart</>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!product.isAvailable}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black bg-[#1a1200] text-white shadow-lg shadow-black/10 hover:bg-black/80 transition-all disabled:bg-gray-200 disabled:shadow-none"
                >
                  <Zap size={18} /> Buy Now
                </button>
              </div>

              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold bg-[#25D366] text-white hover:bg-[#22c55e] transition-all shadow-md shadow-green-500/20"
              >
                <MessageCircle size={18} /> Order via WhatsApp
              </button>
            </div>

            {/* Info Pills */}
            <div className="flex flex-wrap gap-2 pt-5 border-t border-gray-100">
              {[
                { icon: Leaf, label: 'Chemical Free', color: 'text-green-600 bg-green-50' },
                { icon: Award, label: 'Premium Grade', color: 'text-amber-600 bg-amber-50' },
                { icon: MapPin, label: product.origin, color: 'text-blue-600 bg-blue-50' },
                { icon: Truck, label: '48h Delivery', color: 'text-mango-orange bg-orange-50' },
              ].map(({ icon: Icon, label, color }) => (
                <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${color}`}>
                  <Icon size={11} /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-16 border-t border-gray-100">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-mango-orange font-bold text-xs uppercase tracking-[0.2em]">You May Also Like</span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#1a1200]">Other Varieties</h2>
              </div>
              <Link
                to="/products"
                className="text-sm font-bold text-mango-orange flex items-center gap-1 hover:gap-2 transition-all"
              >
                View All <ChevronRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
