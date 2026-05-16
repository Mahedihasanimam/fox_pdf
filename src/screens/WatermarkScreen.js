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
import { addWatermark } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

const PRESETS = ['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'DO NOT COPY', 'APPROVED'];
const OPACITIES = [{ label: 'Light', value: 0.15 }, { label: 'Medium', value: 0.25 }, { label: 'Dark', value: 0.4 }];

export default function WatermarkScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { guard, modal } = useProGate();
  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.25);
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

  const applyWatermark = async () => {
    if (!file || !watermarkText.trim()) return;
    await guard(false, "You've used all 3 free operations today", async () => {
      setStatus('processing');
      setProgress(0);
      setErrorMsg('');
      try {
        const res = await addWatermark(file.uri, watermarkText.trim().toUpperCase(), opacity, setProgress);
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

  const reset = () => { setFile(null); setStatus('idle'); setProgress(0); setResult(null); setErrorMsg(''); };

  if (status === 'done' && result) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.watermark?.bg }]}>
            <Ionicons name="shield-checkmark" size={56} color={colors.watermark?.icon} />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>Watermark Added!</Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>"{watermarkText}" applied to all pages</Text>
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Output File</Text>
              <Text style={[styles.resultValue, { color: colors.text }]} numberOfLines={1}>{result.name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Watermark</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{watermarkText}</Text>
            </View>
          </View>
          <PrimaryButton title="Share / Save PDF" iconName="share-outline" onPress={shareResult} style={styles.btn} />
          <SecondaryButton title="Watermark Another PDF" onPress={reset} style={styles.btn} />
        </ScrollView>
        {modal}
      </SafeAreaView>
    );
  }

  if (status === 'processing') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.processingContainer}>
          <Ionicons name="shield-checkmark" size={64} color={colors.watermark?.icon} />
          <Text style={[styles.processingTitle, { color: colors.text }]}>Adding Watermark…</Text>
          <Text style={[styles.processingSubtitle, { color: colors.textSecondary }]}>Stamping all pages</Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={colors.watermark?.icon} />
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
      <ScreenHeader title="Watermark PDF" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {status === 'error' && (
            <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Ionicons name="warning" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.pickZone, file ? styles.pickZoneFilled : {}, { backgroundColor: colors.watermark?.bg, borderColor: colors.watermark?.icon }]}
            onPress={pickPdf}
            activeOpacity={0.8}
          >
            {!file ? (
              <>
                <Ionicons name="shield-checkmark" size={44} color={colors.watermark?.icon} />
                <Text style={[styles.pickZoneTitle, { color: colors.watermark?.icon }]}>Select PDF File</Text>
                <Text style={[styles.pickZoneSubtitle, { color: colors.textSecondary }]}>Tap to choose a PDF</Text>
              </>
            ) : (
              <>
                <Ionicons name="document-text" size={32} color={colors.watermark?.icon} />
                <Text style={[styles.pickedName, { color: colors.text }]} numberOfLines={1}>{file.name}</Text>
                <Text style={[styles.pickedMeta, { color: colors.textSecondary }]}>{formatFileSize(file.size)}</Text>
                <Text style={[styles.changeTap, { color: colors.watermark?.icon }]}>Tap to change</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Watermark Text */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Watermark Text</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              value={watermarkText}
              onChangeText={setWatermarkText}
              placeholder="e.g. CONFIDENTIAL"
              placeholderTextColor={colors.textLight}
              autoCapitalize="characters"
              maxLength={30}
            />
            <View style={styles.presetsRow}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetChip, { backgroundColor: watermarkText === p ? colors.watermark?.bg : colors.surfaceAlt, borderColor: watermarkText === p ? colors.watermark?.icon : colors.border }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWatermarkText(p); }}
                >
                  <Text style={[styles.presetChipText, { color: watermarkText === p ? colors.watermark?.icon : colors.textSecondary }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={[styles.previewBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={[styles.previewLabel, { color: colors.textLight }]}>PREVIEW (diagonal watermark)</Text>
            <View style={styles.previewPage}>
              <Text style={[styles.previewWatermark, { color: `rgba(128,128,128,${opacity + 0.1})` }]}>
                {watermarkText || 'WATERMARK'}
              </Text>
              <Text style={[styles.previewLines, { color: colors.textLight }]}>▬▬▬▬▬▬▬▬▬▬{'\n'}▬▬▬▬▬▬▬{'\n'}▬▬▬▬▬▬▬▬▬</Text>
            </View>
          </View>

          {/* Opacity */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Opacity</Text>
            <View style={styles.opacityRow}>
              {OPACITIES.map((o) => (
                <TouchableOpacity
                  key={o.label}
                  style={[styles.opacityBtn, { borderColor: opacity === o.value ? colors.watermark?.icon : colors.border, backgroundColor: opacity === o.value ? colors.watermark?.bg : colors.background }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpacity(o.value); }}
                >
                  <Text style={[styles.opacityLabel, { color: opacity === o.value ? colors.watermark?.icon : colors.text }]}>{o.label}</Text>
                  <Text style={[styles.opacityPct, { color: colors.textSecondary }]}>{Math.round(o.value * 100)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <PrimaryButton
          title="Add Watermark"
          iconName="shield-checkmark"
          onPress={applyWatermark}
          disabled={!file || !watermarkText.trim()}
          style={styles.actionBtn}
        />
      </View>
      {modal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.base, paddingBottom: 100 },
  pickZone: { borderWidth: 2, borderStyle: 'dashed', borderRadius: RADIUS.xl, padding: SPACING.xxl, alignItems: 'center', marginBottom: SPACING.md, gap: 8 },
  pickZoneFilled: { borderStyle: 'solid', paddingVertical: SPACING.lg },
  pickZoneTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  pickZoneSubtitle: { fontSize: FONTS.sizes.sm },
  pickedName: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, textAlign: 'center', maxWidth: '90%' },
  pickedMeta: { fontSize: FONTS.sizes.sm },
  changeTap: { fontSize: FONTS.sizes.xs },
  section: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.md, ...SHADOW.sm },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, marginBottom: SPACING.sm },
  textInput: { borderWidth: 1.5, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, marginBottom: SPACING.md, textAlign: 'center', letterSpacing: 1 },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  presetChipText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semiBold },
  previewBox: { borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, marginBottom: SPACING.md, alignItems: 'center' },
  previewLabel: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semiBold, letterSpacing: 1, marginBottom: SPACING.sm, textTransform: 'uppercase' },
  previewPage: { width: '80%', aspectRatio: 0.707, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' },
  previewWatermark: { position: 'absolute', fontSize: 20, fontWeight: '800', transform: [{ rotate: '-35deg' }], letterSpacing: 2 },
  previewLines: { fontSize: 8, lineHeight: 14, color: '#ccc', textAlign: 'left', alignSelf: 'flex-start', margin: 16 },
  opacityRow: { flexDirection: 'row', gap: SPACING.sm },
  opacityBtn: { flex: 1, borderWidth: 1.5, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', gap: 4 },
  opacityLabel: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold },
  opacityPct: { fontSize: FONTS.sizes.xs },
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
  resultSub: { fontSize: FONTS.sizes.md, marginBottom: SPACING.xl, textAlign: 'center' },
  resultCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, width: '100%', marginBottom: SPACING.xl, borderWidth: 1, ...SHADOW.sm },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  resultLabel: { fontSize: FONTS.sizes.sm },
  resultValue: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold, maxWidth: '60%', textAlign: 'right' },
  btn: { width: '100%', marginBottom: SPACING.sm },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1 },
  errorText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, flex: 1 },
});
