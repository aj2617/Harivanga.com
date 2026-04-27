import React, { useState } from 'react';
import { Star, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

export type PromoStoryInput = {
  id: string;
  title: string;
  videoUrl: string;
  description: string;
};

export type CustomerReviewInput = {
  id: string;
  customerName: string;
  location: string;
  rating: number;
  reviewText: string;
  avatarInitials: string;
  isFeatured: boolean;
};

type AdminSettingsPanelProps = {
  promoStories: PromoStoryInput[];
  savedMessage: string | null;
  onPromoStoryChange: (id: string, field: 'title' | 'videoUrl' | 'description', value: string) => void;
  onAddPromoStory: () => void;
  onRemovePromoStory: (id: string) => void;
  onReset: () => void;
  onSubmit: (event: React.FormEvent) => void;
  reviews: CustomerReviewInput[];
  onAddReview: (review: Omit<CustomerReviewInput, 'id'>) => void;
  onDeleteReview: (id: string) => void;
  onToggleReviewFeatured: (id: string) => void;
  reviewsSavedMessage: string | null;
};

const StarRatingInput: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="focus:outline-none"
        aria-label={`${n} star${n !== 1 ? 's' : ''}`}
      >
        <Star
          size={20}
          className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
        />
      </button>
    ))}
  </div>
);

