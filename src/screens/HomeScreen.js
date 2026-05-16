import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { usePro } from '../context/ProContext';
import { ToolCard, FileItem } from '../components/UIComponents';
import AdBanner from '../components/AdBanner';
import { listSavedFiles, formatFileSize } from '../utils/pdfHelpers';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

const TOOLS = [
  { id: 'imageToPdf', title: 'Image to PDF', subtitle: 'JPG, PNG → PDF', iconName: 'images', key: 'imageToPdf', screen: 'ImageToPdf', isPro: false },
  { id: 'mergePdf', title: 'Merge PDF', subtitle: 'Combine files', iconName: 'git-merge', key: 'mergePdf', screen: 'MergePdf', isPro: false },
  { id: 'splitPdf', title: 'Split PDF', subtitle: 'Extract pages', iconName: 'cut', key: 'splitPdf', screen: 'SplitPdf', isPro: false },
  { id: 'compressPdf', title: 'Compress PDF', subtitle: 'Optimise size', iconName: 'archive', key: 'compressPdf', screen: 'CompressPdf', isPro: false },
  { id: 'cameraScan', title: 'Camera Scan', subtitle: 'Photo → PDF', iconName: 'camera', key: 'cameraScan', screen: 'CameraScan', isPro: true },
  { id: 'eSignature', title: 'E-Signature', subtitle: 'Sign documents', iconName: 'create', key: 'eSignature', screen: 'ESignature', isPro: true },
  { id: 'watermark', title: 'Watermark', subtitle: 'Brand your PDF', iconName: 'shield-checkmark', key: 'watermark', screen: 'Watermark', isPro: false },
  { id: 'pageManager', title: 'Page Manager', subtitle: 'Reorder & delete', iconName: 'layers', key: 'pageManager', screen: 'PageManager', isPro: false },
  { id: 'handwriting', title: 'Handwriting PDF', subtitle: 'Type → Handwritten', iconName: 'pencil', key: 'handwriting', screen: 'Handwriting', isPro: false },
];

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { isPro, opsRemaining } = usePro();
  const [recentFiles, setRecentFiles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecentFiles = async () => {
    const files = await listSavedFiles();
    setRecentFiles(files.slice(0, 5));
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadRecentFiles);
    loadRecentFiles();
    return unsub;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentFiles();
    setRefreshing(false);
  };

  const handleShare = async (file) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.path, { mimeType: 'application/pdf' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toolRows = [];
  for (let i = 0; i < TOOLS.length; i += 2) {
    toolRows.push(TOOLS.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.paper }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerBrand}>🦊 FoxPDF</Text>
              <Text style={styles.headerTagline}>Quick, private PDF tools</Text>
            </View>
            <View style={[styles.proChip, { backgroundColor: isPro ? '#FFD700' : 'rgba(255,255,255,0.2)', borderColor: isPro ? '#FFD700' : 'rgba(255,255,255,0.35)' }]}>
              {isPro
                ? <><Ionicons name="star" size={12} color="#7B5800" /><Text style={[styles.proChipText, { color: '#7B5800' }]}> PRO</Text></>
                : <Text style={styles.proChipText}>{opsRemaining} free left</Text>
              }
            </View>
          </View>
          <View style={styles.headerChipRow}>
            <View style={styles.headerChip}>
              <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.9)" />
              <Text style={styles.headerChipText}> Private by default</Text>
            </View>
            <View style={styles.headerChip}>
              <Ionicons name="wifi-outline" size={10} color="rgba(255,255,255,0.9)" />
              <Text style={styles.headerChipText}> 100% offline</Text>
            </View>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.paper }]}>
          {/* Ad Banner */}
          <AdBanner />

          {/* Tools Grid */}
          <View style={styles.toolsSection}>
            <Text style={[styles.sectionLabel, { color: colors.inkSoft }]}>Tools</Text>
            <View style={styles.toolsGrid}>
              {toolRows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.toolsRow}>
                  {row.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      title={tool.title}
                      subtitle={tool.subtitle}
                      iconName={tool.iconName}
                      colors={colors[tool.key]}
                      isPro={tool.isPro && !isPro}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate(tool.screen);
                      }}
                    />
                  ))}
                  {row.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))}
            </View>
          </View>

          {/* Recent Files */}
          <View style={[styles.recentSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionLabel, { color: colors.inkSoft }]}>Recent files</Text>
              {recentFiles.length > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('FilesTab')}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {recentFiles.length === 0 ? (
              <View style={[styles.emptyRecent, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Ionicons name="folder-open-outline" size={36} color={colors.textLight} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyRecentText, { color: colors.text }]}>No files yet</Text>
                <Text style={[styles.emptyRecentSub, { color: colors.textSecondary }]}>
                  Use a tool above to create your first PDF
                </Text>
              </View>
            ) : (
              recentFiles.map((file, index) => (
                <TouchableOpacity key={index} onPress={() => handleShare(file)} activeOpacity={0.75}>
                  <FileItem name={file.name} size={formatFileSize(file.size)} showDelete={false} />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Privacy Banner */}
          <View style={[styles.infoBanner, { backgroundColor: isDark ? '#0A2010' : '#E8F5E9', borderColor: isDark ? '#1A4030' : '#C8E6C9' }]}>
            <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
            <Text style={[styles.infoBannerText, { color: isDark ? '#4ADE80' : '#2E7D32' }]}>
              100% offline — your files never leave your device.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extraBold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerTagline: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    fontWeight: FONTS.weights.medium,
  },
  proChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  proChipText: {
    fontSize: FONTS.sizes.xs,
    color: '#fff',
    fontWeight: FONTS.weights.bold,
    letterSpacing: 0.5,
  },
  headerChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  headerChipText: {
    color: '#fff',
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semiBold,
  },
  content: {
    marginTop: -16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 0,
    marginBottom: SPACING.md,
  },
  toolsSection: { marginBottom: SPACING.xl },
  toolsGrid: { gap: SPACING.sm },
  toolsRow: { flexDirection: 'row', gap: SPACING.sm },
  recentSection: {
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  emptyRecentText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
  },
  emptyRecentSub: {
    fontSize: FONTS.sizes.sm,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  infoBannerText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
  },
});
