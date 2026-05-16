import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { usePro } from '../context/ProContext';
import { PaywallModal } from '../components/ProGate';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

function SettingRow({ iconName, iconColor, label, value, onPress, rightEl, danger }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress && !rightEl}
    >
      <View style={[styles.rowIcon, { backgroundColor: (iconColor || colors.primary) + '18' }]}>
        <Ionicons name={iconName} size={18} color={iconColor || colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.error : colors.text }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text> : null}
        {rightEl}
        {onPress && !rightEl && <Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
      </View>
    </TouchableOpacity>
  );
}

function SectionTitle({ label }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionTitle, { color: colors.textLight }]}>{label}</Text>;
}

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme, override, useSystemTheme } = useTheme();
  const { isPro, opsRemaining, dailyUsage, upgradeToPro } = usePro();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const handleDarkToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

  const handleResetTheme = () => {
    useSystemTheme();
  };

  const handleRate = () => {
    // Replace with your real App Store / Play Store URL
    Alert.alert('Rate FoxPDF', 'Thank you for using FoxPDF! Please rate us on the App Store.');
  };

  const handleFeedback = () => {
    Linking.openURL('mailto:feedback@foxpdf.app?subject=FoxPDF Feedback');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Pro Status Card */}
        <TouchableOpacity
          style={[styles.proCard, { backgroundColor: isPro ? '#7B5800' : colors.primary }]}
          onPress={() => { if (!isPro) setPaywallVisible(true); }}
          activeOpacity={0.88}
        >
          <View style={styles.proCardLeft}>
            <Ionicons name="star" size={28} color={isPro ? '#FFD700' : '#fff'} />
            <View style={{ marginLeft: SPACING.md }}>
              <Text style={styles.proCardTitle}>{isPro ? 'FoxPDF Pro — Active' : 'Upgrade to Pro'}</Text>
              <Text style={styles.proCardSub}>
                {isPro ? 'All features unlocked · No ads' : `${opsRemaining} free operations left today`}
              </Text>
            </View>
          </View>
          {!isPro && (
            <View style={styles.proCardBadge}>
              <Text style={styles.proCardBadgeText}>$2.99/mo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Usage Stats */}
        {!isPro && (
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{dailyUsage}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Used today</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.success }]}>{opsRemaining}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.text }]}>3</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Daily limit</Text>
            </View>
          </View>
        )}

        {/* Appearance */}
        <SectionTitle label="APPEARANCE" />
        <SettingRow
          iconName={isDark ? 'moon' : 'sunny'}
          iconColor={isDark ? '#818CF8' : '#F59E0B'}
          label="Dark Mode"
          rightEl={
            <Switch
              value={isDark}
              onValueChange={handleDarkToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          }
        />
        {override && (
          <SettingRow
            iconName="phone-portrait-outline"
            label="Use System Theme"
            onPress={handleResetTheme}
          />
        )}

        {/* Privacy */}
        <SectionTitle label="PRIVACY" />
        <SettingRow
          iconName="lock-closed"
          iconColor="#22C55E"
          label="Offline Processing"
          value="Always on"
        />
        <SettingRow
          iconName="eye-off"
          iconColor="#6366F1"
          label="Data Collection"
          value="None"
        />

        {/* Support */}
        <SectionTitle label="SUPPORT" />
        <SettingRow
          iconName="star"
          iconColor="#F59E0B"
          label="Rate FoxPDF"
          onPress={handleRate}
        />
        <SettingRow
          iconName="mail"
          iconColor="#3B82F6"
          label="Send Feedback"
          onPress={handleFeedback}
        />

        {/* About */}
        <SectionTitle label="ABOUT" />
        <SettingRow iconName="information-circle" label="Version" value="1.0.0" />
        <SettingRow iconName="code-slash" iconColor="#8B5CF6" label="Built with" value="React Native + pdf-lib" />
        <SettingRow
          iconName="document-text"
          label="Privacy Policy"
          onPress={() => Linking.openURL('https://foxpdf.app/privacy')}
        />
        <SettingRow
          iconName="reader"
          label="Terms of Service"
          onPress={() => Linking.openURL('https://foxpdf.app/terms')}
        />

        <Text style={[styles.footerText, { color: colors.textLight }]}>
          🦊 FoxPDF — Made for quick, private PDF tasks
        </Text>
      </ScrollView>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extraBold,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  proCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  proCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  proCardTitle: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.extraBold,
  },
  proCardSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  proCardBadge: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  proCardBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.extraBold,
    color: '#FF6B2B',
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statNum: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extraBold,
  },
  statLabel: { fontSize: FONTS.sizes.xs, marginTop: 2 },
  statDivider: { width: 1, marginVertical: SPACING.sm },
  sectionTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 1,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.medium,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: FONTS.sizes.sm },
  footerText: {
    textAlign: 'center',
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xl,
  },
});
