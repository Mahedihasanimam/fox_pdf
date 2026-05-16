import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { usePro } from '../context/ProContext';
import { PaywallModal } from '../components/ProGate';
import { PrimaryButton, SecondaryButton, ProgressBar, ScreenHeader } from '../components/UIComponents';
import { imagesToPdf } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

export default function CameraScanScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { isPro } = usePro();
  const [scannedImages, setScannedImages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [paywallVisible, setPaywallVisible] = useState(false);

  const scanWithCamera = async () => {
    if (!isPro) {
      setPaywallVisible(true);
      return;
    }
    const { status: camPerm } = await ImagePicker.requestCameraPermissionsAsync();
    if (camPerm !== 'granted') {
      Alert.alert('Permission Required', 'FoxPDF needs camera access to scan documents.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
      aspect: [4, 3],
    });
    if (!res.canceled && res.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScannedImages((prev) => [...prev, { ...res.assets[0], key: `${Date.now()}` }]);
    }
  };

  const removeImage = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScannedImages((prev) => prev.filter((img) => img.key !== key));
  };

  const convert = async () => {
    if (scannedImages.length === 0) return;
    setStatus('processing');
    setProgress(0);
    setErrorMsg('');
    try {
      const uris = scannedImages.map((img) => img.uri);
      const res = await imagesToPdf(uris, setProgress);
      setResult(res);
      setStatus('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setErrorMsg(e.message);
      setStatus('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const shareResult = async () => {
    if (result?.path && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(result.path, { mimeType: 'application/pdf' });
    }
  };

  const reset = () => { setScannedImages([]); setStatus('idle'); setProgress(0); setResult(null); setErrorMsg(''); };

  if (status === 'done' && result) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.cameraScan?.bg }]}>
            <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>Scan Complete!</Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>
            {scannedImages.length} page{scannedImages.length > 1 ? 's' : ''} converted to PDF
          </Text>
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>File</Text>
              <Text style={[styles.resultValue, { color: colors.text }]} numberOfLines={1}>{result.name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Pages</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{scannedImages.length}</Text>
            </View>
          </View>
          <PrimaryButton title="Share / Save PDF" iconName="share-outline" onPress={shareResult} style={styles.btn} />
          <SecondaryButton title="Scan Another Document" onPress={reset} style={styles.btn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (status === 'processing') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.processingContainer}>
          <Ionicons name="camera" size={64} color={colors.cameraScan?.icon} />
          <Text style={[styles.processingTitle, { color: colors.text }]}>Creating PDF…</Text>
          <Text style={[styles.processingSubtitle, { color: colors.textSecondary }]}>
            Processing {scannedImages.length} scanned page{scannedImages.length > 1 ? 's' : ''}
          </Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={colors.cameraScan?.icon} />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Camera Scan" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Pro badge */}
          {!isPro && (
            <TouchableOpacity
              style={[styles.proBanner, { backgroundColor: '#FFD70020', borderColor: '#FFD700' }]}
              onPress={() => setPaywallVisible(true)}
            >
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.proBannerText, { color: '#7B5800' }]}>
                Camera Scan is a Pro feature — Tap to upgrade
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#7B5800" />
            </TouchableOpacity>
          )}

          {status === 'error' && (
            <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Ionicons name="warning" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
            </View>
          )}

          {/* Scan Button */}
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: colors.cameraScan?.bg, borderColor: colors.cameraScan?.icon }]}
            onPress={scanWithCamera}
            activeOpacity={0.8}
          >
            <View style={[styles.scanBtnInner, { backgroundColor: (colors.cameraScan?.icon || '#3B82F6') + '22' }]}>
              <Ionicons name="camera" size={56} color={colors.cameraScan?.icon} />
            </View>
            <Text style={[styles.scanBtnTitle, { color: colors.cameraScan?.icon }]}>Tap to Scan</Text>
            <Text style={[styles.scanBtnSub, { color: colors.textSecondary }]}>
              {isPro ? 'Auto-crop after capture' : '🔒 Pro feature — upgrade to unlock'}
            </Text>
          </TouchableOpacity>

          {/* Scanned Pages */}
          {scannedImages.length > 0 && (
            <View style={[styles.pagesSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.pagesTitle, { color: colors.text }]}>Scanned Pages ({scannedImages.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pagesScroll}>
                {scannedImages.map((img) => (
                  <View key={img.key} style={styles.pageThumb}>
                    <Image source={{ uri: img.uri }} style={styles.pageThumbImg} />
                    <TouchableOpacity
                      style={[styles.pageRemoveBtn, { backgroundColor: colors.error }]}
                      onPress={() => removeImage(img.key)}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.addPageBtn, { borderColor: colors.cameraScan?.icon, backgroundColor: colors.cameraScan?.bg }]}
                  onPress={scanWithCamera}
                >
                  <Ionicons name="add" size={28} color={colors.cameraScan?.icon} />
                  <Text style={[styles.addPageText, { color: colors.cameraScan?.icon }]}>Add page</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          <View style={[styles.tipsBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips for best results</Text>
            {['Good lighting reduces noise', 'Hold camera steady above document', 'Crop to edges using the built-in editor', 'Add multiple pages for multi-page PDFs'].map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {scannedImages.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <PrimaryButton
            title={`Create PDF (${scannedImages.length} page${scannedImages.length > 1 ? 's' : ''})`}
            iconName="document-text"
            onPress={convert}
            style={styles.actionBtn}
          />
        </View>
      )}

      <PaywallModal
        visible={paywallVisible}
        reason="Camera Scan to PDF is a Pro feature"
        onClose={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.base, paddingBottom: 100 },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  proBannerText: { flex: 1, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold },
  scanBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: 12,
  },
  scanBtnInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.extraBold },
  scanBtnSub: { fontSize: FONTS.sizes.sm, textAlign: 'center' },
  pagesSection: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  pagesTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, marginBottom: SPACING.md },
  pagesScroll: { flexDirection: 'row' },
  pageThumb: { position: 'relative', marginRight: SPACING.sm },
  pageThumbImg: { width: 80, height: 110, borderRadius: 8, backgroundColor: '#ddd' },
  pageRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPageBtn: {
    width: 80,
    height: 110,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPageText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semiBold },
  tipsBox: { borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, gap: 8 },
  tipsTitle: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { fontSize: FONTS.sizes.xs, flex: 1 },
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
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  resultLabel: { fontSize: FONTS.sizes.sm },
  resultValue: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold, maxWidth: '60%', textAlign: 'right' },
  btn: { width: '100%', marginBottom: SPACING.sm },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1 },
  errorText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, flex: 1 },
});
