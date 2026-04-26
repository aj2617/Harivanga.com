import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  PlayCircle,
  ShieldCheck,
  Truck,
  Leaf,
  Star,
  ChevronLeft,
  ChevronRight,
  Award,
  Users,
  Sprout,
} from 'lucide-react';
import { ProductCard } from '../features/products/components/ProductCard';
import { useProducts } from '../features/products/hooks/useProducts';
import { ADMIN_SETTINGS_CHANGED_EVENT, ADMIN_SETTINGS_KEY, LEGACY_ADMIN_SETTINGS_KEY } from '../lib/adminSettings';
import { hasSupabaseConfig } from '../lib/env';
import { supabase } from '../supabase';
import slide1 from '../assets/home/slide-01.jpeg';
import slide2 from '../assets/home/slide-02.jpeg';
import slide3 from '../assets/home/slide-03.jpeg';
import slide4 from '../assets/home/slide-04.jpeg';
import slide5 from '../assets/home/slide-05.jpeg';
import slide6 from '../assets/home/slide-06.jpeg';
import slide7 from '../assets/home/slide-07.jpeg';
import slide8 from '../assets/home/slide-08.jpeg';
import slide9 from '../assets/home/slide-09.jpeg';
import slide10 from '../assets/home/slide-10.jpeg';

type HomePromotion = {
  promoStories: Array<{
    id: string;
    title: string;
    videoUrl: string;
    description: string;
  }>;
};

const DEFAULT_HOME_PROMOTION: HomePromotion = { promoStories: [] };

const normalizePromoStories = (value: unknown): HomePromotion['promoStories'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null;
      const story = entry as Partial<HomePromotion['promoStories'][number]>;
      const title = typeof story.title === 'string' ? story.title.trim() : '';
      const videoUrl = typeof story.videoUrl === 'string' ? story.videoUrl.trim() : '';
      const description = typeof story.description === 'string' ? story.description.trim() : '';
      if (!videoUrl) return null;
      return {
        id: typeof story.id === 'string' && story.id ? story.id : `story-${index + 1}`,
        title,
        videoUrl,
        description,
      };
    })
    .filter((story): story is HomePromotion['promoStories'][number] => story !== null);
};

const HOME_BANNER_SLIDES = [slide9, slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide10];

const loadHomePromotionFromLocalStorage = (): HomePromotion => {
  if (typeof window === 'undefined') return DEFAULT_HOME_PROMOTION;
  try {
    const raw =
      window.localStorage.getItem(ADMIN_SETTINGS_KEY) ??
      window.localStorage.getItem(LEGACY_ADMIN_SETTINGS_KEY);
    if (!raw) return DEFAULT_HOME_PROMOTION;
    const parsed = JSON.parse(raw) as Partial<HomePromotion> & {
      promoTitle?: string;
      promoVideoUrl?: string;
      promoDescription?: string;
    };
    const normalizedStories = normalizePromoStories(parsed.promoStories);
    return {
      promoStories:
        normalizedStories.length > 0
          ? normalizedStories
          : parsed.promoVideoUrl?.trim()
            ? [{ id: 'story-1', title: parsed.promoTitle?.trim() ?? '', videoUrl: parsed.promoVideoUrl.trim(), description: parsed.promoDescription?.trim() ?? '' }]
            : [],
    };
  } catch {
    return DEFAULT_HOME_PROMOTION;
  }
};

const loadHomePromotionFromSupabase = async (): Promise<HomePromotion> => {
  if (!hasSupabaseConfig) return loadHomePromotionFromLocalStorage();
  try {
    const { data, error } = await supabase.from('home_promotion').select('promo_stories').eq('id', 1).maybeSingle();
    if (error) throw error;
    const normalizedStories = normalizePromoStories((data as { promo_stories?: unknown } | null)?.promo_stories);
    if (normalizedStories.length > 0) return { promoStories: normalizedStories };
    return loadHomePromotionFromLocalStorage();
  } catch {
    return loadHomePromotionFromLocalStorage();
  }
};

const getYoutubeEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (parsed.pathname.startsWith('/embed/')) return url;
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
    return null;
  } catch {
    return null;
  }
};

