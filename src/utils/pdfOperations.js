import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import * as FileSystem from "expo-file-system";
import {
  readFileAsBase64,
  writeBase64ToFile,
  generateOutputName,
  base64ToUint8Array,
  uint8ArrayToBase64,
  imageUriToBytes,
  normalizeImageUriForPdf,
} from "./pdfHelpers";

const OUTPUT_DIR = FileSystem.documentDirectory + "FoxPDF/";

async function ensureOutputDir() {
  const info = await FileSystem.getInfoAsync(OUTPUT_DIR);
  if (!info.exists)
    await FileSystem.makeDirectoryAsync(OUTPUT_DIR, { intermediates: true });
  return OUTPUT_DIR;
}

// ─── IMAGE TO PDF ────────────────────────────────────────────────────────────
// imageAssets: string[] (URIs) or { uri, mimeType }[] — both accepted
export async function imagesToPdf(imageAssets, onProgress) {
  try {
    const dir = await ensureOutputDir();
    const pdfDoc = await PDFDocument.create();
    const assets = imageAssets.map((a) =>
      typeof a === "string" ? { uri: a, mimeType: null } : a,
    );

    for (let i = 0; i < assets.length; i++) {
      const { uri, mimeType } = assets[i];
      if (onProgress) onProgress((i / assets.length) * 0.9);
      try {
        const normalized = await normalizeImageUriForPdf(uri, mimeType);
        const imageBytes = await imageUriToBytes(normalized.uri);
        const mime = (
          normalized.mimeType ||
          mimeType ||
          "image/jpeg"
        ).toLowerCase();
        const isPng = mime.includes("png");

        let image;
        if (isPng) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          image = await pdfDoc.embedJpg(imageBytes);
        }

        const { width, height } = image;
        if (!width || !height) throw new Error("Image has zero dimensions");

        const pageWidth = 595;
        const pageHeight = 842;
        const margin = 20;
        const scale = Math.min(
          (pageWidth - margin * 2) / width,
          (pageHeight - margin * 2) / height,
          1,
        );
        const scaledW = width * scale;
        const scaledH = height * scale;
        const x = (pageWidth - scaledW) / 2;
        const y = (pageHeight - scaledH) / 2;
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawImage(image, { x, y, width: scaledW, height: scaledH });
      } catch (err) {
        console.warn(`Skipping image ${i}: ${err.message}`);
      }
    }

    if (pdfDoc.getPageCount() === 0) {
      throw new Error(
        "No images could be embedded. Ensure files are valid images.",
      );
    }

    if (onProgress) onProgress(0.95);
    const pdfBytes = await pdfDoc.save();
    const outputName = generateOutputName("images_to_pdf");
    const outputPath = dir + outputName;
    await writeBase64ToFile(uint8ArrayToBase64(pdfBytes), outputPath);
    if (onProgress) onProgress(1);
    return {
      success: true,
      path: outputPath,
      name: outputName,
      size: pdfBytes.length,
    };
  } catch (error) {
    throw new Error("Failed to convert images to PDF: " + error.message);
  }
}

// ─── MERGE PDFs ──────────────────────────────────────────────────────────────
export async function mergePdfs(pdfUris, onProgress) {
  try {
    const dir = await ensureOutputDir();
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < pdfUris.length; i++) {
      if (onProgress) onProgress((i / pdfUris.length) * 0.9);
      try {
        const base64 = await readFileAsBase64(pdfUris[i]);
        const srcPdf = await PDFDocument.load(base64ToUint8Array(base64));
        const pages = await mergedPdf.copyPages(
          srcPdf,
          srcPdf.getPageIndices(),
        );
        pages.forEach((page) => mergedPdf.addPage(page));
      } catch (err) {
        console.warn(`Skipping PDF ${i}: ${err.message}`);
      }
    }

    if (onProgress) onProgress(0.95);
    const mergedBytes = await mergedPdf.save();
    const base64 = uint8ArrayToBase64(mergedBytes);
    const outputName = generateOutputName("merged");
    const outputPath = dir + outputName;
    await writeBase64ToFile(base64, outputPath);
    if (onProgress) onProgress(1);
    return { success: true, path: outputPath, name: outputName };
  } catch (error) {
    throw new Error("Failed to merge PDFs: " + error.message);
  }
}

