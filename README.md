# 🦊 FoxPDF Tools

A **full offline PDF toolkit** built with React Native + Expo.

## Features
- 🖼️ **Image to PDF** — Convert multiple JPG/PNG images into a PDF
- 🔗 **Merge PDF** — Combine multiple PDFs into one file
- ✂️ **Split PDF** — Extract specific pages from a PDF
- 📦 **Compress PDF** — Reduce PDF file size (Low / Medium / High)

## Tech Stack
- **React Native + Expo** (SDK 51)
- **pdf-lib** — all PDF operations happen on-device (100% offline)
- **expo-document-picker** — open PDF files
- **expo-image-picker** — select images from gallery
- **expo-file-system** — read/write files
- **expo-sharing** — share/download output PDFs
- **React Navigation** — screen navigation

---

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your Android/iOS device (for testing)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start Expo dev server
npx expo start

# 3. Scan QR code with Expo Go app on your phone
```

### Run on specific platform
```bash
npx expo start --android   # Android emulator
npx expo start --ios       # iOS simulator (Mac only)
```

---

## 📁 Project Structure

```
FoxPDF/
├── App.js                          # Entry point
├── app.json                        # Expo config
├── package.json
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js        # Stack navigator
│   ├── screens/
│   │   ├── HomeScreen.js          # Tool grid + recent files
│   │   ├── ImageToPdfScreen.js    # Image → PDF
│   │   ├── MergePdfScreen.js      # Merge PDFs
│   │   ├── SplitPdfScreen.js      # Split PDF by page range
│   │   ├── CompressPdfScreen.js   # Compress PDF
│   │   └── FilesScreen.js         # All saved files
│   ├── components/
│   │   └── UIComponents.js        # Reusable UI components
│   └── utils/
│       ├── theme.js               # Colors, fonts, spacing
│       ├── pdfHelpers.js          # File utilities
│       └── pdfOperations.js       # Core PDF operations (pdf-lib)
└── assets/
    ├── icon.png                   # App icon (replace with yours)
    └── splash.png                 # Splash screen (replace with yours)
```

---

## 📱 Build for Production

### Android APK
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### Google Play Store
```bash
eas build --platform android --profile production
```

---

## 🎨 Customization

### Change App Colors
Edit `src/utils/theme.js` → `COLORS.primary` to change the brand color.

### Add Ads (AdMob)
1. Install: `npx expo install expo-ads-admob`
2. Add banner to `HomeScreen.js` bottom area
3. Add interstitial on result screens

---

## ⚠️ Known Limitations

- **Compression**: pdf-lib's compression removes unused objects. For heavy image compression, a backend API (like iLovePDF) would be needed.
- **Image formats**: Works best with JPG/PNG. HEIC files may need conversion first.
- **Large files**: PDFs >50MB may be slow on older devices.

---

## 📈 Growth Tips (Play Store)

**ASO Keywords:**
`pdf tools, pdf converter, image to pdf, merge pdf, split pdf, compress pdf, pdf editor, pdf maker`

**Description focus:**
- "100% offline, no internet needed"
- "Free PDF tools"  
- "Fast and lightweight"

---

## Best Claude AI Prompt (for extending this app)

```
You are an expert React Native / Expo developer.
I have a PDF tools app called FoxPDF built with:
- Expo SDK 51
- pdf-lib for PDF operations  
- expo-document-picker, expo-image-picker, expo-file-system, expo-sharing
- React Navigation (Stack)
- Custom design system in src/utils/theme.js

The app has these screens: Home, ImageToPdf, MergePdf, SplitPdf, CompressPdf, Files.

Add a new feature: [DESCRIBE YOUR FEATURE HERE]

Requirements:
- Follow the existing code patterns and file structure
- Use the theme.js design system (COLORS, FONTS, SPACING, RADIUS, SHADOW)
- Keep it 100% offline (no backend)
- Include loading/processing state with ProgressBar component
- Include result/done state with share button
- Handle errors gracefully with errorBanner style
- Keep code modular and beginner-friendly
```

---

Made with ❤️ using Expo + pdf-lib
