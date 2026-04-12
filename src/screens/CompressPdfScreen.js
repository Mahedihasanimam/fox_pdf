// src/screens/CompressPdfScreen.js
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
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';
import { PrimaryButton, SecondaryButton, ProgressBar, StatBadge } from '../components/UIComponents';
import { compressPdf } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';

const COMPRESSION_LEVELS = [
  {
    id: 'low',
    label: 'Low',
    icon: '🟢',
    description: 'Minimal compression, best quality',
    savings: '~10-20%',
  },
  {
    id: 'medium',
    label: 'Medium',
    icon: '🟡',
    description: 'Balanced compression & quality',
    savings: '~20-40%',
    recommended: true,
  },
  {
    id: 'high',
    label: 'High',
    icon: '🔴',
    description: 'Maximum compression, smaller file',
    savings: '~40-60%',
  },
];

export default function CompressPdfScreen({ navigation }) {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('medium');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets[0]) {
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
    setStatus('processing');
    setProgress(0);
    setErrorMsg('');
    try {
      const res = await compressPdf(file.uri, level, setProgress);
      setResult(res);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const shareResult = async () => {
    if (result?.path && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(result.path, { mimeType: 'application/pdf' });
    }
  };

  const reset = () => {
    setFile(null);
    setLevel('medium');
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setErrorMsg('');
  };

  // ── DONE ──
  if (status === 'done' && result) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.successIcon}>📦</Text>
          <Text style={styles.resultTitle}>Compressed!</Text>
          <Text style={styles.resultSub}>Your PDF has been optimized</Text>

          <View style={styles.statsRow}>
            <StatBadge
              label="Original"
              value={formatFileSize(result.originalSize)}
              color={COLORS.error}
            />
            <StatBadge
              label="Compressed"
              value={formatFileSize(result.newSize)}
              color={COLORS.success}
            />
            <StatBadge
              label="Saved"
              value={`${result.savedPercent}%`}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Output File</Text>
              <Text style={styles.resultValue} numberOfLines={1}>{result.name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Compression Level</Text>
              <Text style={styles.resultValue}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
            </View>
          </View>

          <PrimaryButton title="Share / Save PDF" icon="📤" onPress={shareResult} style={styles.btn} />
          <SecondaryButton title="Compress Another PDF" onPress={reset} style={styles.btn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PROCESSING ──
  if (status === 'processing') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.processingContainer}>
          <Text style={styles.processingIcon}>📦</Text>
          <Text style={styles.processingTitle}>Compressing…</Text>
          <Text style={styles.processingSubtitle}>Optimizing your PDF</Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={COLORS.compressPdf.icon} />
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Compress PDF</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {status === 'error' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {/* Pick PDF */}
          <TouchableOpacity
            style={[styles.pickZone, file && styles.pickZoneFilled]}
            onPress={pickPdf}
            activeOpacity={0.8}
          >
            {!file ? (
              <>
                <Text style={styles.pickZoneIcon}>📦</Text>
                <Text style={[styles.pickZoneTitle, { color: COLORS.compressPdf.icon }]}>
                  Select PDF File
                </Text>
                <Text style={styles.pickZoneSubtitle}>Tap to choose a PDF to compress</Text>
              </>
            ) : (
              <>
                <Text style={styles.pickZoneIconSm}>📄</Text>
                <Text style={styles.pickedName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.pickedMeta}>{formatFileSize(file.size)}</Text>
                <Text style={styles.changeTap}>Tap to change file</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Compression Level */}
          <View style={styles.levelSection}>
            <Text style={styles.levelTitle}>Compression Level</Text>
            <Text style={styles.levelSubtitle}>Choose how much to compress your PDF</Text>
            {COMPRESSION_LEVELS.map((lvl) => (
              <TouchableOpacity
                key={lvl.id}
                style={[styles.levelCard, level === lvl.id && styles.levelCardSelected]}
                onPress={() => setLevel(lvl.id)}
                activeOpacity={0.8}
              >
                <View style={styles.levelCardLeft}>
                  <Text style={styles.levelIcon}>{lvl.icon}</Text>
                  <View>
                    <View style={styles.levelLabelRow}>
                      <Text style={[styles.levelLabel, level === lvl.id && styles.levelLabelActive]}>
                        {lvl.label}
                      </Text>
                      {lvl.recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.levelDesc}>{lvl.description}</Text>
                  </View>
                </View>
                <View style={styles.levelRight}>
                  <Text style={styles.levelSavings}>{lvl.savings}</Text>
                  <Text style={styles.levelSavingsLabel}>savings</Text>
                  <View style={[styles.radio, level === lvl.id && styles.radioSelected]}>
                    {level === lvl.id && <View style={styles.radioDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Compress PDF"
          icon="📦"
          onPress={compress}
          disabled={!file}
          style={styles.actionBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.base, paddingBottom: 100 },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: COLORS.primary, fontWeight: FONTS.weights.bold },
  screenTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.text },

  pickZone: {
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: COLORS.compressPdf.icon,
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  pickZoneFilled: { borderStyle: 'solid', paddingVertical: SPACING.lg },
  pickZoneIcon: { fontSize: 44, marginBottom: 10 },
  pickZoneIconSm: { fontSize: 32, marginBottom: 8 },
  pickZoneTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, marginBottom: 4 },
  pickZoneSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  pickedName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
    maxWidth: '90%',
    marginBottom: 4,
  },
  pickedMeta: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: 6 },
  changeTap: { fontSize: FONTS.sizes.xs, color: COLORS.compressPdf.icon },

  levelSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  levelTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: 4 },
  levelSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  levelCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF3ED',
  },
  levelCardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  levelIcon: { fontSize: 24 },
  levelLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  levelLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  levelLabelActive: { color: COLORS.primary },
  levelDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  recommendedBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendedText: { fontSize: 9, color: COLORS.white, fontWeight: FONTS.weights.bold },
  levelRight: { alignItems: 'center', gap: 2 },
  levelSavings: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.extraBold,
    color: COLORS.success,
  },
  levelSavingsLabel: { fontSize: 9, color: COLORS.textLight, marginBottom: 4 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: { width: '100%' },

  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  processingIcon: { fontSize: 64, marginBottom: SPACING.lg },
  processingTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extraBold,
    color: COLORS.text,
    marginBottom: 6,
  },
  processingSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  progressWrap: { width: '100%', gap: 8 },
  progressText: {
    textAlign: 'center',
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.semiBold,
  },

  resultContainer: { flexGrow: 1, alignItems: 'center', padding: SPACING.xl, paddingTop: 60 },
  successIcon: { fontSize: 72, marginBottom: SPACING.md },
  resultTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extraBold,
    color: COLORS.text,
    marginBottom: 6,
  },
  resultSub: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
    marginBottom: SPACING.lg,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  resultValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  btn: { width: '100%', marginBottom: SPACING.sm },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: { fontSize: FONTS.sizes.sm, color: COLORS.error, fontWeight: FONTS.weights.medium },
});
