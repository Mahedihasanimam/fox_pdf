// src/screens/ImageToPdfScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';
import { PrimaryButton, SecondaryButton, SectionHeader, ProgressBar } from '../components/UIComponents';
import { imagesToPdf } from '../utils/pdfOperations';
import { formatFileSize } from '../utils/pdfHelpers';

export default function ImageToPdfScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pickImages = async () => {
    const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 20,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets]);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newArr = [...images];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    setImages(newArr);
  };

  const moveDown = (index) => {
    if (index === images.length - 1) return;
    const newArr = [...images];
    [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
    setImages(newArr);
  };

  const convert = async () => {
    if (images.length === 0) return;
    setStatus('processing');
    setProgress(0);
    setErrorMsg('');
    try {
      const uris = images.map((img) => img.uri);
      const res = await imagesToPdf(uris, setProgress);
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
    setImages([]);
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setErrorMsg('');
  };

  // ── DONE STATE ──
  if (status === 'done' && result) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={styles.successIconWrap}>
            <Text style={styles.successIcon}>✅</Text>
          </View>
          <Text style={styles.resultTitle}>PDF Created!</Text>
          <Text style={styles.resultSub}>Your images have been converted successfully</Text>

          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>File</Text>
              <Text style={styles.resultValue} numberOfLines={1}>{result.name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Size</Text>
              <Text style={styles.resultValue}>{formatFileSize(result.size)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Images</Text>
              <Text style={styles.resultValue}>{images.length} converted</Text>
            </View>
          </View>

          <PrimaryButton title="Share / Save PDF" icon="📤" onPress={shareResult} style={styles.btn} />
          <SecondaryButton title="Convert More Images" onPress={reset} style={styles.btn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PROCESSING STATE ──
  if (status === 'processing') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.processingContainer}>
          <Text style={styles.processingIcon}>⚙️</Text>
          <Text style={styles.processingTitle}>Converting…</Text>
          <Text style={styles.processingSubtitle}>Building your PDF</Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} color={COLORS.imageToPdf.icon} />
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── MAIN / ERROR STATE ──
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Image to PDF</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {status === 'error' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {/* Pick Images */}
          <TouchableOpacity style={styles.pickZone} onPress={pickImages} activeOpacity={0.8}>
            <Text style={styles.pickZoneIcon}>🖼️</Text>
            <Text style={styles.pickZoneTitle}>Select Images</Text>
            <Text style={styles.pickZoneSubtitle}>JPG, PNG · up to 20 images</Text>
          </TouchableOpacity>

          {/* Image List */}
          {images.length > 0 && (
            <View style={styles.imagesSection}>
              <SectionHeader
                title={`Selected (${images.length})`}
                subtitle="Tap arrows to reorder"
              />
              {images.map((img, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image source={{ uri: img.uri }} style={styles.imageThumbnail} />
                  <View style={styles.imageInfo}>
                    <Text style={styles.imageIndex}>Image {index + 1}</Text>
                    <Text style={styles.imageDims}>
                      {img.width}×{img.height}
                    </Text>
                  </View>
                  <View style={styles.imageActions}>
                    <TouchableOpacity onPress={() => moveUp(index)} style={styles.arrowBtn}>
                      <Text style={styles.arrowText}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveDown(index)} style={styles.arrowBtn}>
                      <Text style={styles.arrowText}>↓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeImage(index)} style={styles.removeBtn}>
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addMoreBtn} onPress={pickImages}>
                <Text style={styles.addMoreText}>+ Add More Images</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={`Convert to PDF${images.length > 0 ? ` (${images.length})` : ''}`}
          icon="📄"
          onPress={convert}
          disabled={images.length === 0}
          style={styles.convertBtn}
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
    backgroundColor: '#FFF3ED',
    borderWidth: 2,
    borderColor: COLORS.primary,
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
    color: COLORS.primary,
    marginBottom: 4,
  },
  pickZoneSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },

  imagesSection: { marginBottom: SPACING.base },

  imageItem: {
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
  imageThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  imageInfo: { flex: 1 },
  imageIndex: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
  },
  imageDims: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },
  imageActions: { flexDirection: 'row', gap: 6 },
  arrowBtn: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 14, color: COLORS.text },
  removeBtn: {
    width: 30,
    height: 30,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontSize: 12, color: COLORS.error },

  addMoreBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  addMoreText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
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
  convertBtn: { width: '100%' },

  // Processing
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

  // Result
  resultContainer: { flexGrow: 1, alignItems: 'center', padding: SPACING.xl, paddingTop: 60 },
  successIconWrap: { marginBottom: SPACING.md },
  successIcon: { fontSize: 72 },
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
