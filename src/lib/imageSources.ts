const LOCAL_IMAGE_PREFIX = '/images/downloaded/';
const INLINE_IMAGESET_PREFIX = 'imgset:';

type InlineImageSet = {
  src: string;
  thumb?: string;
};

function parseInlineImageSet(value: string): InlineImageSet | null {
  if (!value.startsWith(INLINE_IMAGESET_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(value.slice(INLINE_IMAGESET_PREFIX.length)) as InlineImageSet;
  } catch {
    return null;
  }
}

export function createInlineImageSet(src: string, thumb?: string) {
  return `${INLINE_IMAGESET_PREFIX}${JSON.stringify({ src, thumb })}`;
}

export function getDisplayImageSrc(src: string): string {
  const inlineImageSet = parseInlineImageSet(src);
  if (inlineImageSet) {
    return inlineImageSet.src;
  }

  return src;
}

export const getThumbnailImageSrc = (src: string): string => {
  const inlineImageSet = parseInlineImageSet(src);
  if (inlineImageSet) {
    return inlineImageSet.thumb ?? inlineImageSet.src;
  }

  if (!src.startsWith(LOCAL_IMAGE_PREFIX)) {
    return src;
  }

  return src.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '-thumb.$1');
};
