// src/screens/MergePdfScreen.js
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
import { PrimaryButton, SecondaryButton, SectionHeader, ProgressBar, FileItem } from '../components/UIComponents';
import { mergePdfs } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';

export default function MergePdfScreen({ navigation }) {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pickPdfs = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!res.canceled) {
        setFiles((prev) => [...prev, ...res.assets]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker');
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const arr = [...files];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setFiles(arr);
  };

  const moveDown = (index) => {
    if (index === files.length - 1) return;
    const arr = [...files];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    setFiles(arr);
  };

  const merge = async () => {
    if (files.length < 2) {
      Alert.alert('Select at least 2 PDFs', 'You need 2 or more PDF files to merge.');
      return;
    }
    setStatus('processing');
    setProgress(0);
    setErrorMsg('');
    try {
      const uris = files.map((f) => f.uri);
      const res = await mergePdfs(uris, setProgress);
      setResult(res);
      setStatus('done');
    } catch (e) {
      setErrorMsg(e.message);
      setStatus('error');
    }
  };

  const shareResult = async () => {
    if (result?.path && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(result.path, { mimeType: 'application/pdf' });
    }
  };

  const reset = () => {
    setFiles([]);
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
          <Text style={styles.successIcon}>🔗</Text>
          <Text style={styles.resultTitle}>PDFs Merged!</Text>
          <Text style={styles.resultSub}>{files.length} files combined into one PDF</Text>
          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Output File</Text>
              <Text style={styles.resultValue} numberOfLines={1}>{result.name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Files Merged</Text>
              <Text style={styles.resultValue}>{files.length}</Text>
            </View>
          </View>
          <PrimaryButton title="Share / Save PDF" icon="📤" onPress={shareResult} style={styles.btn} />
          <SecondaryButton title="Merge More PDFs" onPress={reset} style={styles.btn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PROCESSING ──
  if (status === 'processing') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.processingContainer}>
          <Text style={styles.processingIcon}>🔗</Text>
          <Text style={styles.processingTitle}>Merging PDFs…</Text>
          <Text style={styles.processingSubtitle}>Combining {files.length} files</Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={COLORS.mergePdf.icon} />
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
        <Text style={styles.screenTitle}>Merge PDF</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {status === 'error' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.pickZone} onPress={pickPdfs} activeOpacity={0.8}>
            <Text style={styles.pickZoneIcon}>🔗</Text>
            <Text style={styles.pickZoneTitle}>Select PDF Files</Text>
            <Text style={styles.pickZoneSubtitle}>Select 2 or more PDFs to merge</Text>
          </TouchableOpacity>

          {files.length > 0 && (
            <View style={styles.filesSection}>
              <SectionHeader
                title={`Files (${files.length})`}
                subtitle="Drag arrows to reorder merge sequence"
              />
              {files.map((file, index) => (
                <View key={index} style={styles.fileRow}>
                  <View style={styles.fileOrder}>
                    <Text style={styles.fileOrderText}>{index + 1}</Text>
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                  </View>
                  <View style={styles.fileControls}>
                    <TouchableOpacity onPress={() => moveUp(index)} style={styles.arrowBtn}>
                      <Text style={styles.arrowText}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveDown(index)} style={styles.arrowBtn}>
                      <Text style={styles.arrowText}>↓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeFile(index)} style={styles.removeBtn}>
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addMoreBtn} onPress={pickPdfs}>
                <Text style={styles.addMoreText}>+ Add More PDFs</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title={files.length >= 2 ? `Merge ${files.length} PDFs` : 'Select at least 2 PDFs'}
          icon="🔗"
          onPress={merge}
          disabled={files.length < 2}
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
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: COLORS.mergePdf.icon,
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  pickZoneIcon: { fontSize: 44, marginBottom: 10 },
  pickZoneTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.mergePdf.icon,
    marginBottom: 4,
  },
  pickZoneSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  filesSection: { marginBottom: SPACING.base },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOW.sm,
  },
  fileOrder: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.mergePdf.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileOrderText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.mergePdf.icon,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold, color: COLORS.text },
  fileSize: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },
  fileControls: { flexDirection: 'row', gap: 4 },
  arrowBtn: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 13, color: COLORS.text },
  removeBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#FEE2E2',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontSize: 11, color: COLORS.error },
  addMoreBtn: {
    borderWidth: 1,
    borderColor: COLORS.mergePdf.icon,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  addMoreText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.mergePdf.icon,
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
