import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useProGate } from '../components/ProGate';
import { PrimaryButton, SecondaryButton, ProgressBar, ScreenHeader } from '../components/UIComponents';
import { mergePdfs } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

export default function MergePdfScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { guard, modal } = useProGate();
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pickPdfs = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: true, copyToCacheDirectory: true });
      if (!res.canceled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFiles((prev) => [...prev, ...res.assets.map((a, i) => ({ ...a, key: `${Date.now()}-${i}` }))]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker');
    }
  };

  const removeFile = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFiles((prev) => prev.filter((f) => f.key !== key));
  };

  const merge = async () => {
    if (files.length < 2) {
      Alert.alert('Select at least 2 PDFs', 'You need 2 or more PDF files to merge.');
      return;
    }
    await guard(false, "You've used all 3 free operations today", async () => {
      setStatus('processing');
      setProgress(0);
      setErrorMsg('');
      try {
        const uris = files.map((f) => f.uri);
        const res = await mergePdfs(uris, setProgress);
        setResult(res);
        setStatus('done');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        setErrorMsg(e.message);
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

  const reset = () => { setFiles([]); setStatus('idle'); setProgress(0); setResult(null); setErrorMsg(''); };

  const renderDragItem = ({ item, drag, isActive }) => (
    <View style={[styles.fileRow, { backgroundColor: isActive ? colors.mergePdf?.icon + '18' : colors.surface, borderColor: isActive ? colors.mergePdf?.icon : colors.border }]}>
      <TouchableOpacity onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); drag(); }} delayLongPress={150}>
        <Ionicons name="reorder-three" size={22} color={colors.textLight} style={{ paddingHorizontal: 4 }} />
      </TouchableOpacity>
      <View style={[styles.fileOrderBadge, { backgroundColor: colors.mergePdf?.bg }]}>
        <Text style={[styles.fileOrderText, { color: colors.mergePdf?.icon }]}>{files.findIndex(f => f.key === item.key) + 1}</Text>
      </View>
      <View style={styles.fileInfo}>
        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.fileSize, { color: colors.textLight }]}>{formatFileSize(item.size)}</Text>
      </View>
      <TouchableOpacity onPress={() => removeFile(item.key)} style={styles.removeBtn}>
        <Ionicons name="close" size={14} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (status === 'done' && result) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.resultContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.mergePdf?.bg }]}>
            <Ionicons name="git-merge" size={56} color={colors.mergePdf?.icon} />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>PDFs Merged!</Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>{files.length} files combined into one PDF</Text>
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Output File</Text>
              <Text style={[styles.resultValue, { color: colors.text }]} numberOfLines={1}>{result.name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Files Merged</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{files.length}</Text>
            </View>
          </View>
          <PrimaryButton title="Share / Save PDF" iconName="share-outline" onPress={shareResult} style={styles.btn} />
          <SecondaryButton title="Merge More PDFs" onPress={reset} style={styles.btn} />
        </View>
        {modal}
      </SafeAreaView>
    );
  }

  if (status === 'processing') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.processingContainer}>
          <Ionicons name="git-merge" size={64} color={colors.mergePdf?.icon} />
          <Text style={[styles.processingTitle, { color: colors.text }]}>Merging PDFs…</Text>
          <Text style={[styles.processingSubtitle, { color: colors.textSecondary }]}>Combining {files.length} files</Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={colors.mergePdf?.icon} />
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
      <ScreenHeader title="Merge PDF" onBack={() => navigation.goBack()} />

      {status === 'error' && (
        <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
          <Ionicons name="warning" size={16} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.pickZone, { backgroundColor: colors.mergePdf?.bg || '#EEF2FF', borderColor: colors.mergePdf?.icon }]}
        onPress={pickPdfs}
        activeOpacity={0.8}
      >
        <Ionicons name="git-merge" size={44} color={colors.mergePdf?.icon} />
        <Text style={[styles.pickZoneTitle, { color: colors.mergePdf?.icon }]}>Select PDF Files</Text>
        <Text style={[styles.pickZoneSubtitle, { color: colors.textSecondary }]}>Long-press handle to reorder merge sequence</Text>
      </TouchableOpacity>

      <DraggableFlatList
        data={files}
        keyExtractor={(item) => item.key}
        onDragEnd={({ data }) => setFiles(data)}
        renderItem={renderDragItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          files.length > 0 ? (
            <TouchableOpacity style={[styles.addMoreBtn, { borderColor: colors.mergePdf?.icon }]} onPress={pickPdfs}>
              <Ionicons name="add-circle-outline" size={18} color={colors.mergePdf?.icon} />
              <Text style={[styles.addMoreText, { color: colors.mergePdf?.icon }]}>Add More PDFs</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <PrimaryButton
          title={files.length >= 2 ? `Merge ${files.length} PDFs` : 'Select at least 2 PDFs'}
          iconName="git-merge"
          onPress={merge}
          disabled={files.length < 2}
          style={styles.actionBtn}
        />
      </View>
      {modal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  pickZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    margin: SPACING.base,
    gap: 8,
  },
  pickZoneTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  pickZoneSubtitle: { fontSize: FONTS.sizes.sm, textAlign: 'center' },
  listContent: { paddingHorizontal: SPACING.base, paddingBottom: 100 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOW.sm,
  },
  fileOrderBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileOrderText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold },
  fileInfo: { flex: 1 },
  fileName: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold },
  fileSize: { fontSize: FONTS.sizes.xs, marginTop: 2 },
  removeBtn: { width: 28, height: 28, backgroundColor: '#FEE2E2', borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  addMoreBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.sm,
  },
  addMoreText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.base, borderTopWidth: 1 },
  actionBtn: { width: '100%' },
  processingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl, gap: 12 },
  processingTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.extraBold },
  processingSubtitle: { fontSize: FONTS.sizes.md },
  progressWrap: { width: '100%', gap: 8 },
  progressText: { textAlign: 'center', fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold },
  resultContainer: { flex: 1, alignItems: 'center', padding: SPACING.xl, paddingTop: 60 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  resultTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.extraBold, marginBottom: 6 },
  resultSub: { fontSize: FONTS.sizes.md, marginBottom: SPACING.xl, textAlign: 'center' },
  resultCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, width: '100%', marginBottom: SPACING.xl, borderWidth: 1, ...SHADOW.sm },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  resultLabel: { fontSize: FONTS.sizes.sm },
  resultValue: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold, maxWidth: '60%', textAlign: 'right' },
  btn: { width: '100%', marginBottom: SPACING.sm },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, padding: SPACING.md, marginHorizontal: SPACING.base, borderWidth: 1 },
  errorText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, flex: 1 },
});