const getYoutubeVideoId = (url: string): string | null => {
  const embedUrl = getYoutubeEmbedUrl(url);
  if (!embedUrl) return null;
  try {
    const parsed = new URL(embedUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments[1] ?? null;
  } catch {
    return null;
  }
};

const getYoutubeThumbnailUrl = (url: string): string | null => {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

const isDirectVideoFile = (url: string): boolean => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

const TRUST_STATS = [
  { icon: Users, value: '10,000+', label: 'Happy Customers', color: '#FF6B35' },
  { icon: Leaf, value: '100%', label: 'Chemical Free', color: '#166534' },
  { icon: Truck, value: '48h', label: 'Fast Delivery', color: '#FF6B35' },
  { icon: Award, value: '5★', label: 'Quality Rated', color: '#F5A623' },
];

const WHY_ITEMS = [
  {
    num: '01',
    title: 'Authentic Origin',
    body: 'Sourced directly from Podaganj, Mithapukur, Rangpur — the red-soil birthplace of the finest Harivanga.',
  },
  {
    num: '02',
    title: 'Hand-Inspected Quality',
    body: 'Every mango is inspected for ripeness, size, and blemishes before being packed in eco-friendly boxes.',
  },
  {
    num: '03',
    title: 'Fair Farm Pricing',
    body: 'No middlemen. Farmers earn fairly; you get premium fruit at the best value available.',
  },
];

export const Home: React.FC = () => {
  const { products: featuredProducts } = useProducts({ limit: 4 });
  const [promotion, setPromotion] = useState<HomePromotion>(DEFAULT_HOME_PROMOTION);
  const [openPromoStoryIds, setOpenPromoStoryIds] = useState<Record<string, boolean>>({});
  const [activeBannerSlide, setActiveBannerSlide] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | null = null;
    const syncPromotion = async () => {
      const nextPromotion = await loadHomePromotionFromSupabase();
      if (!cancelled) setPromotion(nextPromotion);
    };
    void syncPromotion();
    const handlePossibleChange = () => void syncPromotion();
    window.addEventListener('storage', handlePossibleChange);
    window.addEventListener(ADMIN_SETTINGS_CHANGED_EVENT, handlePossibleChange);
    if (hasSupabaseConfig) {
      refreshTimer = window.setInterval(() => void syncPromotion(), 60000);
    }
    return () => {
      cancelled = true;
      window.removeEventListener('storage', handlePossibleChange);
      window.removeEventListener(ADMIN_SETTINGS_CHANGED_EVENT, handlePossibleChange);
      if (refreshTimer !== null) window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    setOpenPromoStoryIds({});
  }, [promotion]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveBannerSlide((s) => (s + 1) % HOME_BANNER_SLIDES.length);
    }, 4000);
    return () => window.clearInterval(intervalId);
  }, []);

  const promoStories = promotion.promoStories.filter((s) => s.videoUrl.trim());
  const showPromotion = promoStories.length > 0;

  const prevSlide = () =>
    setActiveBannerSlide((s) => (s - 1 + HOME_BANNER_SLIDES.length) % HOME_BANNER_SLIDES.length);
  const nextSlide = () =>
    setActiveBannerSlide((s) => (s + 1) % HOME_BANNER_SLIDES.length);

  return (
    <div className="flex flex-col">

      {/* ── HERO ── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-[#0f0c07]">
        <div className="absolute inset-0">
          {HOME_BANNER_SLIDES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === activeBannerSlide ? 'opacity-100' : 'opacity-0'}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-mango-yellow">
              <Sprout size={12} />
              Season 2026 — Now Open
            </span>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.92] tracking-tight text-white">
              Farm Fresh{' '}
              <span
                className="italic"
                style={{ color: '#F5A623', textShadow: '0 0 60px rgba(245,166,35,0.35)' }}
              >
                Mangoes
              </span>
              <br />
              for Every Doorstep
            </h1>

            <p className="mt-6 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
              Hand-picked Harivanga mangoes from Podaganj&apos;s legendary red-soil farms — tree-ripened, chemical-free, and delivered in 48 hours.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                to="/products"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-mango-orange px-8 py-4 text-base font-bold text-white shadow-2xl shadow-mango-orange/40 hover:bg-orange-600 transition-all hover:shadow-orange-600/40 hover:gap-4"
              >
                Shop Mangoes
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-base font-bold text-white hover:bg-white/20 transition-all"
              >
                Our Story
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['🧑', '👨', '👩', '🧑'].map((e, i) => (
                  <span
                    key={i}
                    className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white/30 flex items-center justify-center text-sm"
                  >
                    {e}
                  </span>
                ))}
              </div>
              <div className="text-sm text-white/70">
                <span className="font-bold text-white">10,000+</span> happy customers this season
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-6 bottom-1/2 translate-y-1/2 hidden lg:flex flex-col gap-2 z-10">
          <button
            onClick={prevSlide}
            className="w-10 h-10 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextSlide}
            className="w-10 h-10 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {HOME_BANNER_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveBannerSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all ${i === activeBannerSlide ? 'w-7 h-2.5 bg-mango-yellow' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-white border-b border-gray-100 [content-visibility:auto] [contain-intrinsic-size:1px_120px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
            {TRUST_STATS.map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="flex flex-col sm:flex-row items-center gap-3 px-6 py-7 text-center sm:text-left">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}15`, color }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xl font-black text-[#1a1200]">{value}</p>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-20 sm:py-28" style={{ background: '#FAFAF8' }} data-content-visibility="auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-mango-orange font-bold text-xs uppercase tracking-[0.2em] inline-flex items-center gap-1.5">
                <Leaf size={12} /> Our Selection
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black text-[#1a1200]">Featured Varieties</h2>
              <p className="mt-2 text-sm text-gray-500 max-w-md">
                Handpicked from the best orchards of Rangpur for this season.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-bold text-mango-orange hover:gap-3 transition-all"
            >
              View All Varieties <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} priority />
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMO STORIES ── */}
      {showPromotion && (
        <section className="py-16 bg-white border-t border-gray-100 [content-visibility:auto] [contain-intrinsic-size:1px_520px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-mango-orange font-bold text-xs uppercase tracking-[0.2em]">Farm Stories</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black text-[#1a1200]">Stories to Watch</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {promoStories.map((story, index) => {
                const embedUrl = getYoutubeEmbedUrl(story.videoUrl);
                const thumbnailUrl = getYoutubeThumbnailUrl(story.videoUrl);
                const isOpen = Boolean(openPromoStoryIds[story.id]);

                return (
                  <article
                    key={story.id}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-video overflow-hidden bg-gray-900">
                      {!isOpen ? (
                        <button
                          type="button"
                          onClick={() => setOpenPromoStoryIds((c) => ({ ...c, [story.id]: true }))}
                          aria-label={story.title ? `Play ${story.title}` : 'Play video'}
                          className="relative block h-full w-full overflow-hidden group"
                        >
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={story.title || 'Story thumbnail'}
                              className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading={index === 0 ? 'eager' : 'lazy'}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-900 to-orange-950" />
                          )}
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-2xl group-hover:scale-110 transition-transform">
                            <span className="ml-1 border-y-[10px] border-y-transparent border-l-[16px] border-l-mango-orange" />
                          </span>
                        </button>
                      ) : embedUrl ? (
                        <iframe
                          src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                          title={story.title || 'Story video'}
                          className="h-full w-full"
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : isDirectVideoFile(story.videoUrl) ? (
                        <video src={story.videoUrl} controls preload="metadata" autoPlay className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white">
                          <PlayCircle size={52} className="text-white/90" />
                          <a
                            href={story.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-mango-orange px-5 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
                          >
                            Watch Video <ArrowRight size={15} />
                          </a>
                        </div>
                      )}
                    </div>
                    {story.title && (
                      <div className="px-5 py-4">
                        <h3 className="font-bold text-[#1a1200]">{story.title}</h3>
                        {story.description && <p className="mt-1 text-sm text-gray-500">{story.description}</p>}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY CHOOSE US ── */}
      <section className="py-20 sm:py-28 bg-[#0f0c07] text-white overflow-hidden relative [content-visibility:auto] [contain-intrinsic-size:1px_1100px]">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #FF6B35 0%, transparent 55%), radial-gradient(circle at 80% 50%, #F5A623 0%, transparent 55%)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-mango-yellow font-bold text-xs uppercase tracking-[0.2em]">Why Harivanga</span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.05] text-white">
                The{' '}
                <span className="text-mango-yellow italic">Trusted Choice</span>
                {' '}for Thousands
              </h2>
              <p className="mt-4 text-white/55 text-base leading-relaxed max-w-md">
                From orchard to doorstep — we keep the promise of quality at every step.
              </p>

              <div className="mt-10 space-y-8">
                {WHY_ITEMS.map(({ num, title, body }) => (
                  <div key={num} className="flex gap-5 group">
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-mango-orange flex items-center justify-center text-base font-black text-white">
                      {num}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1.5 text-white">{title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/about"
                className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-mango-yellow hover:gap-4 transition-all"
              >
                Read Our Full Story <ArrowRight size={15} />
              </Link>
            </div>

            <div className="relative hidden lg:block">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
                <img
                  src="/images/downloaded/farm.webp"
                  alt="Harivanga farm"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-mango-orange px-8 py-6 rounded-2xl shadow-2xl shadow-mango-orange/40">
                <p className="text-3xl font-black">10k+</p>
                <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mt-0.5">Happy Customers</p>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#1a1408] border border-white/10 px-6 py-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-mango-yellow text-mango-yellow" />)}
                </div>
                <p className="text-xs text-white/60">"Best mangoes I&apos;ve ever had!"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-mango-orange to-orange-600 [content-visibility:auto] [contain-intrinsic-size:1px_200px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Ready to Taste the Difference?
          </h2>
          <p className="text-white/80 text-base mb-8 max-w-xl mx-auto">
            Order fresh Harivanga mangoes today and experience farm-to-table quality delivered in 48 hours.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-base font-bold text-mango-orange shadow-2xl shadow-black/20 hover:bg-orange-50 transition-all group"
          >
            Order Now
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
};
