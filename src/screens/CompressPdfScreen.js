import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useProGate } from '../components/ProGate';
import { PrimaryButton, SecondaryButton, ProgressBar, StatBadge, ScreenHeader } from '../components/UIComponents';
import { compressPdf } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

const COMPRESSION_LEVELS = [
  { id: 'low', label: 'Low', iconName: 'remove-circle', iconColor: '#22C55E', description: 'Remove unused objects, best quality', note: 'Works best on PDFs with redundant data' },
  { id: 'medium', label: 'Medium', iconName: 'ellipse', iconColor: '#F59E0B', description: 'Optimise with object streams', note: 'Good for typical office PDFs', recommended: true },
  { id: 'high', label: 'High', iconName: 'add-circle', iconColor: '#EF4444', description: 'Maximum object compression', note: 'Best for complex or bloated PDFs' },
];

export default function CompressPdfScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { guard, modal } = useProGate();
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('medium');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!res.canceled && res.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFile(res.assets[0]);
        setStatus('idle');
        setErrorMsg('');
        setResult(null);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker');
    }
  };

  const compress = async () => {
    if (!file) return;
    await guard(false, "You've used all 3 free operations today", async () => {
      setStatus('processing');
      setProgress(0);
      setErrorMsg('');
      try {
        const res = await compressPdf(file.uri, level, setProgress);
        setResult(res);
        setStatus('done');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        setErrorMsg(err.message);
        setStatus('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    });
  };

  const shareResult = async () => {
    if (result?.path && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(result.path, { mimeType: 'application/pdf' });
    }
  };

  const reset = () => { setFile(null); setLevel('medium'); setStatus('idle'); setProgress(0); setResult(null); setErrorMsg(''); };

  if (status === 'done' && result) {
    const actualSavings = result.savedPercent > 0;
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.compressPdf?.bg }]}>
            <Ionicons name="archive" size={56} color={colors.compressPdf?.icon} />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {actualSavings ? 'Optimised!' : 'Processed'}
          </Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>
            {actualSavings
              ? 'Your PDF has been optimised'
              : 'PDF re-saved (no size change — this PDF was already compact)'}
          </Text>

          <View style={styles.statsRow}>
            <StatBadge label="Original" value={formatFileSize(result.originalSize)} color={colors.error} />
            <StatBadge label="Output" value={formatFileSize(result.newSize)} color={colors.success} />
            <StatBadge label="Saved" value={actualSavings ? `${result.savedPercent}%` : '~0%'} color={colors.primary} />
          </View>

          {/* Honest disclaimer */}
          <View style={[styles.disclaimerBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
            <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
              Note: This tool removes unused objects and optimises PDF structure. It does not re-encode images. For image-heavy PDFs, savings may be minimal.
            </Text>
          </View>

          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Output File</Text>
              <Text style={[styles.resultValue, { color: colors.text }]} numberOfLines={1}>{result.name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Optimisation Level</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
            </View>
          </View>

          <PrimaryButton title="Share / Save PDF" iconName="share-outline" onPress={shareResult} style={styles.btn} />
          <SecondaryButton title="Compress Another PDF" onPress={reset} style={styles.btn} />
        </ScrollView>
        {modal}
      </SafeAreaView>
    );
  }

  if (status === 'processing') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.processingContainer}>
          <Ionicons name="archive" size={64} color={colors.compressPdf?.icon} />
          <Text style={[styles.processingTitle, { color: colors.text }]}>Optimising…</Text>
          <Text style={[styles.processingSubtitle, { color: colors.textSecondary }]}>Removing unused objects</Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={colors.compressPdf?.icon} />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
        {modal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Compress PDF" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {status === 'error' && (
            <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Ionicons name="warning" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
            </View>
          )}

          {/* Honest notice */}
          <View style={[styles.noticeBanner, { backgroundColor: isDark ? '#1A1A10' : '#FFFBEB', borderColor: colors.compressPdf?.border }]}>
            <Ionicons name="information-circle" size={16} color={colors.compressPdf?.icon} />
            <Text style={[styles.noticeText, { color: colors.compressPdf?.icon }]}>
              This tool optimises PDF structure by removing unused objects. Results vary — image-heavy PDFs see minimal change.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.pickZone, file ? styles.pickZoneFilled : {}, { backgroundColor: colors.compressPdf?.bg || '#FFFBEB', borderColor: colors.compressPdf?.icon }]}
            onPress={pickPdf}
            activeOpacity={0.8}
          >
            {!file ? (
              <>
                <Ionicons name="archive" size={44} color={colors.compressPdf?.icon} />
                <Text style={[styles.pickZoneTitle, { color: colors.compressPdf?.icon }]}>Select PDF File</Text>
                <Text style={[styles.pickZoneSubtitle, { color: colors.textSecondary }]}>Tap to choose a PDF to optimise</Text>
              </>
            ) : (
              <>
                <Ionicons name="document-text" size={32} color={colors.compressPdf?.icon} />
                <Text style={[styles.pickedName, { color: colors.text }]} numberOfLines={1}>{file.name}</Text>
                <Text style={[styles.pickedMeta, { color: colors.textSecondary }]}>{formatFileSize(file.size)}</Text>
                <Text style={[styles.changeTap, { color: colors.compressPdf?.icon }]}>Tap to change file</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.levelSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.levelTitle, { color: colors.text }]}>Optimisation Level</Text>
            {COMPRESSION_LEVELS.map((lvl) => (
              <TouchableOpacity
                key={lvl.id}
                style={[styles.levelCard, { borderColor: level === lvl.id ? colors.primary : colors.border, backgroundColor: level === lvl.id ? colors.primary + '10' : colors.background }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLevel(lvl.id); }}
                activeOpacity={0.8}
              >
                <View style={styles.levelCardLeft}>
                  <Ionicons name={lvl.iconName} size={24} color={lvl.iconColor} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.levelLabelRow}>
                      <Text style={[styles.levelLabel, { color: level === lvl.id ? colors.primary : colors.text }]}>{lvl.label}</Text>
                      {lvl.recommended && (
                        <View style={[styles.recommendedBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.levelDesc, { color: colors.textSecondary }]}>{lvl.description}</Text>
                    <Text style={[styles.levelNote, { color: colors.textLight }]}>{lvl.note}</Text>
                  </View>
                </View>
                <View style={[styles.radio, { borderColor: level === lvl.id ? colors.primary : colors.border }]}>
                  {level === lvl.id && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <PrimaryButton title="Optimise PDF" iconName="archive" onPress={compress} disabled={!file} style={styles.actionBtn} />
      </View>
      {modal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.base, paddingBottom: 100 },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  noticeText: { flex: 1, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.medium, lineHeight: 16 },
  pickZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: 8,
  },
  pickZoneFilled: { borderStyle: 'solid', paddingVertical: SPACING.lg },
  pickZoneTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  pickZoneSubtitle: { fontSize: FONTS.sizes.sm },
  pickedName: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, textAlign: 'center', maxWidth: '90%' },
  pickedMeta: { fontSize: FONTS.sizes.sm },
  changeTap: { fontSize: FONTS.sizes.xs },
  levelSection: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, ...SHADOW.sm },
  levelTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, marginBottom: SPACING.md },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  levelCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, flex: 1 },
  levelLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  levelLabel: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },
  levelDesc: { fontSize: FONTS.sizes.xs },
  levelNote: { fontSize: 10, marginTop: 2 },
  recommendedBadge: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  recommendedText: { fontSize: 9, color: '#fff', fontWeight: FONTS.weights.bold },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.base, borderTopWidth: 1 },
  actionBtn: { width: '100%' },
  processingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl, gap: 12 },
  processingTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.extraBold },
  processingSubtitle: { fontSize: FONTS.sizes.md },
  progressWrap: { width: '100%', gap: 8 },
  progressText: { textAlign: 'center', fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold },
  resultContainer: { flexGrow: 1, alignItems: 'center', padding: SPACING.xl, paddingTop: 60 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  resultTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.extraBold, marginBottom: 6 },
  resultSub: { fontSize: FONTS.sizes.md, marginBottom: SPACING.xl, textAlign: 'center', paddingHorizontal: SPACING.xl },
  disclaimerBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, width: '100%' },
  disclaimerText: { flex: 1, fontSize: FONTS.sizes.xs, lineHeight: 16 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, width: '100%', marginBottom: SPACING.lg },
  resultCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, width: '100%', marginBottom: SPACING.xl, borderWidth: 1, ...SHADOW.sm },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  resultLabel: { fontSize: FONTS.sizes.sm },
  resultValue: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold, maxWidth: '60%', textAlign: 'right' },
  btn: { width: '100%', marginBottom: SPACING.sm },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1 },
  errorText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, flex: 1 },
});
