import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { useTheme } from "../context/ThemeContext";
import { useProGate } from "../components/ProGate";
import {
  PrimaryButton,
  SecondaryButton,
  ProgressBar,
  ScreenHeader,
} from "../components/UIComponents";
import {
  generateOutputName,
  writeBase64ToFile,
  uint8ArrayToBase64,
} from "../utils/pdfHelpers";
import { FONTS, SPACING, RADIUS, SHADOW } from "../utils/theme";

const OUTPUT_DIR = FileSystem.documentDirectory + "FoxPDF/";

const FONTS_LIST = [
  {
    id: "caveat",
    label: "Caveat",
    family: "'Bradley Hand', 'Chalkboard SE', 'Comic Sans MS', cursive",
    sample: "Quick brown fox",
  },
  {
    id: "patrick",
    label: "Patrick Hand",
    family: "'Noteworthy', 'Bradley Hand', cursive",
    sample: "Quick brown fox",
  },
  {
    id: "kalam",
    label: "Kalam",
    family: "'Snell Roundhand', 'Bradley Hand', cursive",
    sample: "Quick brown fox",
  },
  {
    id: "indie",
    label: "Indie Flower",
    family: "'Segoe Print', 'Bradley Hand', cursive",
    sample: "Quick brown fox",
  },
];

const PAPER_STYLES = [
  { id: "lined", label: "Lined", icon: "reorder-four-outline" },
  { id: "plain", label: "Plain", icon: "square-outline" },
  { id: "yellow", label: "Notepad", icon: "document-outline" },
  { id: "graph", label: "Graph", icon: "grid-outline" },
];

const TEXT_SIZES = [
  { id: "small", label: "Small", fontSize: 18, lineHeight: 36 },
  { id: "medium", label: "Medium", fontSize: 22, lineHeight: 40 },
  { id: "large", label: "Large", fontSize: 28, lineHeight: 48 },
];

