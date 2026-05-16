// Light mode palette
export const LIGHT_COLORS = {
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
  paper: '#FFFDF9',
  inkSoft: '#2B2D42',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  cardBg: '#FFFFFF',

  // Tool card colors
  imageToPdf: { bg: '#FFF3ED', icon: '#FF6B2B', border: '#FFD5BC' },
  mergePdf: { bg: '#EEF2FF', icon: '#6366F1', border: '#C7D2FE' },
  splitPdf: { bg: '#F0FDF4', icon: '#22C55E', border: '#BBF7D0' },
  compressPdf: { bg: '#FFFBEB', icon: '#F59E0B', border: '#FDE68A' },
  cameraScan: { bg: '#EFF6FF', icon: '#3B82F6', border: '#BFDBFE' },
  eSignature: { bg: '#FDF4FF', icon: '#A855F7', border: '#E9D5FF' },
  watermark: { bg: '#F0FDF4', icon: '#10B981', border: '#A7F3D0' },
  pageManager: { bg: '#FFF5F5', icon: '#EF4444', border: '#FECACA' },
  pdfViewer: { bg: '#F5F3FF', icon: '#8B5CF6', border: '#DDD6FE' },
  handwriting: { bg: '#FFFBF0', icon: '#D97706', border: '#FDE68A' },
};

// Dark mode palette
export const DARK_COLORS = {
  primary: '#FF7A3D',
  primaryDark: '#E55A1F',
  primaryLight: '#FF8C55',
  secondary: '#E2E8F0',
  accent: '#FFD700',
  background: '#0F0F17',
  surface: '#1A1A2A',
  surfaceAlt: '#23233A',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textLight: '#64748B',
  border: '#2D2D44',
  success: '#22C55E',
  error: '#F87171',
  warning: '#FBBF24',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  paper: '#0F0F17',
  inkSoft: '#E2E8F0',
  tabBar: '#1A1A2A',
  tabBarBorder: '#2D2D44',
  cardBg: '#1A1A2A',

  // Tool card colors (darker tints for dark mode)
  imageToPdf: { bg: '#2A1810', icon: '#FF7A3D', border: '#4A2A1A' },
  mergePdf: { bg: '#1A1A35', icon: '#818CF8', border: '#2D2D60' },
  splitPdf: { bg: '#0D2018', icon: '#4ADE80', border: '#1A4030' },
  compressPdf: { bg: '#221A0A', icon: '#FCD34D', border: '#3D2F10' },
  cameraScan: { bg: '#0D1A2E', icon: '#60A5FA', border: '#1A3050' },
  eSignature: { bg: '#1E0D2E', icon: '#C084FC', border: '#3A1A5A' },
  watermark: { bg: '#0A1F15', icon: '#34D399', border: '#1A3D28' },
  pageManager: { bg: '#2A0D0D', icon: '#F87171', border: '#4A1A1A' },
  pdfViewer: { bg: '#160D2E', icon: '#A78BFA', border: '#2D1A5A' },
  handwriting: { bg: '#1E1500', icon: '#FCD34D', border: '#3D2A00' },
};

// Default export stays for any remaining direct imports
export const COLORS = LIGHT_COLORS;

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
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
};
