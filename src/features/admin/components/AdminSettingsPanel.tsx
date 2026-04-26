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
    <div className="space-y-6">
      {/* ── Video Promotions ── */}
      <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-[#faf8f5] shadow-sm">
        <div className="border-b border-[#e8e2d8] px-6 py-4 sm:px-8">
          <h1 className="text-[2rem] font-black leading-none text-[#2b2621]">Settings</h1>
          <p className="mt-2 text-sm text-[#7a7065]">Manage homepage promotions and content</p>
        </div>

        <div className="space-y-7 px-4 py-6 sm:px-6 lg:px-8">
          <form id="admin-settings-form" onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="rounded-[24px] border border-[#e6ddd2] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-[1.65rem] font-black leading-none text-[#201b16]">Homepage Video Promotion</h2>
                <p className="mt-2 text-sm text-[#8a7c6d]">Only video links are needed now. Add or remove links for the Stories to Watch section.</p>
                <div className="mt-6 space-y-4">
                  {promoStories.map((story, index) => (
                    <div key={story.id} className="rounded-[18px] border border-[#eee4d7] bg-[#fcfaf7] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-bold text-[#201b16]">Video Link {index + 1}</label>
                        {promoStories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemovePromoStory(story.id)}
                            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-500 transition hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        value={story.videoUrl}
                        onChange={(e) => onPromoStoryChange(story.id, 'videoUrl', e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... or https://example.com/promo.mp4"
                        className="mt-3 h-12 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={onAddPromoStory}
                    className="rounded-2xl border border-[#ddd3c6] bg-white px-5 py-3 text-sm font-bold text-[#201b16] transition hover:border-mango-orange hover:text-mango-orange"
                  >
                    Add Another Video
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
                {savedMessage && (
                  <div className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-600">
                    {savedMessage}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onReset}
                  className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-500 transition hover:border-red-200 hover:text-red-500"
                >
                  Reset Defaults
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-mango-orange px-6 py-3 text-sm font-bold text-white shadow-xl shadow-mango-orange/20"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── Customer Reviews ── */}
      <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-[#faf8f5] shadow-sm">
        <div className="border-b border-[#e8e2d8] px-6 py-4 sm:px-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[1.75rem] font-black leading-none text-[#2b2621]">Customer Reviews</h2>
            <p className="mt-2 text-sm text-[#7a7065]">Featured reviews shown on the homepage. Toggle visibility or remove any review.</p>
          </div>
          {reviewsSavedMessage && (
            <div className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-600 shrink-0">
              {reviewsSavedMessage}
            </div>
          )}
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          {reviews.length === 0 && !addingReview && (
            <div className="rounded-2xl border border-dashed border-[#ddd3c6] bg-white py-10 text-center text-sm text-[#8a7c6d]">
              No reviews yet. Add your first customer review below.
            </div>
          )}

          {reviews.map((review) => (
            <div
              key={review.id}
              className={`flex items-start gap-4 rounded-[20px] border p-4 transition-all ${review.isFeatured ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-white opacity-60'}`}
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-mango-orange/15 flex items-center justify-center text-sm font-black text-mango-orange">
                {review.avatarInitials || review.customerName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[#201b16]">{review.customerName}</span>
                  {review.location && <span className="text-xs text-gray-400">{review.location}</span>}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={11} className={n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{review.reviewText}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleReviewFeatured(review.id)}
                  title={review.isFeatured ? 'Hide from homepage' : 'Show on homepage'}
                  className="p-2 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-mango-orange hover:border-mango-orange/30 transition-all"
                >
                  {review.isFeatured ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteReview(review.id)}
                  title="Delete review"
                  className="p-2 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {addingReview ? (
            <div className="rounded-[20px] border border-[#e6ddd2] bg-white p-5 space-y-4">
              <h3 className="font-black text-[#201b16]">Add New Review</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Customer Name *</label>
                  <input
                    value={newReview.customerName}
                    onChange={(e) => setNewReview((r) => ({ ...r, customerName: e.target.value }))}
                    placeholder="e.g. Rahim Uddin"
                    className="h-11 w-full rounded-2xl border border-[#ddd3c6] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Location</label>
                  <input
                    value={newReview.location}
                    onChange={(e) => setNewReview((r) => ({ ...r, location: e.target.value }))}
                    placeholder="e.g. Dhaka, Bangladesh"
                    className="h-11 w-full rounded-2xl border border-[#ddd3c6] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Rating</label>
                <StarRatingInput value={newReview.rating} onChange={(v) => setNewReview((r) => ({ ...r, rating: v }))} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Review Text *</label>
                <textarea
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview((r) => ({ ...r, reviewText: e.target.value }))}
                  placeholder="What did the customer say about their experience?"
                  rows={3}
                  className="w-full rounded-2xl border border-[#ddd3c6] px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Avatar Initials (optional)</label>
                <input
                  value={newReview.avatarInitials}
                  onChange={(e) => setNewReview((r) => ({ ...r, avatarInitials: e.target.value.toUpperCase().slice(0, 2) }))}
                  placeholder="e.g. RU (auto-generated if blank)"
                  maxLength={2}
                  className="h-11 w-full rounded-2xl border border-[#ddd3c6] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddReview}
                  disabled={!newReview.customerName.trim() || !newReview.reviewText.trim()}
                  className="rounded-2xl bg-mango-orange px-6 py-3 text-sm font-bold text-white shadow-lg shadow-mango-orange/20 disabled:opacity-40 transition-all"
                >
                  Add Review
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingReview(false); setNewReview(BLANK_REVIEW); }}
                  className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-500 hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingReview(true)}
              className="flex items-center gap-2 rounded-2xl border border-[#ddd3c6] bg-white px-5 py-3 text-sm font-bold text-[#201b16] transition hover:border-mango-orange hover:text-mango-orange"
            >
              <Plus size={15} /> Add Customer Review
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
