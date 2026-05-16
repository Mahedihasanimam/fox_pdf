import React, { useState } from "react";
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
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useProGate } from "../components/ProGate";
import {
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  ProgressBar,
  ScreenHeader,
} from "../components/UIComponents";
import { imagesToPdf } from "../utils/pdfOperations";
import { formatFileSize } from "../utils/pdfHelpers";
import { FONTS, SPACING, RADIUS, SHADOW } from "../utils/theme";

export default function ImageToPdfScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { guard, modal } = useProGate();
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const pickImages = async () => {
    const { status: perm } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library.",
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 20,
    });
    if (!res.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setImages((prev) => [
        ...prev,
        ...res.assets.map((a, i) => ({ ...a, key: `${Date.now()}-${i}` })),
      ]);
    }
  };

  const removeImage = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImages((prev) => prev.filter((img) => img.key !== key));
  };

  const convert = async () => {
    if (images.length === 0) return;
    await guard(false, "You've used all 3 free operations today", async () => {
      setStatus("processing");
      setProgress(0);
      setErrorMsg("");
      try {
        // Pass full { uri, mimeType } objects so format detection is accurate
        const assets = images.map((img) => ({
          uri: img.uri,
          mimeType: img.mimeType || null,
        }));
        const res = await imagesToPdf(assets, setProgress);
        setResult(res);
        setStatus("done");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        setErrorMsg(e.message);
        setStatus("error");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    });
  };

  const shareResult = async () => {
    if (result?.path && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(result.path, { mimeType: "application/pdf" });
    }
  };

  const reset = () => {
    setImages([]);
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setErrorMsg("");
  };

  const renderDragItem = ({ item, drag, isActive }) => (
    <View
      style={[
        styles.imageItem,
        {
          backgroundColor: isActive ? colors.primary + "18" : colors.surface,
          borderColor: isActive ? colors.primary : colors.border,
        },
      ]}
    >
      <TouchableOpacity
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          drag();
        }}
        delayLongPress={150}
      >
        <Ionicons
          name="reorder-three"
          size={22}
          color={colors.textLight}
          style={{ paddingHorizontal: 6 }}
        />
      </TouchableOpacity>
      <Image source={{ uri: item.uri }} style={styles.imageThumbnail} />
      <View style={styles.imageInfo}>
        <Text
          style={[styles.imageLabel, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.fileName || "Image"}
        </Text>
        <Text style={[styles.imageDims, { color: colors.textLight }]}>
          {item.width}×{item.height}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => removeImage(item.key)}
        style={[styles.removeBtn, { backgroundColor: "#FEE2E2" }]}
      >
        <Ionicons name="close" size={14} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (status === "done" && result) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ScreenHeader title="PDF Created!" onBack={reset} />
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.successIcon, { backgroundColor: "#E8F5E9" }]}>
            <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            PDF Created!
          </Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>
            {images.length} image{images.length > 1 ? "s" : ""} converted
            successfully
          </Text>

          {/* Thumbnail strip preview */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbStrip}
            contentContainerStyle={styles.thumbStripInner}
          >
            {images.map((img, idx) => (
              <Image
                key={img.key}
                source={{ uri: img.uri }}
                style={styles.thumbImg}
              />
            ))}
          </ScrollView>

          <View
            style={[
              styles.resultCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <ResultRow label="File" value={result.name} colors={colors} />
            <ResultRow
              label="Size"
              value={formatFileSize(result.size)}
              colors={colors}
            />
            <ResultRow
              label="Pages"
              value={`${images.length}`}
              colors={colors}
              last
            />
          </View>

          <PrimaryButton
            title="Preview PDF"
            iconName="eye-outline"
            onPress={() =>
              navigation.navigate("PdfViewer", {
                filePath: result.path,
                fileName: result.name,
              })
            }
            style={styles.btn}
          />
          <PrimaryButton
            title="Share / Save PDF"
            iconName="share-outline"
            onPress={shareResult}
            style={[styles.btn, { backgroundColor: "#22C55E" }]}
          />
          <SecondaryButton
            title="Convert More Images"
            onPress={reset}
            style={styles.btn}
          />
        </ScrollView>
        {modal}
      </SafeAreaView>
    );
  }

  if (status === "processing") {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <View style={styles.processingContainer}>
          <Ionicons
            name="images"
            size={64}
            color={colors.imageToPdf?.icon || colors.primary}
          />
          <Text style={[styles.processingTitle, { color: colors.text }]}>
            Converting…
          </Text>
          <Text
            style={[styles.processingSubtitle, { color: colors.textSecondary }]}
          >
            Building your PDF from {images.length} images
          </Text>
          <View style={styles.progressWrap}>
            <ProgressBar
              progress={progress}
              color={colors.imageToPdf?.icon || colors.primary}
            />
            <Text
              style={[styles.progressText, { color: colors.textSecondary }]}
            >
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>
        {modal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScreenHeader title="Image to PDF" onBack={() => navigation.goBack()} />

      <View style={{ flex: 1 }}>
        {status === "error" && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
            ]}
          >
            <Ionicons name="warning" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errorMsg}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.pickZone,
            {
              backgroundColor: colors.imageToPdf?.bg || "#FFF3ED",
              borderColor: colors.imageToPdf?.icon || colors.primary,
            },
          ]}
          onPress={pickImages}
          activeOpacity={0.8}
        >
          <Ionicons
            name="images"
            size={44}
            color={colors.imageToPdf?.icon || colors.primary}
          />
          <Text
            style={[
              styles.pickZoneTitle,
              { color: colors.imageToPdf?.icon || colors.primary },
            ]}
          >
            Select Images
          </Text>
          <Text
            style={[styles.pickZoneSubtitle, { color: colors.textSecondary }]}
          >
            JPG, PNG, HEIC, WEBP · Long-press to reorder · up to 20
          </Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <View style={styles.listHeader}>
            <SectionHeader
              title={`Selected (${images.length})`}
              subtitle="Long-press handle to drag"
            />
          </View>
        )}

        <DraggableFlatList
          data={images}
          keyExtractor={(item) => item.key}
          onDragEnd={({ data }) => setImages(data)}
          renderItem={renderDragItem}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            images.length > 0 ? (
              <TouchableOpacity
                style={[
                  styles.addMoreBtn,
                  { borderColor: colors.imageToPdf?.icon || colors.primary },
                ]}
                onPress={pickImages}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={colors.imageToPdf?.icon || colors.primary}
                />
                <Text
                  style={[
                    styles.addMoreText,
                    { color: colors.imageToPdf?.icon || colors.primary },
                  ]}
                >
                  Add More Images
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <PrimaryButton
          title={`Convert to PDF${images.length > 0 ? ` (${images.length})` : ""}`}
          iconName="document-text"
          onPress={convert}
          disabled={images.length === 0}
          style={styles.actionBtn}
        />
      </View>
      {modal}
    </SafeAreaView>
  );
}

