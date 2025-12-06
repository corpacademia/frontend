import { useEffect } from 'react';
import { useBrandingStore } from '../store/brandingStore';

export const useBranding = () => {
  const { primaryColor, secondaryColor } = useBrandingStore();

  useEffect(() => {
    // Set CSS variables for branding colors
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-secondary', secondaryColor);

    // Also set legacy variables for compatibility
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
  }, [primaryColor, secondaryColor]);

  return { primaryColor, secondaryColor };
};