// ─── SPLIT PDF (page range) ──────────────────────────────────────────────────
export async function splitPdf(pdfUri, startPage, endPage, onProgress) {
  try {
    const dir = await ensureOutputDir();
    if (onProgress) onProgress(0.1);
    const base64 = await readFileAsBase64(pdfUri);
    const srcPdf = await PDFDocument.load(base64ToUint8Array(base64));
    const totalPages = srcPdf.getPageCount();

    const start = Math.max(1, Math.min(startPage, totalPages));
    const end = Math.max(start, Math.min(endPage, totalPages));
    if (onProgress) onProgress(0.4);

    const newPdf = await PDFDocument.create();
    const indices = Array.from(
      { length: end - start + 1 },
      (_, i) => start - 1 + i,
    );
    const copied = await newPdf.copyPages(srcPdf, indices);
    copied.forEach((p) => newPdf.addPage(p));

    if (onProgress) onProgress(0.85);
    const newBytes = await newPdf.save();
    const outputName = generateOutputName(`split_p${start}-${end}`);
    const outputPath = dir + outputName;
    await writeBase64ToFile(uint8ArrayToBase64(newBytes), outputPath);
    if (onProgress) onProgress(1);
    return {
      success: true,
      path: outputPath,
      name: outputName,
      totalPages,
      extractedPages: end - start + 1,
    };
  } catch (error) {
    throw new Error("Failed to split PDF: " + error.message);
  }
}

// ─── SPLIT ALL PAGES ─────────────────────────────────────────────────────────
export async function splitAllPages(pdfUri, onProgress) {
  try {
    const dir = await ensureOutputDir();
    if (onProgress) onProgress(0.05);
    const base64 = await readFileAsBase64(pdfUri);
    const srcPdf = await PDFDocument.load(base64ToUint8Array(base64));
    const totalPages = srcPdf.getPageCount();

    for (let i = 0; i < totalPages; i++) {
      if (onProgress) onProgress(0.05 + (i / totalPages) * 0.9);
      const pagePdf = await PDFDocument.create();
      const [page] = await pagePdf.copyPages(srcPdf, [i]);
      pagePdf.addPage(page);
      const pageBytes = await pagePdf.save();
      const outputName = generateOutputName(`page_${i + 1}_of_${totalPages}`);
      await writeBase64ToFile(uint8ArrayToBase64(pageBytes), dir + outputName);
    }

    if (onProgress) onProgress(1);
    return { success: true, totalPages };
  } catch (error) {
    throw new Error("Failed to split all pages: " + error.message);
  }
}

// ─── COMPRESS PDF ────────────────────────────────────────────────────────────
export async function compressPdf(pdfUri, level = "medium", onProgress) {
  try {
    const dir = await ensureOutputDir();
    if (onProgress) onProgress(0.1);
    const base64 = await readFileAsBase64(pdfUri);
    const pdfBytes = base64ToUint8Array(base64);
    const originalSize = pdfBytes.length;
    if (onProgress) onProgress(0.3);

    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    if (onProgress) onProgress(0.6);

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: level !== "low",
    });
    if (onProgress) onProgress(0.9);

    const outputName = generateOutputName(`optimised_${level}`);
    const outputPath = dir + outputName;
    await writeBase64ToFile(uint8ArrayToBase64(compressedBytes), outputPath);

    const newSize = compressedBytes.length;
    const savedPercent = Math.max(
      0,
      Math.round(((originalSize - newSize) / originalSize) * 100),
    );
    if (onProgress) onProgress(1);
    return {
      success: true,
      path: outputPath,
      name: outputName,
      originalSize,
      newSize,
      savedPercent,
    };
  } catch (error) {
    throw new Error("Failed to optimise PDF: " + error.message);
  }
}

// ─── ADD WATERMARK ───────────────────────────────────────────────────────────
export async function addWatermark(pdfUri, text, opacity = 0.25, onProgress) {
  try {
    const dir = await ensureOutputDir();
    if (onProgress) onProgress(0.1);
    const base64 = await readFileAsBase64(pdfUri);
    const pdfDoc = await PDFDocument.load(base64ToUint8Array(base64));
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
      if (onProgress) onProgress(0.1 + (i / pages.length) * 0.8);
      const page = pages[i];
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) * 0.1;
      page.drawText(text, {
        x: width * 0.15,
        y: height * 0.45,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity,
        rotate: degrees(35),
      });
    }

    if (onProgress) onProgress(0.95);
    const pdfBytes = await pdfDoc.save();
    const outputName = generateOutputName("watermarked");
    const outputPath = dir + outputName;
    await writeBase64ToFile(uint8ArrayToBase64(pdfBytes), outputPath);
    if (onProgress) onProgress(1);
    return { success: true, path: outputPath, name: outputName };
  } catch (error) {
    throw new Error("Failed to add watermark: " + error.message);
  }
}

