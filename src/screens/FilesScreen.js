// src/screens/FilesScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Sharing from "expo-sharing";
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from "../utils/theme";
import { EmptyState } from "../components/UIComponents";
import { listSavedFiles } from "../utils/pdfOperations";
import { formatFileSize, deleteFile } from "../utils/pdfHelpers";

export default function FilesScreen({ navigation }) {
  const [files, setFiles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFiles = async () => {
    const f = await listSavedFiles();
    setFiles(f);
  };

  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const handleShare = async (file) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.path, { mimeType: "application/pdf" });
    }
  };

  const handleDelete = (file) => {
    Alert.alert("Delete File", `Delete "${file.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteFile(file.path);
          loadFiles();
        },
      },
    ]);
  };

  const formatDate = (ts) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderFile = ({ item }) => (
    <TouchableOpacity
      style={styles.fileCard}
      onPress={() => handleShare(item)}
      activeOpacity={0.8}
    >
      <View style={styles.fileIcon}>
        <Text style={styles.fileIconText}>📄</Text>
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.fileMeta}>
          {formatFileSize(item.size)} · {formatDate(item.modificationTime)}
        </Text>
      </View>
      <View style={styles.fileActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleShare(item)}
        >
          <Text style={styles.actionBtnIcon}>📤</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.actionBtnIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.screenHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>My Files</Text>
        <Text style={styles.fileCount}>{files.length}</Text>
      </View>

      <FlatList
        data={files}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderFile}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="📂"
            title="No Files Yet"
            subtitle="Use a tool to create your first PDF"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0,
    borderBottomColor: COLORS.border,
    ...SHADOW.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  screenTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  fileCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    textAlign: "center",
    lineHeight: 28,
    overflow: "hidden",
  },
  list: { padding: SPACING.base, paddingBottom: SPACING.xxl },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOW.sm,
  },
  fileIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFF3ED",
    alignItems: "center",
    justifyContent: "center",
  },
  fileIconText: { fontSize: 24 },
  fileInfo: { flex: 1 },
  fileName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    lineHeight: 18,
  },
  fileMeta: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 3 },
  fileActions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: { backgroundColor: "#FEE2E2" },
  actionBtnIcon: { fontSize: 16 },
});
