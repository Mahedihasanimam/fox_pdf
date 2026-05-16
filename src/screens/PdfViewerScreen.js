import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, SHADOW } from '../utils/theme';

export default function PdfViewerScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { filePath, fileName } = route.params || {};
  const [pdfBase64, setPdfBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPdf();
  }, [filePath]);

  const loadPdf = async () => {
    if (!filePath) { setError('No file specified'); setLoading(false); return; }
    try {
      if (Platform.OS === 'ios') {
        // iOS WebView handles file:// URLs natively
        setPdfBase64('file');
      } else {
        // Android: read as base64, embed in WebView via data URI
        const b64 = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.Base64 });
        setPdfBase64(b64);
      }
    } catch (e) {
      setError('Could not load PDF: ' + e.message);
    }
    setLoading(false);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, { mimeType: 'application/pdf' });
    }
  };

  const renderPdf = () => {
    if (Platform.OS === 'ios') {
      return (
        <WebView
          source={{ uri: filePath }}
          style={styles.webview}
          originWhitelist={['*']}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          onError={() => setError('Could not display PDF')}
        />
      );
    }
    // Android: use data URI
    return (
      <WebView
        source={{ uri: `data:application/pdf;base64,${pdfBase64}` }}
        style={styles.webview}
        originWhitelist={['*']}
        onError={() => {
          // Fallback: open system viewer
          Alert.alert(
            'Open External Viewer',
            "Android WebView doesn't render PDFs inline. Open in your PDF app?",
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open', onPress: handleShare },
            ]
          );
        }}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{fileName || 'PDF Viewer'}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.viewerContainer}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading PDF…</Text>
          </View>
        )}

        {error && (
          <View style={styles.center}>
            <Ionicons name="document-text" size={64} color={colors.textLight} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Cannot Display PDF</Text>
            <Text style={[styles.errorSub, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.openBtn, { backgroundColor: colors.primary }]}
              onPress={handleShare}
            >
              <Ionicons name="open-outline" size={18} color="#fff" />
              <Text style={styles.openBtnText}>Open in System Viewer</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && pdfBase64 && renderPdf()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    ...SHADOW.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semiBold, marginHorizontal: SPACING.sm },
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  viewerContainer: { flex: 1 },
  webview: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: 12 },
  loadingText: { fontSize: FONTS.sizes.md },
  errorTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, marginTop: SPACING.md },
  errorSub: { fontSize: FONTS.sizes.sm, textAlign: 'center' },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: SPACING.md,
  },
  openBtnText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },
});
