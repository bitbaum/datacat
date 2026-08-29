import { useMemo } from 'react';
import { branding, getBrandingConfig, BrandingConfig } from '../config/branding';
import { getBrandingPreset } from '../config/branding-presets';

export const useBranding = (): BrandingConfig => {
  return useMemo(() => {
    // Check if a preset is specified in environment
    const presetName = process.env.NEXT_PUBLIC_BRAND_PRESET;

    if (presetName) {
      const preset = getBrandingPreset(presetName);
      return {
        ...branding,
        ...preset,
      };
    }

    return branding;
  }, []);
};

// Hook for getting specific branding values
export const useBrandingValue = <K extends keyof BrandingConfig>(key: K): BrandingConfig[K] => {
  const brandingConfig = useBranding();
  return brandingConfig[key];
};

// Convenience hooks for common branding values
export const useBrandName = () => useBrandingValue('name');
export const useBrandShortName = () => useBrandingValue('shortName');
export const useBrandDescription = () => useBrandingValue('description');
export const useBrandLogo = () => useBrandingValue('logo');
export const useBrandColors = () => ({
  primary: useBrandingValue('primaryColor'),
  secondary: useBrandingValue('secondaryColor'),
  accent: useBrandingValue('accentColor'),
});
export const useBrandUseCase = () => useBrandingValue('useCase');