async function buildHandwritingPdf(text, paperStyle, sizeConfig) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const pageWidth = 595;
  const pageHeight = 842;
  const left = 60;
  const right = 40;
  const top = 50;
  const bottom = 50;
  const usableWidth = pageWidth - left - right;
  const lineGap = sizeConfig.lineHeight;
  const fontSize = sizeConfig.fontSize;
  const words = text.replace(/\r\n/g, "\n").split(/\s+/);

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - top;
  let lineTop = currentY;
  let lineCount = 0;
  let currentLine = "";

  const drawPaper = (page) => {
    const background =
      paperStyle === "yellow" ? rgb(1, 0.99, 0.88) : rgb(1, 1, 1);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: background,
    });

    const lineColor =
      paperStyle === "yellow" ? rgb(0.8, 0.72, 0.42) : rgb(0.74, 0.8, 0.9);
    const marginColor =
      paperStyle === "yellow" ? rgb(0.88, 0.55, 0.35) : rgb(0.94, 0.5, 0.5);
    if (paperStyle === "lined" || paperStyle === "yellow") {
      for (let y = pageHeight - top - lineGap; y > bottom; y -= lineGap) {
        page.drawLine({
          start: { x: left, y },
          end: { x: pageWidth - right, y },
          color: lineColor,
          thickness: 0.7,
        });
      }
      page.drawLine({
        start: { x: 52, y: bottom },
        end: { x: 52, y: pageHeight - top },
        color: marginColor,
        thickness: 1.2,
      });
    } else if (paperStyle === "graph") {
      for (let x = left; x < pageWidth - right; x += 20) {
        page.drawLine({
          start: { x, y: bottom },
          end: { x, y: pageHeight - top },
          color: rgb(0.82, 0.86, 0.94),
          thickness: 0.5,
        });
      }
      for (let y = bottom; y < pageHeight - top; y += 20) {
        page.drawLine({
          start: { x: left, y },
          end: { x: pageWidth - right, y },
          color: rgb(0.82, 0.86, 0.94),
          thickness: 0.5,
        });
      }
    }
  };

  const startNewPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPaper(currentPage);
    currentY = pageHeight - top;
    lineTop = currentY;
    lineCount = 0;
  };

  const flushLine = () => {
    if (!currentLine.trim()) {
      currentY -= lineGap;
      lineCount += 1;
      currentLine = "";
      if (currentY < bottom + lineGap) startNewPage();
      return;
    }

    currentPage.drawText(currentLine.trim(), {
      x: left,
      y: lineTop - fontSize,
      size: fontSize,
      font,
      color: rgb(0.12, 0.12, 0.18),
      charSpacing: 0.3,
    });

    currentY -= lineGap;
    lineCount += 1;
    currentLine = "";
    if (currentY < bottom + lineGap) startNewPage();
    lineTop = currentY;
  };

  drawPaper(currentPage);

  for (const word of words) {
    if (word === "\n") {
      flushLine();
      continue;
    }
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (textWidth > usableWidth) {
      flushLine();
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  flushLine();
  return pdfDoc;
}

export default function HandwritingScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { guard, modal } = useProGate();

  const [text, setText] = useState("");
  const [selectedFont, setSelectedFont] = useState("caveat");
  const [paperStyle, setPaperStyle] = useState("lined");
  const [textSize, setTextSize] = useState("medium");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const sizeConfig = TEXT_SIZES.find((s) => s.id === textSize) || TEXT_SIZES[1];

  const generate = async () => {
    if (!text.trim()) {
      Alert.alert(
        "No text",
        "Please type or paste your assignment text first.",
      );
      return;
    }
    await guard(false, "You've used all 3 free operations today", async () => {
      setStatus("processing");
      setProgress(0.2);
      setErrorMsg("");
      try {
        const pdfDoc = await buildHandwritingPdf(
          text.trim(),
          paperStyle,
          sizeConfig,
        );
        setProgress(0.5);
        const info = await FileSystem.getInfoAsync(OUTPUT_DIR);
        if (!info.exists)
          await FileSystem.makeDirectoryAsync(OUTPUT_DIR, {
            intermediates: true,
          });

        const outputName = generateOutputName("handwriting");
        const outputPath = OUTPUT_DIR + outputName;
        const pdfBytes = await pdfDoc.save();
        await writeBase64ToFile(uint8ArrayToBase64(pdfBytes), outputPath);
        setProgress(1);

        const fileInfo = await FileSystem.getInfoAsync(outputPath, {
          size: true,
        });
        setResult({
          path: outputPath,
          name: outputName,
          size: fileInfo.size || 0,
        });
        setStatus("done");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        setErrorMsg(err.message);
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
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setErrorMsg("");
  };

  const hw = colors.handwriting || { bg: "#FFFBF0", icon: "#D97706" };

  // ─── Processing ───────────────────────────────────────────────────────────
  if (status === "processing") {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <View style={styles.center}>
          <Ionicons name="pencil" size={64} color={hw.icon} />
          <Text style={[styles.procTitle, { color: colors.text }]}>
            Generating Handwriting…
          </Text>
          <Text style={[styles.procSub, { color: colors.textSecondary }]}>
            Turning your text into a handwritten PDF
          </Text>
          <View style={styles.progWrap}>
            <ProgressBar progress={progress} color={hw.icon} />
            <Text style={[styles.progText, { color: colors.textSecondary }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>
        {modal}
      </SafeAreaView>
    );
  }

  // ─── Done ────────────────────────────────────────────────────────────────
  if (status === "done" && result) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ScreenHeader title="PDF Ready!" onBack={reset} />
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.successIcon, { backgroundColor: hw.bg }]}>
            <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            Handwriting PDF Ready!
          </Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>
            Your typed text is now a handwritten document
          </Text>

          <View
            style={[
              styles.resultCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.resultRow, { borderBottomColor: colors.border }]}
            >
              <Text
                style={[styles.resultLabel, { color: colors.textSecondary }]}
              >
                Font
              </Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>
                {FONTS_LIST.find((f) => f.id === selectedFont)?.label}
              </Text>
            </View>
            <View
              style={[styles.resultRow, { borderBottomColor: colors.border }]}
            >
              <Text
                style={[styles.resultLabel, { color: colors.textSecondary }]}
              >
                Paper
              </Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>
                {PAPER_STYLES.find((p) => p.id === paperStyle)?.label}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text
                style={[styles.resultLabel, { color: colors.textSecondary }]}
              >
                File
              </Text>
              <Text
                style={[styles.resultValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {result.name}
              </Text>
            </View>
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
            title="Make Another"
            onPress={reset}
            style={styles.btn}
          />
        </ScrollView>
        {modal}
      </SafeAreaView>
    );
  }

  // ─── Main editor ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScreenHeader
        title="Handwriting PDF"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
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

          {/* Viral banner */}
          <View
            style={[
              styles.viralBanner,
              { backgroundColor: hw.bg, borderColor: hw.icon + "60" },
            ]}
          >
            <Text style={[styles.viralTitle, { color: hw.icon }]}>
              ✍️ Type → Handwritten PDF
            </Text>
            <Text style={[styles.viralSub, { color: colors.textSecondary }]}>
              Type your assignment, choose a handwriting style, and get a
              realistic handwritten PDF — perfect for school submissions!
            </Text>
          </View>

          {/* Text Input */}
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Text
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                },
              ]}
              value={text}
              onChangeText={setText}
              placeholder="Type or paste your assignment text here…"
              placeholderTextColor={colors.textLight}
              multiline
              textAlignVertical="top"
              maxLength={5000}
            />
            <Text style={[styles.charCount, { color: colors.textLight }]}>
              {text.length}/5000 characters
            </Text>
          </View>

          {/* Font Selector */}
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Handwriting Style
            </Text>
            <View style={styles.fontGrid}>
              {FONTS_LIST.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.fontCard,
                    {
                      backgroundColor:
                        selectedFont === f.id ? hw.bg : colors.surfaceAlt,
                      borderColor:
                        selectedFont === f.id ? hw.icon : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedFont(f.id);
                  }}
                >
                  <Text
                    style={[
                      styles.fontSample,
                      {
                        color:
                          selectedFont === f.id
                            ? hw.icon
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {f.sample}
                  </Text>
                  <Text
                    style={[
                      styles.fontLabel,
                      {
                        color:
                          selectedFont === f.id
                            ? hw.icon
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Paper Style */}
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Paper Style
            </Text>
            <View style={styles.paperRow}>
              {PAPER_STYLES.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.paperBtn,
                    {
                      borderColor:
                        paperStyle === p.id ? hw.icon : colors.border,
                      backgroundColor:
                        paperStyle === p.id ? hw.bg : colors.background,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPaperStyle(p.id);
                  }}
                >
                  <Ionicons
                    name={p.icon}
                    size={20}
                    color={paperStyle === p.id ? hw.icon : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.paperLabel,
                      {
                        color:
                          paperStyle === p.id ? hw.icon : colors.textSecondary,
                      },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Size */}
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Text Size
            </Text>
            <View style={styles.sizeRow}>
              {TEXT_SIZES.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.sizeBtn,
                    {
                      borderColor: textSize === s.id ? hw.icon : colors.border,
                      backgroundColor:
                        textSize === s.id ? hw.bg : colors.background,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTextSize(s.id);
                  }}
                >
                  <Text
                    style={[
                      styles.sizeBtnText,
                      {
                        color: textSize === s.id ? hw.icon : colors.text,
                        fontSize:
                          s.id === "small" ? 13 : s.id === "medium" ? 17 : 21,
                      },
                    ]}
                  >
                    A
                  </Text>
                  <Text
                    style={[
                      styles.sizeLabel,
                      {
                        color:
                          textSize === s.id ? hw.icon : colors.textSecondary,
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tips */}
          <View
            style={[
              styles.tipsBox,
              {
                backgroundColor: isDark ? "#0A1A10" : "#F0FDF4",
                borderColor: "#BBF7D0",
              },
            ]}
          >
            <Text
              style={[
                styles.tipsTitle,
                { color: isDark ? "#4ADE80" : "#166534" },
              ]}
            >
              Tips for best results
            </Text>
            {[
              "Keep sentences natural — handwriting looks best at 80–120 words per page",
              "Use lined or notepad paper for exam/assignment style",
              "Requires internet to load handwriting fonts the first time",
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                <Text
                  style={[
                    styles.tipText,
                    { color: isDark ? "#86EFAC" : "#166534" },
                  ]}
                >
                  {tip}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <PrimaryButton
          title="Generate Handwriting PDF"
          iconName="pencil"
          onPress={generate}
          disabled={!text.trim()}
          style={[styles.actionBtn, { backgroundColor: hw.icon }]}
        />
      </View>
      {modal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.base },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
    gap: 12,
  },
  procTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extraBold,
    textAlign: "center",
  },
  procSub: { fontSize: FONTS.sizes.md, textAlign: "center" },
  progWrap: { width: "100%", gap: 8 },
  progText: {
    textAlign: "center",
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
  },

  viralBanner: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  viralTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.extraBold,
    marginBottom: 6,
  },
  viralSub: { fontSize: FONTS.sizes.sm, lineHeight: 18 },

  section: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.md,
  },
  textArea: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.base,
    minHeight: 160,
    maxHeight: 300,
    lineHeight: 22,
  },
  charCount: { fontSize: FONTS.sizes.xs, textAlign: "right", marginTop: 4 },

  fontGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  fontCard: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    gap: 4,
  },
  fontSample: { fontSize: 16, fontStyle: "italic" },
  fontLabel: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semiBold },

  paperRow: { flexDirection: "row", gap: SPACING.sm },
  paperBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: "center",
    gap: 4,
  },
  paperLabel: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semiBold },

  sizeRow: { flexDirection: "row", gap: SPACING.sm },
  sizeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
    gap: 4,
  },
  sizeBtnText: { fontWeight: FONTS.weights.extraBold },
  sizeLabel: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semiBold },

  tipsBox: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: 8,
  },
  tipsTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    marginBottom: 4,
  },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipText: { fontSize: FONTS.sizes.xs, flex: 1, lineHeight: 16 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.base,
    borderTopWidth: 1,
  },
  actionBtn: { width: "100%" },

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
    marginBottom: SPACING.xl,
    textAlign: "center",
  },
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
    borderBottomWidth: 1,
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
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  errorText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    flex: 1,
  },
});
