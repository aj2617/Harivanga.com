import { createInlineImageSet } from './imageSources';

type ResizeOptions = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
};

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read uploaded image.'));
    };
    image.src = objectUrl;
  });
}

function getScaledSize(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not optimize uploaded image.'));
        return;
      }
      resolve(blob);
    }, 'image/webp', quality);
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Could not read optimized image.'));
    reader.readAsDataURL(blob);
  });
}

async function renderWebp(image: HTMLImageElement, options: ResizeOptions) {
  const { width, height } = getScaledSize(image.naturalWidth, image.naturalHeight, options.maxWidth, options.maxHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not initialize image optimizer.');
  }

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, options.quality);
  return blobToDataUrl(blob);
}

export async function optimizeProductUpload(file: File) {
  const image = await loadImage(file);
  const src = await renderWebp(image, {
    maxWidth: 960,
    maxHeight: 960,
    quality: 0.8,
  });
  const thumb = await renderWebp(image, {
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.72,
  });

  return createInlineImageSet(src, thumb);
}
