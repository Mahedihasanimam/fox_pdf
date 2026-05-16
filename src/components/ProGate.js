import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { usePro } from '../context/ProContext';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

const PRO_FEATURES = [
  { icon: 'camera', text: 'Camera Scan to PDF' },
  { icon: 'create', text: 'E-Signature on PDFs' },
  { icon: 'lock-closed', text: 'Password Protect PDFs' },
  { icon: 'infinite', text: 'Unlimited daily operations' },
  { icon: 'cloud-upload', text: 'Cloud backup (coming soon)' },
  { icon: 'ban', text: 'No ads' },
];

export function PaywallModal({ visible, onClose, reason }) {
  const { colors } = useTheme();
  const { upgradeToPro } = usePro();

  const handleUpgrade = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await upgradeToPro();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.crown}>
            <Ionicons name="star" size={36} color="#FFD700" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Upgrade to FoxPDF Pro</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {reason || 'Unlock all premium features'}
          </Text>

          <View style={[styles.featuresBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            {PRO_FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={f.icon} size={14} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
            onPress={handleUpgrade}
            activeOpacity={0.85}
          >
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.upgradeBtnText}>Get Pro — $2.99/mo</Text>
          </TouchableOpacity>
          <Text style={[styles.yearlyHint, { color: colors.textLight }]}>or $14.99/year · Cancel anytime</Text>

          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.skipText, { color: colors.textLight }]}>Continue with free (3 ops/day)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Wrap a press handler with a free-ops gate
export function useProGate() {
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');
  const { canUse, consume } = usePro();

  const guard = async (isProFeature, reason, action) => {
    if (!canUse(isProFeature)) {
      setPaywallReason(reason || (isProFeature ? 'This is a Pro feature' : "You've used all 3 free operations today"));
      setPaywallVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return false;
    }
    await consume();
    await action();
    return true;
  };

  const modal = (
    <PaywallModal
      visible={paywallVisible}
      reason={paywallReason}
      onClose={() => setPaywallVisible(false)}
    />
  );

  return { guard, modal };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.xl,
    paddingBottom: 40,
    alignItems: 'center',
    ...SHADOW.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  crown: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFD70020',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extraBold,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  featuresBox: {
    width: '100%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
  },
  upgradeBtn: {
    width: '100%',
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
    ...SHADOW.md,
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.extraBold,
  },
  yearlyHint: {
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.md,
  },
  skipText: {
    fontSize: FONTS.sizes.sm,
    textDecorationLine: 'underline',
  },
});