function ResultRow({ label, value, colors, last }) {
  return (
    <View
      style={[
        styles.resultRow,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[styles.resultValue, { color: colors.text }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  pickZone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
    margin: SPACING.base,
    gap: 8,
  },
  pickZoneTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  pickZoneSubtitle: { fontSize: FONTS.sizes.sm, textAlign: "center" },
  listHeader: { paddingHorizontal: SPACING.base },
  listContent: { paddingHorizontal: SPACING.base, paddingBottom: 100 },
  imageItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOW.sm,
  },
  imageThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  imageInfo: { flex: 1 },
  imageLabel: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold },
  imageDims: { fontSize: FONTS.sizes.xs, marginTop: 2 },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  addMoreBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: SPACING.sm,
  },
  addMoreText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.base,
    borderTopWidth: 1,
  },
  actionBtn: { width: "100%" },
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
    gap: 12,
  },
  processingTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extraBold,
  },
  processingSubtitle: { fontSize: FONTS.sizes.md, textAlign: "center" },
  progressWrap: { width: "100%", gap: 8 },
  progressText: {
    textAlign: "center",
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
  },
  resultContainer: {
    flexGrow: 1,
    alignItems: "center",
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  resultTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extraBold,
    marginBottom: 6,
  },
  resultSub: {
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  thumbStrip: { width: "100%", marginBottom: SPACING.lg },
  thumbStripInner: { gap: 8, paddingHorizontal: 2 },
  thumbImg: { width: 72, height: 72, borderRadius: 8, backgroundColor: "#ddd" },
  resultCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: "100%",
    marginBottom: SPACING.xl,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  resultLabel: { fontSize: FONTS.sizes.sm },
  resultValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    maxWidth: "60%",
    textAlign: "right",
  },
  btn: { width: "100%", marginBottom: SPACING.sm },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    margin: SPACING.base,
    borderWidth: 1,
  },
  errorText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    flex: 1,
  },
});
