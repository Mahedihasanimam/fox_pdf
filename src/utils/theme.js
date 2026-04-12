// src/utils/theme.js
export const COLORS = {
  primary: "#FF6B2B",
  primaryDark: "#E55A1F",
  primaryLight: "#FF8C55",
  secondary: "#1A1A2E",
  accent: "#FFD700",
  background: "#F7F8FC",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F2F8",
  text: "#1A1A2E",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(26,26,46,0.5)",
  paper: "#FFFDF9",
  inkSoft: "#2B2D42",

  // Tool card colors
  imageToPdf: { bg: "#FFF3ED", icon: "#FF6B2B", border: "#FFD5BC" },
  mergePdf: { bg: "#EEF2FF", icon: "#6366F1", border: "#C7D2FE" },
  splitPdf: { bg: "#F0FDF4", icon: "#22C55E", border: "#BBF7D0" },
  compressPdf: { bg: "#FFFBEB", icon: "#F59E0B", border: "#FDE68A" },
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
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
    extraBold: "800",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
};
