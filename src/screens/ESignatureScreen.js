import React, { useState, useRef } from 'react';
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
import SignatureCanvas from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { usePro } from '../context/ProContext';
import { PaywallModal } from '../components/ProGate';
import { PrimaryButton, SecondaryButton, ProgressBar, ScreenHeader } from '../components/UIComponents';
import { embedSignature } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

const SIGN_STEPS = ['select', 'sign', 'processing', 'done', 'error'];

export default function ESignatureScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { isPro } = usePro();
  const sigRef = useRef(null);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('select');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [paywallVisible, setPaywallVisible] = useState(false);

  const pickPdf = async () => {
    if (!isPro) { setPaywallVisible(true); return; }
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!res.canceled && res.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFile(res.assets[0]);
        setStep('sign');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker');
    }
  };

  const handleSignatureOK = async (signature) => {
    if (!signature || !file) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep('processing');
    setProgress(0);
    try {
      const res = await embedSignature(file.uri, signature, setProgress);
      setResult(res);
      setStep('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setErrorMsg(e.message);
      setStep('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const shareResult = async () => {
    if (result?.path && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(result.path, { mimeType: 'application/pdf' });
    }
  };

  const reset = () => { setFile(null); setStep('select'); setProgress(0); setResult(null); setErrorMsg(''); };

  const signatureStyle = `
    .m-signature-pad { box-shadow: none; border: 2px dashed ${colors.eSignature?.icon || '#A855F7'}; border-radius: 12px; }
    .m-signature-pad--body { background: ${colors.surface}; border-radius: 10px; }
    .m-signature-pad--footer { display: none; }
    body { margin: 0; padding: 8px; background: ${colors.background}; }
  `;

  if (step === 'done' && result) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.eSignature?.bg }]}>
            <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>Signed!</Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>Signature embedded on the last page</Text>
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>File</Text>
              <Text style={[styles.resultValue, { color: colors.text }]} numberOfLines={1}>{result.name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Position</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>Bottom-right, last page</Text>
            </View>
          </View>
          <PrimaryButton title="Share / Save PDF" iconName="share-outline" onPress={shareResult} style={styles.btn} />
          <SecondaryButton title="Sign Another PDF" onPress={reset} style={styles.btn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 'processing') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.processingContainer}>
          <Ionicons name="create" size={64} color={colors.eSignature?.icon} />
          <Text style={[styles.processingTitle, { color: colors.text }]}>Embedding Signature…</Text>
          <Text style={[styles.processingSubtitle, { color: colors.textSecondary }]}>Adding your signature to the PDF</Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={colors.eSignature?.icon} />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'sign') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ScreenHeader
          title="Draw Signature"
          onBack={() => setStep('select')}
          rightAction={
            <TouchableOpacity onPress={() => sigRef.current?.clearSignature()} style={styles.clearBtn}>
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          }
        />
        <View style={[styles.sigInfo, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="information-circle" size={14} color={colors.textSecondary} />
          <Text style={[styles.sigInfoText, { color: colors.textSecondary }]}>
            Draw your signature below, then tap "Apply Signature"
          </Text>
        </View>
        <View style={styles.sigContainer}>
          <SignatureCanvas
            ref={sigRef}
            onOK={handleSignatureOK}
            onEmpty={() => Alert.alert('Empty', 'Please draw your signature first.')}
            webStyle={signatureStyle}
            autoClear={false}
            descriptionText=""
            confirmLabelTitle="Apply Signature"
            clearLabelTitle=""
            imageType="image/png"
          />
        </View>
        <View style={[styles.sigActions, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <SecondaryButton title="Clear" iconName="refresh" onPress={() => sigRef.current?.clearSignature()} style={{ flex: 1 }} />
          <PrimaryButton title="Apply Signature" iconName="checkmark" onPress={() => sigRef.current?.readSignature()} style={{ flex: 2 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="E-Signature" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {!isPro && (
            <TouchableOpacity
              style={[styles.proBanner, { backgroundColor: '#FFD70020', borderColor: '#FFD700' }]}
              onPress={() => setPaywallVisible(true)}
            >
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.proBannerText, { color: '#7B5800' }]}>E-Signature is a Pro feature — Tap to upgrade</Text>
              <Ionicons name="chevron-forward" size={16} color="#7B5800" />
            </TouchableOpacity>
          )}

          {step === 'error' && (
            <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Ionicons name="warning" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.pickZone, { backgroundColor: colors.eSignature?.bg, borderColor: colors.eSignature?.icon }]}
            onPress={pickPdf}
            activeOpacity={0.8}
          >
            <Ionicons name="create" size={44} color={colors.eSignature?.icon} />
            <Text style={[styles.pickZoneTitle, { color: colors.eSignature?.icon }]}>Select PDF to Sign</Text>
            <Text style={[styles.pickZoneSubtitle, { color: colors.textSecondary }]}>
              {isPro ? 'Draw your signature on the PDF' : '🔒 Upgrade to Pro to unlock'}
            </Text>
          </TouchableOpacity>

          <View style={[styles.howBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.howTitle, { color: colors.text }]}>How it works</Text>
            {[
              { icon: 'document-text', text: 'Select the PDF you want to sign' },
              { icon: 'create', text: 'Draw your signature on screen' },
              { icon: 'checkmark-circle', text: 'Signature is placed on the last page' },
              { icon: 'share-outline', text: 'Share or save the signed PDF' },
            ].map((step, i) => (
              <View key={i} style={styles.howRow}>
                <View style={[styles.howNum, { backgroundColor: colors.eSignature?.icon + '20' }]}>
                  <Text style={[styles.howNumText, { color: colors.eSignature?.icon }]}>{i + 1}</Text>
                </View>
                <Ionicons name={step.icon} size={16} color={colors.eSignature?.icon} />
                <Text style={[styles.howText, { color: colors.textSecondary }]}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        reason="E-Signature is a Pro feature"
        onClose={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.base, paddingBottom: SPACING.xxl },
  proBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1 },
  proBannerText: { flex: 1, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold },
  pickZone: { borderWidth: 2, borderStyle: 'dashed', borderRadius: RADIUS.xl, padding: SPACING.xxl, alignItems: 'center', marginBottom: SPACING.lg, gap: 8 },
  pickZoneTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  pickZoneSubtitle: { fontSize: FONTS.sizes.sm, textAlign: 'center' },
  howBox: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, ...SHADOW.sm, gap: SPACING.sm },
  howTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, marginBottom: 4 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  howNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  howNumText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.extraBold },
  howText: { flex: 1, fontSize: FONTS.sizes.sm },
  sigInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.sm, paddingHorizontal: SPACING.base },
  sigInfoText: { fontSize: FONTS.sizes.xs, flex: 1 },
  sigContainer: { flex: 1, margin: SPACING.base },
  clearBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sigActions: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.base, borderTopWidth: 1 },
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