const BLANK_REVIEW = { customerName: '', location: '', rating: 5, reviewText: '', avatarInitials: '', isFeatured: true };

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  promoStories,
  savedMessage,
  onPromoStoryChange,
  onAddPromoStory,
  onRemovePromoStory,
  onReset,
  onSubmit,
  reviews,
  onAddReview,
  onDeleteReview,
  onToggleReviewFeatured,
  reviewsSavedMessage,
}) => {
  const [newReview, setNewReview] = useState<Omit<CustomerReviewInput, 'id'>>(BLANK_REVIEW);
  const [addingReview, setAddingReview] = useState(false);

  const handleAddReview = () => {
    if (!newReview.customerName.trim() || !newReview.reviewText.trim()) return;
    const initials = newReview.avatarInitials.trim() ||
      newReview.customerName.trim().split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    onAddReview({ ...newReview, avatarInitials: initials });
    setNewReview(BLANK_REVIEW);
    setAddingReview(false);
  };

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="border-b border-[#f3f4f6] pb-6">
        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 font-medium">Configuration</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tighter text-[#111827]">Settings</h1>
        <p className="mt-2 text-sm text-gray-500 font-light">Manage homepage promotions and customer testimonials.</p>
      </div>

      {/* ── Video Promotions ── */}
      <section className="border border-[#f3f4f6] bg-white">
        <div className="border-b border-[#f3f4f6] px-6 py-4 sm:px-8">
          <h2 className="text-lg font-bold tracking-tight text-[#111827]">Homepage Video Promotion</h2>
          <p className="mt-1 text-sm text-gray-500 font-light">Add or remove video links for the Stories to Watch section on the homepage.</p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <form id="admin-settings-form" onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-3">
              {promoStories.map((story, index) => (
                <div key={story.id} className="border border-[#f3f4f6] bg-[#fafaf9] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Video Link {index + 1}</label>
                    {promoStories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemovePromoStory(story.id)}
                        className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    value={story.videoUrl}
                    onChange={(e) => onPromoStoryChange(story.id, 'videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://example.com/promo.mp4"
                    className="mt-3 h-11 w-full border border-gray-200 bg-white px-4 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] transition"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={onAddPromoStory}
                className="inline-flex items-center gap-2 border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] hover:border-[#111827] transition-colors"
              >
                <Plus size={14} strokeWidth={2} /> Add Another Video
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#f3f4f6] pt-5">
              <div className="flex items-center gap-3">
                {savedMessage && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 border border-emerald-100 bg-emerald-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {savedMessage}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onReset}
                  className="border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-red-200 hover:text-red-500 transition-colors"
                >
                  Reset Defaults
                </button>
                <button
                  type="submit"
                  className="bg-[#111827] text-white px-5 py-2.5 text-sm font-semibold tracking-wide hover:bg-gray-800 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── Customer Reviews ── */}
      <section className="border border-[#f3f4f6] bg-white">
        <div className="border-b border-[#f3f4f6] px-6 py-4 sm:px-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#111827]">Customer Reviews</h2>
            <p className="mt-1 text-sm text-gray-500 font-light">Featured reviews shown on the homepage. Toggle visibility or remove any review.</p>
          </div>
          {reviewsSavedMessage && (
            <div className="inline-flex shrink-0 items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 border border-emerald-100 bg-emerald-50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {reviewsSavedMessage}
            </div>
          )}
        </div>

        <div className="px-6 py-6 sm:px-8 space-y-3">
          {reviews.length === 0 && !addingReview && (
            <div className="border border-dashed border-gray-200 bg-white py-10 text-center text-sm text-gray-500 font-light">
              No reviews yet. Add your first customer review below.
            </div>
          )}

          {reviews.map((review) => (
            <div
              key={review.id}
              className={`flex items-start gap-4 border p-4 transition-all ${review.isFeatured ? 'border-[#f3f4f6] bg-white' : 'border-[#f3f4f6] bg-[#fafaf9] opacity-60'}`}
            >
              <div className="shrink-0 w-10 h-10 bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center text-sm font-bold text-[#f97316]">
                {review.avatarInitials || review.customerName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[#111827]">{review.customerName}</span>
                  {review.location && <span className="text-xs text-gray-400 font-light">{review.location}</span>}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={11} className={n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed font-light">{review.reviewText}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleReviewFeatured(review.id)}
                  title={review.isFeatured ? 'Hide from homepage' : 'Show on homepage'}
                  className="p-2 text-gray-400 hover:text-[#111827] transition-colors"
                >
                  {review.isFeatured ? <Eye size={15} strokeWidth={1.75} /> : <EyeOff size={15} strokeWidth={1.75} />}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteReview(review.id)}
                  title="Delete review"
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}

          {addingReview ? (
            <div className="border border-[#f3f4f6] bg-[#fafaf9] p-5 space-y-4">
              <h3 className="font-bold text-base tracking-tight text-[#111827]">Add New Review</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Customer Name *</label>
                  <input
                    value={newReview.customerName}
                    onChange={(e) => setNewReview((r) => ({ ...r, customerName: e.target.value }))}
                    placeholder="e.g. Rahim Uddin"
                    className="h-11 w-full border border-gray-200 bg-white px-4 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Location</label>
                  <input
                    value={newReview.location}
                    onChange={(e) => setNewReview((r) => ({ ...r, location: e.target.value }))}
                    placeholder="e.g. Dhaka, Bangladesh"
                    className="h-11 w-full border border-gray-200 bg-white px-4 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Rating</label>
                <StarRatingInput value={newReview.rating} onChange={(v) => setNewReview((r) => ({ ...r, rating: v }))} />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Review Text *</label>
                <textarea
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview((r) => ({ ...r, reviewText: e.target.value }))}
                  placeholder="What did the customer say about their experience?"
                  rows={3}
                  className="w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#111827] placeholder:text-gray-400 resize-none focus:outline-none focus:border-[#f97316] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Avatar Initials (optional)</label>
                <input
                  value={newReview.avatarInitials}
                  onChange={(e) => setNewReview((r) => ({ ...r, avatarInitials: e.target.value.toUpperCase().slice(0, 2) }))}
                  placeholder="e.g. RU (auto-generated if blank)"
                  maxLength={2}
                  className="h-11 w-full border border-gray-200 bg-white px-4 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] transition"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddReview}
                  disabled={!newReview.customerName.trim() || !newReview.reviewText.trim()}
                  className="bg-[#111827] text-white px-5 py-2.5 text-sm font-semibold tracking-wide hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-[#111827] transition-colors"
                >
                  Add Review
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingReview(false); setNewReview(BLANK_REVIEW); }}
                  className="border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-[#111827] hover:text-[#111827] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingReview(true)}
              className="inline-flex items-center gap-2 border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] hover:border-[#111827] transition-colors"
            >
              <Plus size={14} strokeWidth={2} /> Add Customer Review
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
