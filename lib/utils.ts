import { PHONE_REGEX, EMAIL_REGEX, CURRENCY } from '../constants';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: CURRENCY,
  }).format(amount);
};

export const sanitizeContent = (text: string): string => {
  let sanitized = text;

  // Replace phone numbers
  sanitized = sanitized.replace(PHONE_REGEX, ' [HIDDEN CONTACT] ');

  // Replace emails
  sanitized = sanitized.replace(EMAIL_REGEX, ' [HIDDEN EMAIL] ');

  return sanitized;
};

export const calculateSplit = (amount: number) => {
  const platformFee = amount * 0.20;
  const sellerEarnings = amount * 0.80;
  return { platformFee, sellerEarnings };
};

/**
 * Generates a secure, blurred version of an image using HTML5 Canvas.
 * This ensures the text is illegible and cannot be reversed by inspecting CSS.
 */
export const generateSecurePreview = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      // Downscale to destroy text legibility
      const scaleFactor = 0.2;
      const w = img.width * scaleFactor;
      const h = img.height * scaleFactor;

      canvas.width = w;
      canvas.height = h;

      ctx.filter = 'blur(4px)';
      ctx.drawImage(img, 0, 0, w, h);

      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };

    img.onerror = () => {
      resolve(imageUrl);
    };
  });
};
