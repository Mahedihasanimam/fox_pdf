// src/utils/theme.js
export const COLORS = {
  primary: '#FF6B2B',
  primaryDark: '#E55A1F',
  primaryLight: '#FF8C55',
  secondary: '#1A1A2E',
  accent: '#FFD700',
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F8',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(26,26,46,0.5)',

  // Tool card colors
  imageToPdf: { bg: '#FFF3ED', icon: '#FF6B2B', border: '#FFD5BC' },
  mergePdf: { bg: '#EEF2FF', icon: '#6366F1', border: '#C7D2FE' },
  splitPdf: { bg: '#F0FDF4', icon: '#22C55E', border: '#BBF7D0' },
  compressPdf: { bg: '#FFFBEB', icon: '#F59E0B', border: '#FDE68A' },
};

export const FONTS = {
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
