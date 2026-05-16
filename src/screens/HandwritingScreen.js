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
import { useTheme } from "../context/ThemeContext";
import { useProGate } from "../components/ProGate";
import {
  PrimaryButton,
  SecondaryButton,
  ProgressBar,
  ScreenHeader,
} from "../components/UIComponents";
import { generateOutputName } from "../utils/pdfHelpers";
import { FONTS, SPACING, RADIUS, SHADOW } from "../utils/theme";

const OUTPUT_DIR = FileSystem.documentDirectory + "FoxPDF/";

// ─── Config ──────────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  { id: "text", label: "Text Only", icon: "text-outline" },
  { id: "title-text", label: "Title + Body", icon: "document-text-outline" },
  { id: "title-chart", label: "Title + Chart", icon: "bar-chart-outline" },
];

const HANDWRITING_FONTS = [
  {
    id: "caveat",
    label: "Caveat",
    url: "Caveat:wght@400;700",
    name: "Caveat",
    sample: "Quick brown fox",
  },
  {
    id: "patrick",
    label: "Patrick Hand",
    url: "Patrick+Hand",
    name: "Patrick Hand",
    sample: "Quick brown fox",
  },
  {
    id: "kalam",
    label: "Kalam",
    url: "Kalam:wght@300;400;700",
    name: "Kalam",
    sample: "Quick brown fox",
  },
  {
    id: "indie",
    label: "Indie Flower",
    url: "Indie+Flower",
    name: "Indie Flower",
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
  { id: "medium", label: "Medium", fontSize: 22, lineHeight: 42 },
  { id: "large", label: "Large", fontSize: 28, lineHeight: 52 },
];

const CHART_TYPES = [
  { id: "bar", label: "Bar Chart", icon: "bar-chart-outline" },
  { id: "line", label: "Line Graph", icon: "trending-up-outline" },
];

// ─── HTML / Chart builders ────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildChartSvg({ type, labels, values, chartTitle }) {
  const W = 480;
  const H = 260;
  const padL = 44;
  const padR = 20;
  const padT = chartTitle ? 38 : 20;
  const padB = 52;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxVal = Math.max(...values, 1);

  let inner = "";

  // Grid lines + Y axis labels
  for (let i = 0; i <= 4; i++) {
    const y = padT + plotH - (i / 4) * plotH;
    const v = Math.round((maxVal * i) / 4);
    inner += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#c8cee8" stroke-width="0.8" stroke-dasharray="4,3"/>`;
    inner += `<text x="${padL - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="9" fill="#888">${v}</text>`;
  }

  if (type === "bar") {
    const gap = plotW / labels.length;
    const barW = gap * 0.55;
    const barOffset = gap * 0.225;
    labels.forEach((label, i) => {
      const barH = Math.max((values[i] / maxVal) * plotH, 2);
      const x = padL + i * gap + barOffset;
      const y = padT + plotH - barH;
      // Shadow bar
      inner += `<rect x="${(x + 2).toFixed(1)}" y="${(y + 2).toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" fill="rgba(60,100,220,0.12)" rx="3"/>`;
      // Main bar
      inner += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" fill="#4F7BE8" rx="3"/>`;
      // Value label
      inner += `<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" font-size="9" fill="#333">${values[i]}</text>`;
      // X axis label
      const labelText =
        label.length > 8 ? label.slice(0, 7) + "…" : label;
      inner += `<text x="${(x + barW / 2).toFixed(1)}" y="${(padT + plotH + 16).toFixed(1)}" text-anchor="middle" font-size="9" fill="#555">${escHtml(labelText)}</text>`;
    });
  } else {
    // Line chart
    const n = labels.length;
    const xStep = n > 1 ? plotW / (n - 1) : plotW / 2;
    const points = labels.map((_, i) => {
      const x = padL + (n > 1 ? i * xStep : plotW / 2);
      const y = padT + plotH - (values[i] / maxVal) * plotH;
      return { x, y };
    });

    // Area fill
    if (points.length >= 2) {
      const areaPoints =
        `${points[0].x.toFixed(1)},${(padT + plotH).toFixed(1)} ` +
        points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
        ` ${points[n - 1].x.toFixed(1)},${(padT + plotH).toFixed(1)}`;
      inner += `<polygon points="${areaPoints}" fill="rgba(79,123,232,0.12)"/>`;
    }

    // Line
    const polyPts = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    inner += `<polyline points="${polyPts}" fill="none" stroke="#4F7BE8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

    // Dots + labels
    points.forEach((p, i) => {
      inner += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#4F7BE8" stroke="white" stroke-width="1.5"/>`;
      inner += `<text x="${p.x.toFixed(1)}" y="${(p.y - 9).toFixed(1)}" text-anchor="middle" font-size="9" fill="#333">${values[i]}</text>`;
      const labelText =
        labels[i].length > 8 ? labels[i].slice(0, 7) + "…" : labels[i];
      inner += `<text x="${p.x.toFixed(1)}" y="${(padT + plotH + 16).toFixed(1)}" text-anchor="middle" font-size="9" fill="#555">${escHtml(labelText)}</text>`;
    });
  }

  // Axes
  inner += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#555" stroke-width="1.5"/>`;
  inner += `<line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="#555" stroke-width="1.5"/>`;

  // Chart title
  if (chartTitle) {
    inner += `<text x="${(W / 2).toFixed(1)}" y="${(padT - 12).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333">${escHtml(chartTitle)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block">${inner}</svg>`;
}

