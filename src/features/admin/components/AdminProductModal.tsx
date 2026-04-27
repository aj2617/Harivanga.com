import React from 'react';
import { Image as ImageIcon, Plus, Save, Trash2, X } from 'lucide-react';
import { Product } from '../../../types';
import { getDisplayImageSrc } from '../../../lib/imageSources';

type AdminProductModalProps = {
  editingProduct: Product | null;
  productForm: Partial<Product>;
  productOrigins: readonly string[];
  productImagesInputRef: React.RefObject<HTMLInputElement | null>;
  isSubmitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: Partial<Product>) => void;
  onVariantChange: (index: number, key: keyof Product['variants'][number], value: string) => void;
  onAddVariant: () => void;
  onAddPackageVariant: (weightLabel: string) => void;
  onRemoveVariant: (index: number) => void;
  onProductImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPrimaryImageSelect: (image: string) => void;
  onRemoveProductImage: (image: string) => void;
};

const inputClass =
  'w-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] transition';
const labelClass = 'text-[10px] font-semibold uppercase tracking-widest text-gray-500';

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  editingProduct,
  productForm,
  productOrigins,
  productImagesInputRef,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
  onChange,
  onVariantChange,
  onAddVariant,
  onAddPackageVariant,
  onRemoveVariant,
  onProductImageUpload,
  onPrimaryImageSelect,
  onRemoveProductImage,
}) => {
  const [customPackageKg, setCustomPackageKg] = React.useState('');

  const handleAddCustomPackage = () => {
    const trimmed = customPackageKg.trim();
    if (!trimmed) return;

    onAddPackageVariant(`${trimmed}kg Package`);
    setCustomPackageKg('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm" />
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden border border-[#f3f4f6] bg-white shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#f3f4f6] px-6 py-4 sm:px-8 sm:py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium">{editingProduct ? 'Editing' : 'New'}</p>
            <h2 className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 transition-colors hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-h-[75vh] space-y-6 overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className={labelClass}>Product Name</label>
              <input
                required
                type="text"
                value={productForm.name}
                onChange={(e) => onChange({ ...productForm, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Variety</label>
              <select
                value={productForm.variety}
                onChange={(e) => onChange({ ...productForm, variety: e.target.value })}
                className={inputClass}
              >
                <option>হাড়িভাঙ্গা</option>
                <option>আম রুপালী</option>
                <option>বারি-৪</option>
                <option>গৌড়মতি</option>
                <option>ব্যানানা</option>
                <option>কপিল বাংড়ি</option>
                <option>সাদা আম</option>
                <option>হিমসাগর</option>
                <option>খিরসাপাত</option>
                <option>কাটিমন</option>
                <option>ফজলি</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Description</label>
            <textarea
              required
              rows={3}
              value={productForm.description}
              onChange={(e) => onChange({ ...productForm, description: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Taste Profile</label>
            <input
              required
              type="text"
              value={productForm.tasteProfile}
              onChange={(e) => onChange({ ...productForm, tasteProfile: e.target.value })}
              className={inputClass}
              placeholder="Sweet, aromatic, creamy..."
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className={labelClass}>Origin</label>
              <select
                value={productForm.origin}
                onChange={(e) => onChange({ ...productForm, origin: e.target.value })}
                className={inputClass}
              >
                {productOrigins.map((origin) => (
                  <option key={origin} value={origin}>{origin}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Season Status</label>
              <select
                value={productForm.isAvailable ? 'in-season' : 'out-of-season'}
                onChange={(e) => onChange({ ...productForm, isAvailable: e.target.value === 'in-season' })}
                className={inputClass}
              >
                <option value="in-season">In Season</option>
                <option value="out-of-season">Out of Season</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 border-t border-[#f3f4f6] pt-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className={labelClass}>Price Options</label>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={() => onAddPackageVariant('1kg')} className="inline-flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:border-[#111827] transition-colors">
                  <Plus size={13} strokeWidth={2} /> 1kg
                </button>
                <button type="button" onClick={() => onAddPackageVariant('3kg Package')} className="inline-flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:border-[#111827] transition-colors">
                  <Plus size={13} strokeWidth={2} /> 3kg
                </button>
                <button type="button" onClick={() => onAddPackageVariant('5kg Package')} className="inline-flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:border-[#111827] transition-colors">
                  <Plus size={13} strokeWidth={2} /> 5kg
                </button>
                <button type="button" onClick={onAddVariant} className="inline-flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:border-[#111827] transition-colors">
                  <Plus size={13} strokeWidth={2} /> Add Price
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3 border border-[#f3f4f6] bg-[#fafaf9] p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#111827]">Custom package</p>
                <p className="text-xs text-gray-500 font-light mt-0.5">Create package options like 11kg, 22kg, or any custom weight.</p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customPackageKg}
                  onChange={(e) => setCustomPackageKg(e.target.value)}
                  placeholder="11"
                  className="w-full border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] sm:w-24"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPackage}
                  className="inline-flex items-center justify-center bg-[#111827] text-white px-4 py-2.5 text-sm font-semibold whitespace-nowrap hover:bg-gray-800 transition-colors"
                >
                  Add Custom
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {(productForm.variants ?? []).map((variant, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 border border-[#f3f4f6] bg-[#fafaf9] p-3 md:grid-cols-[minmax(0,1fr)_180px_44px]">
                  <input
                    required
                    type="text"
                    value={variant.weight}
                    onChange={(e) => onVariantChange(index, 'weight', e.target.value)}
                    placeholder="Weight label, e.g. 1kg or 5kg Box"
                    className="w-full border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316]"
                  />
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={variant.price === 0 ? '' : String(variant.price)}
                    onChange={(e) => onVariantChange(index, 'price', e.target.value)}
                    placeholder="Price"
                    className="w-full border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316]"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveVariant(index)}
                    className="inline-flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors py-2"
                    aria-label="Remove variant"
                  >
                    <Trash2 size={15} strokeWidth={1.75} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-500 font-light">The first option becomes the starting price shown on Home and Shop.</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-[#f3f4f6] pt-6">
            <div className="flex items-center justify-between gap-3">
              <label className={labelClass}>Product Images</label>
              <button type="button" onClick={() => productImagesInputRef.current?.click()} className="inline-flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:border-[#111827] transition-colors">
                <ImageIcon size={13} strokeWidth={1.75} /> Upload Images
              </button>
              <input
                ref={productImagesInputRef}
                type="file"
                accept="image/webp,image/png,image/jpeg,image/jpg"
                multiple
                onChange={onProductImageUpload}
                className="hidden"
              />
            </div>

            {(productForm.images ?? []).length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(productForm.images ?? []).map((image, index) => {
                  const isPrimary = productForm.image === image;
                  return (
                    <div key={`${image}-${index}`} className="overflow-hidden border border-[#f3f4f6] bg-white">
                      <div className="aspect-square overflow-hidden bg-[#fafaf9]">
                        <img src={getDisplayImageSrc(image)} alt={`Product upload ${index + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                      </div>
                      <div className="flex items-center gap-1.5 p-2.5 border-t border-[#f3f4f6]">
                        <button
                          type="button"
                          onClick={() => onPrimaryImageSelect(image)}
                          className={`flex-1 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${isPrimary ? 'bg-[#111827] text-white' : 'border border-gray-200 bg-white text-[#111827] hover:border-[#111827]'}`}
                        >
                          {isPrimary ? 'Primary' : 'Set Primary'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveProductImage(image)}
                          className="border border-gray-200 bg-white px-2 py-1.5 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                          aria-label="Remove image"
                        >
                          <Trash2 size={13} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 bg-[#fafaf9] px-4 py-8 text-center text-sm text-gray-500 font-light">
                Upload JPG, PNG, or WebP images. They are converted to optimized WebP with a smaller thumbnail for faster storefront loading.
              </div>
            )}
          </div>

          {submitError && (
            <div className="border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          <div className="flex gap-2 border-t border-[#f3f4f6] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 hover:border-[#111827] hover:text-[#111827] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 bg-[#111827] py-3 text-sm font-semibold tracking-wide text-white hover:bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Save size={16} strokeWidth={1.75} /> {isSubmitting ? (editingProduct ? 'Updating...' : 'Creating...') : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
