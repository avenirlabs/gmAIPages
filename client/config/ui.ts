// UI Configuration for card image aspects
export const CARD_IMAGE_ASPECT: 'square' | 'portrait45' =
  (import.meta.env.VITE_CARD_IMAGE_ASPECT as 'square' | 'portrait45') || 'square';

// Map aspect types to Tailwind classes
export const ASPECT_RATIO_CLASSES = {
  square: 'aspect-square',
  portrait45: 'aspect-[4/5]',
} as const;

// Get the appropriate aspect ratio class for the current configuration
export function getImageAspectClass(): string {
  return ASPECT_RATIO_CLASSES[CARD_IMAGE_ASPECT];
}