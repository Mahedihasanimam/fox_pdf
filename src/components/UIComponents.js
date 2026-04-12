// src/components/UIComponents.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from "../utils/theme";

// ─── Primary Button ──────────────────────────────────────────────────────────
export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  style,
  icon,
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          {icon && <Text style={styles.btnIcon}>{icon}</Text>}
          <Text style={styles.primaryBtnText}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Secondary Button ────────────────────────────────────────────────────────
export function SecondaryButton({ title, onPress, style, icon }) {
  return (
    <TouchableOpacity
      style={[styles.secondaryBtn, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && <Text style={styles.secondaryBtnIcon}>{icon}</Text>}
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

// ─── Tool Card ───────────────────────────────────────────────────────────────
export function ToolCard({ title, subtitle, icon, colors, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.toolCard,
        { backgroundColor: colors.bg, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={[styles.toolCardIcon, { backgroundColor: colors.icon + "22" }]}
      >
        <Text style={[styles.toolCardIconText, { color: colors.icon }]}>
          {icon}
        </Text>
      </View>
      <Text style={[styles.toolCardTitle, { color: COLORS.text }]}>
        {title}
      </Text>
      <Text style={[styles.toolCardSubtitle]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

// ─── File Item ───────────────────────────────────────────────────────────────
export function FileItem({ name, size, onDelete, showDelete = true, badge }) {
  const shortName = name?.length > 30 ? name.substring(0, 28) + "…" : name;
  return (
    <View style={styles.fileItem}>
      <View style={styles.fileItemIcon}>
        <Text style={styles.fileItemIconText}>📄</Text>
      </View>
      <View style={styles.fileItemInfo}>
        <Text style={styles.fileItemName} numberOfLines={1}>
          {shortName}
        </Text>
        {size ? <Text style={styles.fileItemSize}>{size}</Text> : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {showDelete && onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── Stat Badge ──────────────────────────────────────────────────────────────
export function StatBadge({ label, value, color }) {
  return (
    <View
      style={[
        styles.statBadge,
        { borderColor: color + "40", backgroundColor: color + "12" },
      ]}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
export function ProgressBar({ progress, color }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.round(progress * 100)}%`,
            backgroundColor: color || COLORS.primary,
          },
        ]}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Primary Button
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    paddingVertical: 15,
    paddingHorizontal: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...SHADOW.md,
  },
  primaryBtnDisabled: {
    backgroundColor: COLORS.textLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 0.1,
  },
  btnIcon: {
    fontSize: 18,
  },

  // Secondary Button
  secondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    paddingHorizontal: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
  },
  secondaryBtnIcon: {
    fontSize: 16,
  },

  // Tool Card
  toolCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    flex: 1,
    minHeight: 120,
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
    ...SHADOW.sm,
  },
  toolCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  toolCardIconText: {
    fontSize: 26,
  },
  toolCardTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    textAlign: "left",
    letterSpacing: 0,
  },
  toolCardSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: "left",
  },

  // File Item
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  fileItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFF3ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  fileItemIconText: {
    fontSize: 20,
  },
  fileItemInfo: {
    flex: 1,
  },
  fileItemName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
  },
  fileItemSize: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  deleteIcon: {
    fontSize: 14,
    color: COLORS.textLight,
    padding: 4,
  },
  badge: {
    backgroundColor: COLORS.primary + "20",
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },

  // Section Header
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  // Stat Badge
  statBadge: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    alignItems: "center",
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.extraBold,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  // Progress Bar
  progressTrack: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    borderRadius: RADIUS.full,
  },
});
