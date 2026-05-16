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
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useProGate } from '../components/ProGate';
import { PrimaryButton, SecondaryButton, ProgressBar, ScreenHeader } from '../components/UIComponents';
import { splitPdf, splitAllPages, getPdfPageCount } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

const SPLIT_MODES = [
  { id: 'range', label: 'Page Range', icon: 'cut', desc: 'Extract specific pages' },
  { id: 'all', label: 'Split All Pages', icon: 'copy', desc: 'Each page as a separate PDF' },
];

export default function SplitPdfScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { guard, modal } = useProGate();
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('');
  const [splitMode, setSplitMode] = useState('range');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!res.canceled && res.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const asset = res.assets[0];
        setFile(asset);
        setErrorMsg('');
        setStatus('idle');
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
    await guard(false, "You've used all 3 free operations today", async () => {
      if (splitMode === 'all') {
        setStatus('processing');
        setProgress(0);
        try {
          const res = await splitAllPages(file.uri, setProgress);
          setResult({ ...res, mode: 'all' });
          setStatus('done');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
          setErrorMsg(err.message);
          setStatus('error');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }
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
        setResult({ ...res, mode: 'range' });
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

  const reset = () => { setFile(null); setPageCount(null); setStartPage('1'); setEndPage(''); setStatus('idle'); setProgress(0); setResult(null); setErrorMsg(''); };

  if (status === 'done' && result) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.splitPdf?.bg }]}>
            <Ionicons name="cut" size={56} color={colors.splitPdf?.icon} />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>PDF Split!</Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>
            {result.mode === 'all' ? `${result.totalPages} separate PDFs created` : 'Pages extracted successfully'}
          </Text>
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {result.mode === 'range' ? (
              <>
                <ResultRow label="Output File" value={result.name} colors={colors} />
                <ResultRow label="Total Pages (source)" value={String(result.totalPages)} colors={colors} />
                <ResultRow label="Extracted Pages" value={String(result.extractedPages)} colors={colors} last />
              </>
            ) : (
              <>
                <ResultRow label="Mode" value="Split All Pages" colors={colors} />
                <ResultRow label="PDFs Created" value={String(result.totalPages)} colors={colors} />
                <ResultRow label="Saved To" value="FoxPDF folder" colors={colors} last />
              </>
            )}
          </View>
          {result.mode === 'range' && (
            <PrimaryButton title="Share / Save PDF" iconName="share-outline" onPress={shareResult} style={styles.btn} />
          )}
          <SecondaryButton title="Split Another PDF" onPress={reset} style={styles.btn} />
        </ScrollView>
        {modal}
      </SafeAreaView>
    );
  }

  if (status === 'processing') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.processingContainer}>
          <Ionicons name="cut" size={64} color={colors.splitPdf?.icon} />
          <Text style={[styles.processingTitle, { color: colors.text }]}>Splitting PDF…</Text>
          <Text style={[styles.processingSubtitle, { color: colors.textSecondary }]}>
            {splitMode === 'all' ? 'Creating individual page PDFs' : `Extracting pages ${startPage}–${endPage}`}
          </Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={colors.splitPdf?.icon} />
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
      <ScreenHeader title="Split PDF" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {status === 'error' && (
            <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Ionicons name="warning" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.pickZone, file ? styles.pickZoneFilled : {}, { backgroundColor: colors.splitPdf?.bg || '#F0FDF4', borderColor: colors.splitPdf?.icon }]}
            onPress={pickPdf}
            activeOpacity={0.8}
          >
            {!file ? (
              <>
                <Ionicons name="cut" size={44} color={colors.splitPdf?.icon} />
                <Text style={[styles.pickZoneTitle, { color: colors.splitPdf?.icon }]}>Select PDF File</Text>
                <Text style={[styles.pickZoneSubtitle, { color: colors.textSecondary }]}>Tap to choose a PDF</Text>
              </>
            ) : (
              <>
                <Ionicons name="document-text" size={32} color={colors.splitPdf?.icon} />
                <Text style={[styles.pickedName, { color: colors.text }]} numberOfLines={2}>{file.name}</Text>
                <Text style={[styles.pickedMeta, { color: colors.textSecondary }]}>
                  {formatFileSize(file.size)}{pageCount ? ` · ${pageCount} pages` : ''}
                </Text>
                <Text style={[styles.changeTap, { color: colors.splitPdf?.icon }]}>Tap to change file</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Split Mode Selector */}
          {file && (
            <View style={[styles.modeSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.modeTitle, { color: colors.text }]}>Split Mode</Text>
              <View style={styles.modeRow}>
                {SPLIT_MODES.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.modeCard, { borderColor: splitMode === m.id ? colors.splitPdf?.icon : colors.border, backgroundColor: splitMode === m.id ? colors.splitPdf?.bg : colors.background }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSplitMode(m.id); }}
                  >
                    <Ionicons name={m.icon} size={20} color={splitMode === m.id ? colors.splitPdf?.icon : colors.textSecondary} />
                    <Text style={[styles.modeLabel, { color: splitMode === m.id ? colors.splitPdf?.icon : colors.text }]}>{m.label}</Text>
                    <Text style={[styles.modeDesc, { color: colors.textSecondary }]}>{m.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {file && splitMode === 'range' && (
            <View style={[styles.rangeSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.rangeLabel, { color: colors.text }]}>Page Range</Text>
              {pageCount && (
                <Text style={[styles.rangeHint, { color: colors.textSecondary }]}>
                  This PDF has {pageCount} pages. Enter the range to extract.
                </Text>
              )}
              <View style={styles.rangeInputs}>
                <View style={styles.rangeInputWrap}>
                  <Text style={[styles.rangeInputLabel, { color: colors.textSecondary }]}>FROM PAGE</Text>
                  <TextInput
                    style={[styles.rangeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    keyboardType="number-pad"
                    value={startPage}
                    onChangeText={setStartPage}
                    placeholder="1"
                    placeholderTextColor={colors.textLight}
                    maxLength={5}
                  />
                </View>
                <Text style={[styles.rangeDividerText, { color: colors.textSecondary }]}>to</Text>
                <View style={styles.rangeInputWrap}>
                  <Text style={[styles.rangeInputLabel, { color: colors.textSecondary }]}>TO PAGE</Text>
                  <TextInput
                    style={[styles.rangeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    keyboardType="number-pad"
                    value={endPage}
                    onChangeText={setEndPage}
                    placeholder={pageCount ? String(pageCount) : '?'}
                    placeholderTextColor={colors.textLight}
                    maxLength={5}
                  />
                </View>
              </View>

              {pageCount && (
                <View style={styles.presets}>
                  <Text style={[styles.presetsLabel, { color: colors.textLight }]}>QUICK SELECT</Text>
                  <View style={styles.presetRow}>
                    {[
                      { label: 'First Half', s: 1, e: Math.floor(pageCount / 2) },
                      { label: 'Second Half', s: Math.ceil(pageCount / 2) + 1, e: pageCount },
                      { label: 'First 5', s: 1, e: Math.min(5, pageCount) },
                    ].map((p) => (
                      <TouchableOpacity
                        key={p.label}
                        style={[styles.presetBtn, { backgroundColor: colors.splitPdf?.bg, borderColor: colors.splitPdf?.border }]}
                        onPress={() => { setStartPage(String(p.s)); setEndPage(String(p.e)); }}
                      >
                        <Text style={[styles.presetBtnText, { color: colors.splitPdf?.icon }]}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <PrimaryButton
          title={splitMode === 'all' ? 'Split All Pages' : 'Split PDF'}
          iconName="cut"
          onPress={split}
          disabled={!file || (splitMode === 'range' && (!startPage || !endPage))}
          style={styles.actionBtn}
        />
      </View>
      {modal}
    </SafeAreaView>
  );
}

function ResultRow({ label, value, colors, last }) {
  return (
    <View style={[styles.resultRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.resultValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.base, paddingBottom: 100 },
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
  modeSection: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.md, ...SHADOW.sm },
  modeTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, marginBottom: SPACING.md },
  modeRow: { flexDirection: 'row', gap: SPACING.sm },
  modeCard: {
    flex: 1, borderWidth: 1.5, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', gap: 4,
  },
  modeLabel: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, textAlign: 'center' },
  modeDesc: { fontSize: FONTS.sizes.xs, textAlign: 'center' },
  rangeSection: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, ...SHADOW.sm },
  rangeLabel: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, marginBottom: 4 },
  rangeHint: { fontSize: FONTS.sizes.sm, marginBottom: SPACING.md },
  rangeInputs: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  rangeInputWrap: { flex: 1 },
  rangeInputLabel: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semiBold, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  rangeInput: { borderWidth: 1.5, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, textAlign: 'center' },
  rangeDividerText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, paddingTop: 24 },
  presets: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: SPACING.md },
  presetsLabel: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semiBold, letterSpacing: 1, marginBottom: SPACING.sm, textTransform: 'uppercase' },
  presetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  presetBtn: { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 6 },
  presetBtnText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semiBold },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.base, borderTopWidth: 1 },
  actionBtn: { width: '100%' },
  processingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl, gap: 12 },
  processingTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.extraBold },
  processingSubtitle: { fontSize: FONTS.sizes.md, textAlign: 'center' },
  progressWrap: { width: '100%', gap: 8 },
  progressText: { textAlign: 'center', fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold },
  resultContainer: { flexGrow: 1, alignItems: 'center', padding: SPACING.xl, paddingTop: 60 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  resultTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.extraBold, marginBottom: 6 },
  resultSub: { fontSize: FONTS.sizes.md, marginBottom: SPACING.xl, textAlign: 'center' },
  resultCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, width: '100%', marginBottom: SPACING.xl, borderWidth: 1, ...SHADOW.sm },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  resultLabel: { fontSize: FONTS.sizes.sm },
  resultValue: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold, maxWidth: '60%', textAlign: 'right' },
  btn: { width: '100%', marginBottom: SPACING.sm },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1 },
  errorText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, flex: 1 },
});