function buildHandwritingHtml({
  contentType,
  title,
  body,
  fontInfo,
  paperStyle,
  sizeConfig,
  chartConfig,
}) {
  const { fontSize, lineHeight: lh } = sizeConfig;

  const bgColor = paperStyle === "yellow" ? "#FFFBF0" : "#FFFFFF";
  const lineClr =
    paperStyle === "yellow"
      ? "rgba(185,145,38,0.38)"
      : "rgba(145,165,215,0.65)";
  const marginClr =
    paperStyle === "yellow"
      ? "rgba(218,88,48,0.38)"
      : "rgba(235,100,100,0.42)";

  let bgImage = "";
  let paddingLeft = "62px";

  if (paperStyle === "lined" || paperStyle === "yellow") {
    bgImage = `background-image:
      linear-gradient(90deg, transparent 67px, ${marginClr} 67px, ${marginClr} 69px, transparent 69px),
      repeating-linear-gradient(
        to bottom,
        transparent,
        transparent ${lh - 1}px,
        ${lineClr} ${lh - 1}px,
        ${lineClr} ${lh}px
      );`;
    paddingLeft = "82px";
  } else if (paperStyle === "graph") {
    bgImage = `background-image:
      linear-gradient(rgba(140,162,215,0.45) 1px, transparent 1px),
      linear-gradient(90deg, rgba(140,162,215,0.45) 1px, transparent 1px);
    background-size: 20px 20px;`;
    paddingLeft = "60px";
  }

  const titleHtml =
    contentType !== "text" && title
      ? `<h1 class="page-title">${escHtml(title)}</h1>`
      : "";

  const bodyHtml =
    contentType !== "title-chart" && body
      ? `<p class="body-text">${escHtml(body).replace(/\n/g, "<br/>")}</p>`
      : "";

  const chartSvg = chartConfig ? buildChartSvg(chartConfig) : "";
  const chartHtml = chartSvg
    ? `<div class="chart-wrap">${chartSvg}</div>`
    : "";

  const titleFontSize = Math.round(fontSize * 1.8);
  const titleLineH = Math.round(lh * 1.5);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=${fontInfo.url}&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: '${fontInfo.name}', cursive;
  font-size: ${fontSize}px;
  line-height: ${lh}px;
  color: #1a1a2c;
  background-color: ${bgColor};
  ${bgImage}
  padding: 50px 52px 60px ${paddingLeft};
  letter-spacing: 0.35px;
  word-spacing: 2.5px;
  text-shadow: 0.4px 0.4px 0.6px rgba(0,0,25,0.11);
  min-height: 100vh;
}
.page-title {
  font-family: '${fontInfo.name}', cursive;
  font-size: ${titleFontSize}px;
  line-height: ${titleLineH}px;
  font-weight: 700;
  color: #1a1a2c;
  letter-spacing: 0.5px;
  text-shadow: 0.5px 0.5px 0.8px rgba(0,0,25,0.14);
  margin-bottom: ${Math.round(lh * 0.6)}px;
}
.body-text {
  white-space: pre-wrap;
}
.chart-wrap {
  margin-top: ${Math.round(lh * 1.2)}px;
  display: block;
}
</style>
</head>
<body>
${titleHtml}
${bodyHtml}
${chartHtml}
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HandwritingScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { guard, modal } = useProGate();

  const [contentType, setContentType] = useState("text");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  // Chart state
  const [chartType, setChartType] = useState("bar");
  const [chartTitle, setChartTitle] = useState("");
  const [chartLabels, setChartLabels] = useState("Jan,Feb,Mar,Apr,May");
  const [chartValues, setChartValues] = useState("40,65,30,80,55");

  const [selectedFont, setSelectedFont] = useState("caveat");
  const [paperStyle, setPaperStyle] = useState("lined");
  const [textSize, setTextSize] = useState("medium");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const sizeConfig =
    TEXT_SIZES.find((s) => s.id === textSize) || TEXT_SIZES[1];
  const fontInfo =
    HANDWRITING_FONTS.find((f) => f.id === selectedFont) || HANDWRITING_FONTS[0];
  const hw = colors.handwriting || { bg: "#FFFBF0", icon: "#D97706" };

  const validateAndParseChart = () => {
    const labels = chartLabels
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const values = chartValues
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (labels.length < 2) {
      throw new Error("Enter at least 2 labels (comma-separated).");
    }
    if (values.length !== labels.length) {
      throw new Error(
        `Labels count (${labels.length}) must match values count (${values.length}).`
      );
    }
    if (chartType === "line" && labels.length < 2) {
      throw new Error("Line graph needs at least 2 data points.");
    }
    return { type: chartType, labels, values, chartTitle: chartTitle.trim() };
  };

  const generate = async () => {
    const needsBody = contentType !== "title-chart";
    const needsTitle = contentType !== "text";
    const needsChart = contentType === "title-chart";

    if (needsBody && !text.trim()) {
      Alert.alert("No text", "Please type or paste your text first.");
      return;
    }
    if (needsTitle && !title.trim()) {
      Alert.alert("No title", "Please enter a title.");
      return;
    }

    let chartConfig = null;
    if (needsChart) {
      try {
        chartConfig = validateAndParseChart();
      } catch (e) {
        Alert.alert("Chart data error", e.message);
        return;
      }
    }

    await guard(false, "You've used all 3 free operations today", async () => {
      setStatus("processing");
      setProgress(0.15);
      setErrorMsg("");

      try {
        const html = buildHandwritingHtml({
          contentType,
          title: title.trim(),
          body: text.trim(),
          fontInfo,
          paperStyle,
          sizeConfig,
          chartConfig,
        });

        setProgress(0.4);

        const { uri } = await Print.printToFileAsync({ html, base64: false });

        setProgress(0.7);

        const dirInfo = await FileSystem.getInfoAsync(OUTPUT_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(OUTPUT_DIR, {
            intermediates: true,
          });
        }

        const outputName = generateOutputName("handwriting");
        const outputPath = OUTPUT_DIR + outputName;
        await FileSystem.copyAsync({ from: uri, to: outputPath });

        setProgress(1);

        const fileInfo = await FileSystem.getInfoAsync(outputPath, {
          size: true,
        });
        setResult({ path: outputPath, name: outputName, size: fileInfo.size || 0 });
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

  // ─── Processing ─────────────────────────────────────────────────────────────
  if (status === "processing") {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <View style={styles.center}>
          <Ionicons name="pencil" size={64} color={hw.icon} />
          <Text style={[styles.procTitle, { color: colors.text }]}>
            Generating PDF…
          </Text>
          <Text style={[styles.procSub, { color: colors.textSecondary }]}>
            Laying out your handwritten document
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

  // ─── Done ────────────────────────────────────────────────────────────────────
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
            Your document has been generated
          </Text>

          <View
            style={[
              styles.resultCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {[
              ["Font", fontInfo.label],
              ["Paper", PAPER_STYLES.find((p) => p.id === paperStyle)?.label],
              [
                "Content",
                CONTENT_TYPES.find((c) => c.id === contentType)?.label,
              ],
              ["File", result.name],
            ].map(([label, value], i, arr) => (
              <View
                key={label}
                style={[
                  styles.resultRow,
                  i < arr.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.resultLabel, { color: colors.textSecondary }]}
                >
                  {label}
                </Text>
                <Text
                  style={[styles.resultValue, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {value}
                </Text>
              </View>
            ))}
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
          <SecondaryButton title="Make Another" onPress={reset} style={styles.btn} />
        </ScrollView>
        {modal}
      </SafeAreaView>
    );
  }

  // ─── Main editor ─────────────────────────────────────────────────────────────
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
              Real handwriting fonts, lined/graph paper, large titles, and
              charts — all in one PDF.
            </Text>
          </View>

          {/* Content Type */}
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Content Type
            </Text>
            <View style={styles.typeRow}>
              {CONTENT_TYPES.map((ct) => (
                <TouchableOpacity
                  key={ct.id}
                  style={[
                    styles.typeBtn,
                    {
                      borderColor:
                        contentType === ct.id ? hw.icon : colors.border,
                      backgroundColor:
                        contentType === ct.id ? hw.bg : colors.background,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setContentType(ct.id);
                  }}
                >
                  <Ionicons
                    name={ct.icon}
                    size={18}
                    color={contentType === ct.id ? hw.icon : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeBtnLabel,
                      {
                        color:
                          contentType === ct.id ? hw.icon : colors.textSecondary,
                      },
                    ]}
                  >
                    {ct.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input (shown for title-text and title-chart) */}
          {contentType !== "text" && (
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Page Title
              </Text>
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter a large heading title…"
                placeholderTextColor={colors.textLight}
                maxLength={120}
              />
            </View>
          )}

          {/* Body Text (shown for text and title-text) */}
          {contentType !== "title-chart" && (
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {contentType === "title-text" ? "Body Text" : "Your Text"}
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
                placeholder="Type or paste your text here…"
                placeholderTextColor={colors.textLight}
                multiline
                textAlignVertical="top"
                maxLength={5000}
              />
              <Text style={[styles.charCount, { color: colors.textLight }]}>
                {text.length}/5000
              </Text>
            </View>
          )}

          {/* Chart Config (shown for title-chart) */}
          {contentType === "title-chart" && (
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Chart / Graph
              </Text>

              {/* Chart type */}
              <View style={styles.chartTypeRow}>
                {CHART_TYPES.map((ct) => (
                  <TouchableOpacity
                    key={ct.id}
                    style={[
                      styles.chartTypeBtn,
                      {
                        borderColor:
                          chartType === ct.id ? hw.icon : colors.border,
                        backgroundColor:
                          chartType === ct.id ? hw.bg : colors.background,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setChartType(ct.id);
                    }}
                  >
                    <Ionicons
                      name={ct.icon}
                      size={18}
                      color={
                        chartType === ct.id ? hw.icon : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.chartTypeBtnLabel,
                        {
                          color:
                            chartType === ct.id ? hw.icon : colors.textSecondary,
                        },
                      ]}
                    >
                      {ct.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chart title */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Chart Title (optional)
              </Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}
                value={chartTitle}
                onChangeText={setChartTitle}
                placeholder="e.g. Monthly Sales"
                placeholderTextColor={colors.textLight}
                maxLength={60}
              />

              {/* Labels */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Labels (comma-separated)
              </Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}
                value={chartLabels}
                onChangeText={setChartLabels}
                placeholder="Jan,Feb,Mar,Apr,May"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
              />

              {/* Values */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Values (comma-separated numbers)
              </Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}
                value={chartValues}
                onChangeText={setChartValues}
                placeholder="40,65,30,80,55"
                placeholderTextColor={colors.textLight}
                keyboardType="default"
                autoCapitalize="none"
              />

              <Text style={[styles.chartHint, { color: colors.textLight }]}>
                Labels and values count must match.
              </Text>
            </View>
          )}

          {/* Handwriting Style */}
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
              {HANDWRITING_FONTS.map((f) => (
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
                          selectedFont === f.id ? hw.icon : colors.textSecondary,
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
                          selectedFont === f.id ? hw.icon : colors.textSecondary,
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
                    color={
                      paperStyle === p.id ? hw.icon : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.paperLabel,
                      {
                        color:
                          paperStyle === p.id
                            ? hw.icon
                            : colors.textSecondary,
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
                      borderColor:
                        textSize === s.id ? hw.icon : colors.border,
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
              "Uses real Google handwriting fonts — requires internet on first generation",
              "Lined & notepad paper aligns perfectly with the text baseline",
              "Use Title + Chart for diagrams; Title + Body for long assignments",
              "Bar chart: great for comparisons; Line graph: great for trends",
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
          style={[styles.actionBtn, { backgroundColor: hw.icon }]}
        />
      </View>
      {modal}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // Content type
  typeRow: { flexDirection: "row", gap: SPACING.sm },
  typeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: "center",
    gap: 4,
  },
  typeBtnLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semiBold,
    textAlign: "center",
  },

  // Title input
  titleInput: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold,
  },

  // Text area
  textArea: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.base,
    minHeight: 150,
    maxHeight: 280,
    lineHeight: 22,
  },
  charCount: { fontSize: FONTS.sizes.xs, textAlign: "right", marginTop: 4 },

  // Chart
  chartTypeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  chartTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    justifyContent: "center",
  },
  chartTypeBtnLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
  },
  fieldLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  fieldInput: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.base,
  },
  chartHint: {
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.sm,
    textAlign: "center",
  },

  // Font
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

  // Paper
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

  // Size
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

  // Tips
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

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.base,
    borderTopWidth: 1,
  },
  actionBtn: { width: "100%" },

  // Result
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
  },
  resultLabel: { fontSize: FONTS.sizes.sm },
  resultValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    maxWidth: "60%",
    textAlign: "right",
  },
  btn: { width: "100%", marginBottom: SPACING.sm },

  // Error
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
