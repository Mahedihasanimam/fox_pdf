// src/screens/HomeScreen.js
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
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';
import { ToolCard, FileItem, EmptyState } from '../components/UIComponents';
import { listSavedFiles, formatFileSize } from '../utils/pdfHelpers';
import * as Sharing from 'expo-sharing';

const TOOLS = [
  {
    id: 'imageToPdf',
    title: 'Image to PDF',
    subtitle: 'JPG, PNG → PDF',
    icon: '🖼️',
    colors: COLORS.imageToPdf,
    screen: 'ImageToPdf',
  },
  {
    id: 'mergePdf',
    title: 'Merge PDF',
    subtitle: 'Combine files',
    icon: '🔗',
    colors: COLORS.mergePdf,
    screen: 'MergePdf',
  },
  {
    id: 'splitPdf',
    title: 'Split PDF',
    subtitle: 'Extract pages',
    icon: '✂️',
    colors: COLORS.splitPdf,
    screen: 'SplitPdf',
  },
  {
    id: 'compressPdf',
    title: 'Compress PDF',
    subtitle: 'Reduce file size',
    icon: '📦',
    colors: COLORS.compressPdf,
    screen: 'CompressPdf',
  },
];

export default function HomeScreen({ navigation }) {
  const [recentFiles, setRecentFiles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecentFiles = async () => {
    const files = await listSavedFiles();
    setRecentFiles(files.slice(0, 5));
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRecentFiles);
    loadRecentFiles();
    return unsubscribe;
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerBrand}>🦊 FoxPDF</Text>
              <Text style={styles.headerTagline}>Your PDF Toolkit</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>FREE</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Tools Grid */}
          <View style={styles.toolsSection}>
            <Text style={styles.sectionLabel}>TOOLS</Text>
            <View style={styles.toolsGrid}>
              <View style={styles.toolsRow}>
                {TOOLS.slice(0, 2).map((tool) => (
                  <ToolCard
                    key={tool.id}
                    title={tool.title}
                    subtitle={tool.subtitle}
                    icon={tool.icon}
                    colors={tool.colors}
                    onPress={() => navigation.navigate(tool.screen)}
                  />
                ))}
              </View>
              <View style={styles.toolsRow}>
                {TOOLS.slice(2, 4).map((tool) => (
                  <ToolCard
                    key={tool.id}
                    title={tool.title}
                    subtitle={tool.subtitle}
                    icon={tool.icon}
                    colors={tool.colors}
                    onPress={() => navigation.navigate(tool.screen)}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Recent Files */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionLabel}>RECENT FILES</Text>
              {recentFiles.length > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('Files')}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {recentFiles.length === 0 ? (
              <View style={styles.emptyRecent}>
                <Text style={styles.emptyRecentIcon}>📂</Text>
                <Text style={styles.emptyRecentText}>No files yet</Text>
                <Text style={styles.emptyRecentSub}>
                  Use a tool above to create your first PDF
                </Text>
              </View>
            ) : (
              recentFiles.map((file, index) => (
                <TouchableOpacity key={index} onPress={() => handleShare(file)} activeOpacity={0.75}>
                  <FileItem
                    name={file.name}
                    size={formatFileSize(file.size)}
                    showDelete={false}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>🔒</Text>
            <Text style={styles.infoBannerText}>
              100% offline. Your files never leave your device.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerTagline: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: FONTS.weights.medium,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 1,
  },
  content: {
    marginTop: -16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textLight,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  toolsSection: {
    marginBottom: SPACING.xl,
  },
  toolsGrid: {
    gap: SPACING.sm,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  recentSection: {
    marginBottom: SPACING.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semiBold,
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyRecentIcon: { fontSize: 36, marginBottom: 8 },
  emptyRecentText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
  },
  emptyRecentSub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  infoBannerIcon: { fontSize: 16 },
  infoBannerText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: '#2E7D32',
    fontWeight: FONTS.weights.medium,
  },
});
