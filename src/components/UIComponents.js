import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// ─── Primary Button ──────────────────────────────────────────────────────────
export function PrimaryButton({ title, onPress, disabled, loading, style, iconName }) {
  const { colors } = useTheme();
  const handlePress = () => { hapticLight(); onPress?.(); };
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: disabled ? colors.textLight : colors.primary, borderColor: disabled ? colors.textLight : colors.primaryDark }, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          {iconName && <Ionicons name={iconName} size={18} color="#fff" style={{ marginRight: 6 }} />}
          <Text style={styles.primaryBtnText}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Secondary Button ────────────────────────────────────────────────────────
export function SecondaryButton({ title, onPress, style, iconName }) {
  const { colors } = useTheme();
  const handlePress = () => { hapticLight(); onPress?.(); };
  return (
    <TouchableOpacity
      style={[styles.secondaryBtn, { borderColor: colors.primary, backgroundColor: colors.surface }, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {iconName && <Ionicons name={iconName} size={16} color={colors.primary} style={{ marginRight: 6 }} />}
      <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>{title}</Text>
    </TouchableOpacity>
  );
}

// ─── Tool Card ───────────────────────────────────────────────────────────────
export function ToolCard({ title, subtitle, iconName, colors: toolColors, onPress, isPro, locked }) {
  const { colors } = useTheme();
  const handlePress = () => { hapticLight(); onPress?.(); };
  return (
    <TouchableOpacity
      style={[styles.toolCard, { backgroundColor: toolColors.bg, borderColor: toolColors.border }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={[styles.toolCardIcon, { backgroundColor: toolColors.icon + '22' }]}>
        <Ionicons name={iconName} size={26} color={toolColors.icon} />
      </View>
      <Text style={[styles.toolCardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.toolCardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      {isPro && (
        <View style={[styles.proTag, { backgroundColor: '#FFD700' }]}>
          <Ionicons name="star" size={8} color="#7B5800" />
          <Text style={styles.proTagText}>PRO</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── File Item ───────────────────────────────────────────────────────────────
export function FileItem({ name, size, onDelete, showDelete = true, badge }) {
  const { colors } = useTheme();
  const shortName = name?.length > 30 ? name.substring(0, 28) + '…' : name;
  return (
    <View style={[styles.fileItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.fileItemIcon, { backgroundColor: colors.primary + '18' }]}>
        <Ionicons name="document-text" size={20} color={colors.primary} />
      </View>
      <View style={styles.fileItemInfo}>
        <Text style={[styles.fileItemName, { color: colors.text }]} numberOfLines={1}>{shortName}</Text>
        {size ? <Text style={[styles.fileItemSize, { color: colors.textLight }]}>{size}</Text> : null}
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
        </View>
      ) : null}
      {showDelete && onDelete && (
        <TouchableOpacity onPress={() => { hapticLight(); onDelete(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close-circle" size={20} color={colors.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── Stat Badge ──────────────────────────────────────────────────────────────
export function StatBadge({ label, value, color }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statBadge, { borderColor: color + '40', backgroundColor: color + '12' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ iconName, title, subtitle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={iconName || 'folder-open-outline'} size={52} color={colors.textLight} style={{ marginBottom: SPACING.md }} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
export function ProgressBar({ progress, color }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.round(progress * 100)}%`, backgroundColor: color || colors.primary },
        ]}
      />
    </View>
  );
}

// ─── Screen Header ───────────────────────────────────────────────────────────
export function ScreenHeader({ title, onBack, rightAction }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.screenHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => { hapticLight(); onBack?.(); }} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={26} color={colors.primary} />
      </TouchableOpacity>
      <Text style={[styles.screenTitle, { color: colors.text }]}>{title}</Text>
      <View style={{ width: 40 }}>{rightAction}</View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  primaryBtn: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.md,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 0.1,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
  },
  toolCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    flex: 1,
    minHeight: 120,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
    ...SHADOW.sm,
  },
  toolCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  toolCardTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
  },
  toolCardSubtitle: {
    fontSize: FONTS.sizes.sm,
  },
  proTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  proTagText: {
    fontSize: 8,
    fontWeight: FONTS.weights.extraBold,
    color: '#7B5800',
    letterSpacing: 0.5,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  fileItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  fileItemInfo: { flex: 1 },
  fileItemName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
  },
  fileItemSize: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
  },
  sectionHeader: { marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    marginTop: 3,
  },
  statBadge: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.extraBold,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: SPACING.xl,
  },
  progressTrack: {
    height: 10,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  screenTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
});