// ─── EMBED SIGNATURE ─────────────────────────────────────────────────────────
export async function embedSignature(pdfUri, signatureBase64, onProgress) {
  try {
    const dir = await ensureOutputDir();
    if (onProgress) onProgress(0.1);
    const base64 = await readFileAsBase64(pdfUri);
    const pdfDoc = await PDFDocument.load(base64ToUint8Array(base64));

    if (onProgress) onProgress(0.4);
    // signature comes as data:image/png;base64,xxxx
    const sigDataBase64 = signatureBase64.replace(
      /^data:image\/[a-z]+;base64,/,
      "",
    );
    const sigBytes = base64ToUint8Array(sigDataBase64);
    const sigImage = await pdfDoc.embedPng(sigBytes);

    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    const sigWidth = Math.min(200, width * 0.35);
    const sigHeight = sigWidth * (sigImage.height / sigImage.width);

    lastPage.drawImage(sigImage, {
      x: width - sigWidth - 30,
      y: 30,
      width: sigWidth,
      height: sigHeight,
    });

    if (onProgress) onProgress(0.85);
    const pdfBytes = await pdfDoc.save();
    const outputName = generateOutputName("signed");
    const outputPath = dir + outputName;
    await writeBase64ToFile(uint8ArrayToBase64(pdfBytes), outputPath);
    if (onProgress) onProgress(1);
    return { success: true, path: outputPath, name: outputName };
  } catch (error) {
    throw new Error("Failed to embed signature: " + error.message);
  }
}

// ─── PAGE MANAGER ────────────────────────────────────────────────────────────
export async function managePages(pdfUri, pages, onProgress) {
  try {
    const dir = await ensureOutputDir();
    if (onProgress) onProgress(0.1);
    const base64 = await readFileAsBase64(pdfUri);
    const srcPdf = await PDFDocument.load(base64ToUint8Array(base64));

    if (onProgress) onProgress(0.3);
    const activePagesOrdered = pages.filter((p) => !p.deleted);
    const newPdf = await PDFDocument.create();

    const indices = activePagesOrdered.map((p) => p.originalIndex);
    const copiedPages = await newPdf.copyPages(srcPdf, indices);

    copiedPages.forEach((page, i) => {
      const pageData = activePagesOrdered[i];
      if (pageData.rotation !== 0) {
        page.setRotation(degrees(pageData.rotation));
      }
      newPdf.addPage(page);
    });

    if (onProgress) onProgress(0.85);
    const pdfBytes = await newPdf.save();
    const outputName = generateOutputName("managed");
    const outputPath = dir + outputName;
    await writeBase64ToFile(uint8ArrayToBase64(pdfBytes), outputPath);
    if (onProgress) onProgress(1);
    return {
      success: true,
      path: outputPath,
      name: outputName,
      pageCount: activePagesOrdered.length,
    };
  } catch (error) {
    throw new Error("Failed to rebuild PDF: " + error.message);
  }
}

// ─── GET PAGE COUNT ──────────────────────────────────────────────────────────
export async function getPdfPageCount(uri) {
  try {
    const base64 = await readFileAsBase64(uri);
    const pdfDoc = await PDFDocument.load(base64ToUint8Array(base64));
    return pdfDoc.getPageCount();
  } catch (error) {
    return null;
  }
}

// ─── LIST SAVED FILES ────────────────────────────────────────────────────────
export async function listSavedFiles() {
  try {
    const dir = await ensureOutputDir();
    const files = await FileSystem.readDirectoryAsync(dir);
    const results = [];
    for (const filename of files) {
      if (filename.endsWith(".pdf")) {
        const filePath = dir + filename;
        const info = await FileSystem.getInfoAsync(filePath, { size: true });
        results.push({
          name: filename,
          path: filePath,
          size: info.size || 0,
          modificationTime: info.modificationTime || Date.now(),
        });
      }
    }
    return results.sort((a, b) => b.modificationTime - a.modificationTime);
  } catch (error) {
    return [];
  }
}
