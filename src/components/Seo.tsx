import React, { useEffect } from 'react';

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string[];
  robots?: string;
  schema?: Record<string, unknown> | null;
};

const SITE_NAME = 'Harivanga.com';
const DEFAULT_DESCRIPTION =
  "Straight from Podaganj's legendary red-soil farms, Harivanga.com delivers tree-ripened, chemical-free Harivanga and premium mangoes across Bangladesh.";
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=1200';
const SITE_URL =
  ((import.meta.env as ImportMetaEnv & { VITE_SITE_URL?: string }).VITE_SITE_URL || 'https://harivanga.com').replace(/\/$/, '');

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertLink(selector: string, rel: string, href: string) {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  element.setAttribute('rel', rel);
  element.setAttribute('href', href);
}

export const Seo: React.FC<SeoProps> = ({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords = [],
  robots = 'index,follow',
  schema = null,
}) => {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const normalizedDescription = description || DEFAULT_DESCRIPTION;
    const keywordContent = keywords.length > 0 ? keywords.join(', ') : '';

    document.title = fullTitle;

    upsertMeta('meta[name="description"]', { name: 'description', content: normalizedDescription });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[name="theme-color"]', { name: 'theme-color', content: '#101828' });

    if (keywordContent) {
      upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywordContent });
    }

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type === 'product' ? 'website' : type });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: normalizedDescription });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: normalizedDescription });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });

    upsertLink('link[rel="canonical"]', 'canonical', canonicalUrl);

    const existingScript = document.getElementById('seo-structured-data');
    if (schema) {
      const script = existingScript ?? document.createElement('script');
      script.id = 'seo-structured-data';
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(schema);
      if (!existingScript) {
        document.head.appendChild(script);
      }
    } else if (existingScript) {
      existingScript.remove();
    }
  }, [description, image, keywords, path, robots, schema, title, type]);

  return null;
};
