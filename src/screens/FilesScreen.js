import React, { useState, useCallback } from 'react';
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
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from '../components/UIComponents';
import { listSavedFiles } from '../utils/pdfOperations';
import { formatFileSize, deleteFile } from '../utils/pdfHelpers';
import * as FileSystem from 'expo-file-system';
import { FONTS, SPACING, RADIUS, SHADOW } from '../utils/theme';

const OUTPUT_DIR = FileSystem.documentDirectory + 'FoxPDF/';

export default function FilesScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [files, setFiles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [renameFile, setRenameFile] = useState(null);
  const [newName, setNewName] = useState('');

  const loadFiles = async () => {
    const f = await listSavedFiles();
    setFiles(f);
  };

  useFocusEffect(useCallback(() => { loadFiles(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const handleShare = async (file) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.path, { mimeType: 'application/pdf' });
    }
  };

  const handleView = (file) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PdfViewer', { filePath: file.path, fileName: file.name });
  };

  const handleDelete = (file) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete File', `Delete "${file.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFile(file.path);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          loadFiles();
        },
      },
    ]);
  };

  const openRename = (file) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRenameFile(file);
    setNewName(file.name.replace(/\.pdf$/i, ''));
  };

  const confirmRename = async () => {
    if (!newName.trim() || !renameFile) return;
    const cleaned = newName.trim().replace(/[^a-zA-Z0-9_\- ]/g, '');
    const dest = OUTPUT_DIR + cleaned + '.pdf';
    try {
      await FileSystem.moveAsync({ from: renameFile.path, to: dest });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Rename failed', e.message);
    }
    setRenameFile(null);
    loadFiles();
  };

  const formatDate = (ts) =>
    new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const renderFile = ({ item }) => (
    <View style={[styles.fileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.fileMain} onPress={() => handleView(item)} activeOpacity={0.8}>
        <View style={[styles.fileIcon, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
        </View>
        <View style={styles.fileInfo}>
          <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.fileMeta, { color: colors.textLight }]}>
            {formatFileSize(item.size)} · {formatDate(item.modificationTime)}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.fileActions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => handleShare(item)}>
          <Ionicons name="share-outline" size={18} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => openRename(item)}>
          <Ionicons name="pencil" size={16} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleDelete(item)}>
          <Ionicons name="trash" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.paper }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.paper} />

      <View style={[styles.screenHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>My Files</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.countText}>{files.length}</Text>
        </View>
      </View>

      <FlatList
        data={files}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderFile}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            iconName="folder-open-outline"
            title="No Files Yet"
            subtitle="Use a tool to create your first PDF"
          />
        }
      />

      {/* Rename Modal */}
      <Modal visible={!!renameFile} transparent animationType="fade" onRequestClose={() => setRenameFile(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Rename File</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              selectTextOnFocus
              placeholder="File name"
              placeholderTextColor={colors.textLight}
            />
            <Text style={[styles.modalHint, { color: colors.textLight }]}>.pdf will be added automatically</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={() => setRenameFile(null)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
                onPress={confirmRename}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    ...SHADOW.sm,
  },
  screenTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extraBold,
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    color: '#fff',
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  list: { padding: SPACING.base, paddingBottom: SPACING.xxl },
  fileCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  fileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  fileIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: { flex: 1 },
  fileName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    lineHeight: 18,
  },
  fileMeta: { fontSize: FONTS.sizes.xs, marginTop: 3 },
  fileActions: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalBox: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOW.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.md,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    marginBottom: 6,
  },
  modalHint: { fontSize: FONTS.sizes.xs, marginBottom: SPACING.lg },
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnPrimary: { borderWidth: 0 },
  modalBtnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semiBold },
});
