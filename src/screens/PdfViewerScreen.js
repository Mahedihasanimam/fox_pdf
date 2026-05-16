import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { FONTS, SPACING, SHADOW } from "../utils/theme";

export default function PdfViewerScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { filePath, fileName } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState(null);

  React.useEffect(() => {
    loadFileInfo();
  }, [filePath]);

  const loadFileInfo = async () => {
    if (!filePath) {
      setLoading(false);
      return;
    }
    try {
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        setFileInfo({
          name: fileName || filePath.split("/").pop(),
          size: info.size,
          path: filePath,
        });
      }
    } catch (e) {
      console.error("Error loading file info:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPdf = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (Platform.OS === "ios") {
        await Sharing.shareAsync(filePath, { mimeType: "application/pdf" });
      } else {
        const uri = await FileSystem.getContentUriAsync(filePath);
        await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      }
    } catch (err) {
      console.error("Error opening PDF:", err);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!filePath) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            PDF Preview
          </Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.center}>
          <Ionicons name="document-text" size={64} color={colors.textLight} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            No File Specified
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          PDF Preview
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.viewerContainer}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading…
            </Text>
          </View>
        ) : !fileInfo ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle" size={64} color={colors.textLight} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              File Not Found
            </Text>
          </View>
        ) : (
          <View style={styles.previewBox}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Ionicons name="document-text" size={80} color={colors.primary} />
            </View>

            <Text style={[styles.fileName, { color: colors.text }]}>
              {fileInfo.name}
            </Text>

            <Text style={[styles.fileSize, { color: colors.textSecondary }]}>
              {formatFileSize(fileInfo.size)}
            </Text>

            <TouchableOpacity
              style={[styles.openButton, { backgroundColor: colors.primary }]}
              onPress={handleOpenPdf}
              activeOpacity={0.7}
            >
              <Ionicons name="open-outline" size={24} color="#fff" />
              <Text style={styles.openButtonText}>Open in System Viewer</Text>
            </TouchableOpacity>

            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              PDF will open in your default viewer
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    ...SHADOW.sm,
  },
  headerBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
    textAlign: "center",
  },
  viewerContainer: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.sm,
  },
  errorTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    textAlign: "center",
    marginTop: SPACING.md,
  },
  previewBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold,
    textAlign: "center",
  },
  fileSize: {
    fontSize: FONTS.sizes.md,
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOW.md,
  },
  openButtonText: {
    color: "#fff",
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
  },
  hint: {
    fontSize: FONTS.sizes.sm,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
});
