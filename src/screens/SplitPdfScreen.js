// src/screens/SplitPdfScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';
import { PrimaryButton, SecondaryButton, ProgressBar } from '../components/UIComponents';
import { splitPdf, getPdfPageCount } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';

export default function SplitPdfScreen({ navigation }) {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('');
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
        const asset = res.assets[0];
        setFile(asset);
        setErrorMsg('');
        setStatus('idle');
        // Count pages
        const count = await getPdfPageCount(asset.uri);
        setPageCount(count);
        setStartPage('1');
        setEndPage(count ? String(count) : '');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker');
    }
  };

  const split = async () => {
    const s = parseInt(startPage, 10);
    const e = parseInt(endPage, 10);

    if (!s || !e || s < 1 || e < s) {
      Alert.alert('Invalid Range', 'Please enter a valid page range (Start ≤ End).');
      return;
    }
    if (pageCount && (s > pageCount || e > pageCount)) {
      Alert.alert('Out of Range', `This PDF has ${pageCount} pages.`);
      return;
    }
    setStatus('processing');
    setProgress(0);
    setErrorMsg('');
    try {
      const res = await splitPdf(file.uri, s, e, setProgress);
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
    setPageCount(null);
    setStartPage('1');
    setEndPage('');
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
          <Text style={styles.successIcon}>✂️</Text>
          <Text style={styles.resultTitle}>PDF Split!</Text>
          <Text style={styles.resultSub}>Pages extracted successfully</Text>
          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Output File</Text>
              <Text style={styles.resultValue} numberOfLines={1}>{result.name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Pages (source)</Text>
              <Text style={styles.resultValue}>{result.totalPages}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Extracted Pages</Text>
              <Text style={styles.resultValue}>{result.extractedPages}</Text>
            </View>
          </View>
          <PrimaryButton title="Share / Save PDF" icon="📤" onPress={shareResult} style={styles.btn} />
          <SecondaryButton title="Split Another PDF" onPress={reset} style={styles.btn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PROCESSING ──
  if (status === 'processing') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.processingContainer}>
          <Text style={styles.processingIcon}>✂️</Text>
          <Text style={styles.processingTitle}>Splitting PDF…</Text>
          <Text style={styles.processingSubtitle}>
            Extracting pages {startPage}–{endPage}
          </Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={COLORS.splitPdf.icon} />
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
        <Text style={styles.screenTitle}>Split PDF</Text>
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
                <Text style={styles.pickZoneIcon}>✂️</Text>
                <Text style={[styles.pickZoneTitle, { color: COLORS.splitPdf.icon }]}>
                  Select PDF File
                </Text>
                <Text style={styles.pickZoneSubtitle}>Tap to choose a PDF</Text>
              </>
            ) : (
              <>
                <Text style={styles.pickZoneIconSm}>📄</Text>
                <Text style={styles.pickedName} numberOfLines={2}>{file.name}</Text>
                <Text style={styles.pickedMeta}>
                  {formatFileSize(file.size)}{pageCount ? ` · ${pageCount} pages` : ''}
                </Text>
                <Text style={styles.changeTap}>Tap to change file</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Page Range */}
          {file && (
            <View style={styles.rangeSection}>
              <Text style={styles.rangeLabel}>Page Range</Text>
              {pageCount && (
                <Text style={styles.rangeHint}>
                  This PDF has {pageCount} pages. Enter the pages you want to extract.
                </Text>
              )}
              <View style={styles.rangeInputs}>
                <View style={styles.rangeInputWrap}>
                  <Text style={styles.rangeInputLabel}>From Page</Text>
                  <TextInput
                    style={styles.rangeInput}
                    keyboardType="number-pad"
                    value={startPage}
                    onChangeText={setStartPage}
                    placeholder="1"
                    maxLength={5}
                  />
                </View>
                <View style={styles.rangeDivider}>
                  <Text style={styles.rangeDividerText}>to</Text>
                </View>
                <View style={styles.rangeInputWrap}>
                  <Text style={styles.rangeInputLabel}>To Page</Text>
                  <TextInput
                    style={styles.rangeInput}
                    keyboardType="number-pad"
                    value={endPage}
                    onChangeText={setEndPage}
                    placeholder={pageCount ? String(pageCount) : '?'}
                    maxLength={5}
                  />
                </View>
              </View>

              {/* Quick Select Presets */}
              {pageCount && (
                <View style={styles.presets}>
                  <Text style={styles.presetsLabel}>Quick Select</Text>
                  <View style={styles.presetRow}>
                    {[
                      { label: 'First Half', s: 1, e: Math.floor(pageCount / 2) },
                      { label: 'Second Half', s: Math.ceil(pageCount / 2) + 1, e: pageCount },
                      { label: 'First 5', s: 1, e: Math.min(5, pageCount) },
                    ].map((preset) => (
                      <TouchableOpacity
                        key={preset.label}
                        style={styles.presetBtn}
                        onPress={() => {
                          setStartPage(String(preset.s));
                          setEndPage(String(preset.e));
                        }}
                      >
                        <Text style={styles.presetBtnText}>{preset.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Split PDF"
          icon="✂️"
          onPress={split}
          disabled={!file || !startPage || !endPage}
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
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: COLORS.splitPdf.icon,
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  pickZoneFilled: {
    borderStyle: 'solid',
    paddingVertical: SPACING.lg,
    backgroundColor: '#F0FDF4',
  },
  pickZoneIcon: { fontSize: 44, marginBottom: 10 },
  pickZoneIconSm: { fontSize: 32, marginBottom: 8 },
  pickZoneTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    marginBottom: 4,
  },
  pickZoneSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  pickedName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  pickedMeta: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: 6 },
  changeTap: { fontSize: FONTS.sizes.xs, color: COLORS.splitPdf.icon },

  rangeSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  rangeLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  rangeHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  rangeInputWrap: { flex: 1 },
  rangeInputLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.semiBold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rangeInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
    backgroundColor: COLORS.background,
  },
  rangeDivider: { alignItems: 'center', paddingTop: 24 },
  rangeDividerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },
  presets: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
  presetsLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: FONTS.weights.semiBold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  presetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  presetBtn: {
    backgroundColor: COLORS.splitPdf.bg,
    borderWidth: 1,
    borderColor: COLORS.splitPdf.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  presetBtnText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.splitPdf.icon,
    fontWeight: FONTS.weights.semiBold,
  },
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
