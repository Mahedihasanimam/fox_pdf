import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useProGate } from '../components/ProGate';
import { PrimaryButton, SecondaryButton, ProgressBar, ScreenHeader } from '../components/UIComponents';
import { managePages, getPdfPageCount } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

export default function PageManagerScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { guard, modal } = useProGate();
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]); // [{index, label, rotation, deleted}]
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
        setStatus('idle');
        setResult(null);
        const count = await getPdfPageCount(asset.uri);
        if (count) {
          setPages(
            Array.from({ length: count }, (_, i) => ({
              key: String(i),
              originalIndex: i,
              label: `Page ${i + 1}`,
              rotation: 0,
            }))
          );
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker');
    }
  };

  const toggleDelete = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPages((prev) => prev.map((p) => p.key === key ? { ...p, deleted: !p.deleted } : p));
  };

  const rotatePageCW = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPages((prev) => prev.map((p) => p.key === key ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const applyChanges = async () => {
    const activePagesCount = pages.filter((p) => !p.deleted).length;
    if (activePagesCount === 0) {
      Alert.alert('No Pages', 'You must keep at least 1 page.');
      return;
    }
    await guard(false, "You've used all 3 free operations today", async () => {
      setStatus('processing');
      setProgress(0);
      setErrorMsg('');
      try {
        const res = await managePages(file.uri, pages, setProgress);
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

  const reset = () => { setFile(null); setPages([]); setStatus('idle'); setProgress(0); setResult(null); setErrorMsg(''); };

  const deletedCount = pages.filter((p) => p.deleted).length;
  const rotatedCount = pages.filter((p) => p.rotation !== 0).length;
  const hasChanges = deletedCount > 0 || rotatedCount > 0 || (pages.length > 0 && pages.some((p, i) => p.originalIndex !== i));

  const renderPageItem = ({ item, drag, isActive }) => {
    const displayIdx = pages.filter((p) => !p.deleted).findIndex((p) => p.key === item.key);
    return (
      <View style={[
        styles.pageRow,
        {
          backgroundColor: item.deleted ? '#FEE2E2' : (isActive ? colors.pageManager?.bg : colors.surface),
          borderColor: item.deleted ? colors.error : (isActive ? colors.pageManager?.icon : colors.border),
          opacity: item.deleted ? 0.6 : 1,
        },
      ]}>
        <TouchableOpacity onLongPress={() => { if (!item.deleted) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); drag(); } }} delayLongPress={150}>
          <Ionicons name="reorder-three" size={22} color={item.deleted ? colors.error : colors.textLight} style={{ paddingHorizontal: 4 }} />
        </TouchableOpacity>

        <View style={[styles.pageNum, { backgroundColor: (item.deleted ? colors.error : colors.pageManager?.icon || colors.primary) + '20' }]}>
          <Text style={[styles.pageNumText, { color: item.deleted ? colors.error : (colors.pageManager?.icon || colors.primary) }]}>
            {item.deleted ? '✕' : (displayIdx + 1)}
          </Text>
        </View>

        <View style={styles.pageInfo}>
          <Text style={[styles.pageLabel, { color: item.deleted ? colors.error : colors.text }]}>
            {item.label}
            {item.rotation > 0 ? ` · ${item.rotation}°` : ''}
          </Text>
          {item.deleted && <Text style={[styles.deleteTag, { color: colors.error }]}>Will be deleted</Text>}
        </View>

        <View style={styles.pageActions}>
          <TouchableOpacity
            style={[styles.pageActionBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={() => rotatePageCW(item.key)}
            disabled={item.deleted}
          >
            <Ionicons name="refresh" size={15} color={item.deleted ? colors.textLight : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pageActionBtn, { backgroundColor: item.deleted ? '#FCA5A540' : '#FEE2E2' }]}
            onPress={() => toggleDelete(item.key)}
          >
            <Ionicons name={item.deleted ? 'arrow-undo' : 'trash'} size={15} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (status === 'done' && result) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.pageManager?.bg }]}>
            <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>Pages Updated!</Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>PDF rebuilt with your changes</Text>
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Output File</Text>
              <Text style={[styles.resultValue, { color: colors.text }]} numberOfLines={1}>{result.name}</Text>
            </View>
            <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Pages Kept</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{result.pageCount}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Deleted</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{deletedCount}</Text>
            </View>
          </View>
          <PrimaryButton title="Share / Save PDF" iconName="share-outline" onPress={shareResult} style={styles.btn} />
          <SecondaryButton title="Manage Another PDF" onPress={reset} style={styles.btn} />
        </ScrollView>
        {modal}
      </SafeAreaView>
    );
  }

  if (status === 'processing') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.processingContainer}>
          <Ionicons name="layers" size={64} color={colors.pageManager?.icon} />
          <Text style={[styles.processingTitle, { color: colors.text }]}>Rebuilding PDF…</Text>
          <Text style={[styles.processingSubtitle, { color: colors.textSecondary }]}>Applying your page changes</Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={colors.pageManager?.icon} />
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
      <ScreenHeader title="Page Manager" onBack={() => navigation.goBack()} />

      {!file ? (
        <ScrollView style={styles.scroll}>
          <View style={styles.content}>
            {status === 'error' && (
              <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                <Ionicons name="warning" size={16} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.pickZone, { backgroundColor: colors.pageManager?.bg, borderColor: colors.pageManager?.icon }]}
              onPress={pickPdf}
              activeOpacity={0.8}
            >
              <Ionicons name="layers" size={44} color={colors.pageManager?.icon} />
              <Text style={[styles.pickZoneTitle, { color: colors.pageManager?.icon }]}>Select PDF File</Text>
              <Text style={[styles.pickZoneSubtitle, { color: colors.textSecondary }]}>Reorder, rotate, and delete pages</Text>
            </TouchableOpacity>

            <View style={[styles.featureBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>What you can do</Text>
              {[
                { icon: 'reorder-three', text: 'Long-press to drag pages into new order' },
                { icon: 'refresh', text: 'Rotate individual pages 90° clockwise' },
                { icon: 'trash', text: 'Mark pages for deletion (reversible)' },
              ].map((f) => (
                <View key={f.text} style={styles.featureRow}>
                  <Ionicons name={f.icon} size={16} color={colors.pageManager?.icon} />
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Summary bar */}
          <View style={[styles.summaryBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={pickPdf} style={styles.summaryFile}>
              <Ionicons name="document-text" size={16} color={colors.primary} />
              <Text style={[styles.summaryFileName, { color: colors.primary }]} numberOfLines={1}>{file.name}</Text>
            </TouchableOpacity>
            <View style={styles.summaryStats}>
              <Text style={[styles.summaryStat, { color: colors.textSecondary }]}>
                {pages.length - deletedCount}/{pages.length} pages
              </Text>
              {deletedCount > 0 && (
                <View style={[styles.deletedBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.deletedBadgeText, { color: colors.error }]}>{deletedCount} to delete</Text>
                </View>
              )}
            </View>
          </View>

          <DraggableFlatList
            data={pages}
            keyExtractor={(item) => item.key}
            onDragEnd={({ data }) => setPages(data)}
            renderItem={renderPageItem}
            contentContainerStyle={styles.pageList}
          />

          <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <PrimaryButton
              title={hasChanges ? 'Apply Changes' : 'No Changes'}
              iconName="checkmark-circle"
              onPress={applyChanges}
              disabled={!hasChanges}
              style={styles.actionBtn}
            />
          </View>
        </>
      )}
      {modal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.base, paddingBottom: SPACING.xxl },
  pickZone: { borderWidth: 2, borderStyle: 'dashed', borderRadius: RADIUS.xl, padding: SPACING.xxl, alignItems: 'center', marginBottom: SPACING.lg, gap: 8 },
  pickZoneTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  pickZoneSubtitle: { fontSize: FONTS.sizes.sm },
  featureBox: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, ...SHADOW.sm, gap: SPACING.sm },
  featureTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, marginBottom: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureText: { flex: 1, fontSize: FONTS.sizes.sm },
  summaryBar: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, paddingHorizontal: SPACING.base, borderBottomWidth: 1, gap: SPACING.sm },
  summaryFile: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  summaryFileName: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold, flex: 1 },
  summaryStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryStat: { fontSize: FONTS.sizes.sm },
  deletedBadge: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  deletedBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
  pageList: { paddingHorizontal: SPACING.base, paddingBottom: 100, paddingTop: SPACING.sm },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOW.sm,
  },
  pageNum: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pageNumText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.extraBold },
  pageInfo: { flex: 1 },
  pageLabel: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold },
  deleteTag: { fontSize: FONTS.sizes.xs, marginTop: 1 },
  pageActions: { flexDirection: 'row', gap: 6 },
  pageActionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
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
