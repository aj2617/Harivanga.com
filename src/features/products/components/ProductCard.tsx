import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Image as ImageIcon, Star } from 'lucide-react';
import { Product } from '../../../types';
import { useCart } from '../../../context/CartContext';
import { formatCurrency } from '../../../lib/format';
import { getThumbnailImageSrc } from '../../../lib/imageSources';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const { addToCart } = useCart();
  const [imageFailed, setImageFailed] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      variant: product.variants[0]?.weight || '1kg',
      price: product.variants[0]?.price || product.pricePerKg,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/8 hover:-translate-y-1.5 transition-all duration-300">
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {imageFailed ? (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-mango-orange">
              <ImageIcon size={22} />
            </div>
            <p className="text-xs font-semibold text-mango-dark">{product.name}</p>
          </div>
        ) : null}
        <img
          src={getThumbnailImageSrc(product.image)}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageFailed ? 'opacity-0' : 'opacity-100'}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          width={320}
          height={240}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          onLoad={() => setImageFailed(false)}
          onError={() => setImageFailed(true)}
        />

        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-white text-mango-dark px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow">
              Out of Season
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center bg-mango-orange text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-mango-orange/30">
            {product.variety}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-bold text-[#1a1200] text-base leading-snug group-hover:text-mango-orange transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={11} className="fill-mango-yellow text-mango-yellow" />
          ))}
          <span className="text-[11px] text-gray-400 ml-1">Premium</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-gray-400 mb-0.5">Starting from</p>
            <p className="text-xl font-black text-mango-dark">
              {formatCurrency(product.pricePerKg)}
              <span className="text-xs font-normal text-gray-400 ml-0.5">/kg</span>
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              added
                ? 'bg-green-500 text-white shadow-green-500/25'
                : 'bg-mango-orange text-white hover:bg-orange-600 shadow-mango-orange/25 hover:shadow-mango-orange/40 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={14} />
            {added ? 'Added!' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
