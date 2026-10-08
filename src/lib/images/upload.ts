/**
 * Resize uploaded images and encode them as data URLs before sending them to Supabase Storage.
 */

export interface ProcessedImageResult {
  url: string;
  name: string;
  size: number;
}

export function processImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1200,
  quality = 0.82
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`File "${file.name}" is not a supported image.`));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Failed to load image "${file.name}"`));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw data URL
          resolve({
            url: reader.result as string,
            name: file.name,
            size: file.size,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp if supported, otherwise jpeg
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputMime, quality);

        resolve({
          url: dataUrl,
          name: file.name,
          size: Math.round(dataUrl.length * (3 / 4)),
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
