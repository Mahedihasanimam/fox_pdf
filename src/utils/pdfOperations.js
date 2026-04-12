// src/utils/pdfOperations.js
import { PDFDocument, rgb } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import {
  readFileAsBase64,
  writeBase64ToFile,
  generateOutputName,
  base64ToUint8Array,
  uint8ArrayToBase64,
  imageUriToBytes,
} from './pdfHelpers';

const OUTPUT_DIR = FileSystem.documentDirectory + 'FoxPDF/';

/**
 * Ensure output directory exists
 */
async function ensureOutputDir() {
  const dirInfo = await FileSystem.getInfoAsync(OUTPUT_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(OUTPUT_DIR, { intermediates: true });
  }
  return OUTPUT_DIR;
}

/**
 * IMAGE TO PDF
 * Converts multiple image URIs into a single PDF
 */
export async function imagesToPdf(imageUris, onProgress) {
  try {
    const dir = await ensureOutputDir();
    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      if (onProgress) onProgress((i / imageUris.length) * 0.9);

      try {
        const imageBytes = await imageUriToBytes(uri);
        const ext = uri.split('.').pop()?.toLowerCase();
        const isJpeg = ext === 'jpg' || ext === 'jpeg';

        let image;
        if (isJpeg) {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          // PNG or other — try PNG embed, fallback to JPEG
          try {
            image = await pdfDoc.embedPng(imageBytes);
          } catch {
            image = await pdfDoc.embedJpg(imageBytes);
          }
        }

        const { width, height } = image;

        // A4 page size: 595 x 842 points
        const pageWidth = 595;
        const pageHeight = 842;
        const margin = 20;

        const availW = pageWidth - margin * 2;
        const availH = pageHeight - margin * 2;

        // Scale image to fit page
        const scaleX = availW / width;
        const scaleY = availH / height;
        const scale = Math.min(scaleX, scaleY, 1);

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

    if (onProgress) onProgress(0.95);

    const pdfBytes = await pdfDoc.save();
    const base64 = uint8ArrayToBase64(pdfBytes);

    const outputName = generateOutputName('images_to_pdf');
    const outputPath = dir + outputName;
    await writeBase64ToFile(base64, outputPath);

    if (onProgress) onProgress(1);
    return { success: true, path: outputPath, name: outputName };
  } catch (error) {
    console.error('imagesToPdf error:', error);
    throw new Error('Failed to convert images to PDF: ' + error.message);
  }
}

/**
 * MERGE PDFs
 * Merges multiple PDF files into one
 */
export async function mergePdfs(pdfUris, onProgress) {
  try {
    const dir = await ensureOutputDir();
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < pdfUris.length; i++) {
      const uri = pdfUris[i];
      if (onProgress) onProgress((i / pdfUris.length) * 0.9);

      try {
        const base64 = await readFileAsBase64(uri);
        const pdfBytes = base64ToUint8Array(base64);
        const srcPdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      } catch (err) {
        console.warn(`Skipping PDF ${i}: ${err.message}`);
      }
    }

    if (onProgress) onProgress(0.95);

    const mergedBytes = await mergedPdf.save();
    const base64 = uint8ArrayToBase64(mergedBytes);

    const outputName = generateOutputName('merged');
    const outputPath = dir + outputName;
    await writeBase64ToFile(base64, outputPath);

    if (onProgress) onProgress(1);
    return { success: true, path: outputPath, name: outputName };
  } catch (error) {
    console.error('mergePdfs error:', error);
    throw new Error('Failed to merge PDFs: ' + error.message);
  }
}

/**
 * SPLIT PDF
 * Extracts pages from startPage to endPage (1-indexed, inclusive)
 */
export async function splitPdf(pdfUri, startPage, endPage, onProgress) {
  try {
    const dir = await ensureOutputDir();

    if (onProgress) onProgress(0.1);
    const base64 = await readFileAsBase64(pdfUri);
    const pdfBytes = base64ToUint8Array(base64);

    if (onProgress) onProgress(0.3);
    const srcPdf = await PDFDocument.load(pdfBytes);
    const totalPages = srcPdf.getPageCount();

    // Clamp values
    const start = Math.max(1, Math.min(startPage, totalPages));
    const end = Math.max(start, Math.min(endPage, totalPages));

    if (onProgress) onProgress(0.5);

    const newPdf = await PDFDocument.create();
    // 0-indexed page indices
    const pageIndices = [];
    for (let i = start - 1; i < end; i++) {
      pageIndices.push(i);
    }

    const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach((p) => newPdf.addPage(p));

    if (onProgress) onProgress(0.85);

    const newBytes = await newPdf.save();
    const outBase64 = uint8ArrayToBase64(newBytes);

    const outputName = generateOutputName(`split_p${start}-${end}`);
    const outputPath = dir + outputName;
    await writeBase64ToFile(outBase64, outputPath);

    if (onProgress) onProgress(1);
    return {
      success: true,
      path: outputPath,
      name: outputName,
      totalPages,
      extractedPages: end - start + 1,
    };
  } catch (error) {
    console.error('splitPdf error:', error);
    throw new Error('Failed to split PDF: ' + error.message);
  }
}

/**
 * COMPRESS PDF
 * Basic compression by re-saving with optimizations
 * Levels: 'low' | 'medium' | 'high'
 */
export async function compressPdf(pdfUri, level = 'medium', onProgress) {
  try {
    const dir = await ensureOutputDir();

    if (onProgress) onProgress(0.1);
    const base64 = await readFileAsBase64(pdfUri);
    const pdfBytes = base64ToUint8Array(base64);
    const originalSize = pdfBytes.length;

    if (onProgress) onProgress(0.3);

    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
    });

    if (onProgress) onProgress(0.6);

    // Compression settings based on level
    const saveOptions = {};

    // pdf-lib's objectsPerTick affects memory/speed tradeoff
    // For actual size reduction, we re-save which removes unused objects
    const compressedBytes = await pdfDoc.save({
      ...saveOptions,
      useObjectStreams: level !== 'low', // object streams compress more
    });

    if (onProgress) onProgress(0.9);

    const compressedBase64 = uint8ArrayToBase64(compressedBytes);
    const outputName = generateOutputName(`compressed_${level}`);
    const outputPath = dir + outputName;
    await writeBase64ToFile(compressedBase64, outputPath);

    const newSize = compressedBytes.length;
    const savedPercent = Math.round(((originalSize - newSize) / originalSize) * 100);

    if (onProgress) onProgress(1);

    return {
      success: true,
      path: outputPath,
      name: outputName,
      originalSize,
      newSize,
      savedPercent: Math.max(0, savedPercent),
    };
  } catch (error) {
    console.error('compressPdf error:', error);
    throw new Error('Failed to compress PDF: ' + error.message);
  }
}

/**
 * Get PDF page count
 */
export async function getPdfPageCount(uri) {
  try {
    const base64 = await readFileAsBase64(uri);
    const pdfBytes = base64ToUint8Array(base64);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error('getPdfPageCount error:', error);
    return null;
  }
}

/**
 * List all saved PDFs in the output directory
 */
export async function listSavedFiles() {
  try {
    const dir = await ensureOutputDir();
    const files = await FileSystem.readDirectoryAsync(dir);
    const results = [];

    for (const filename of files) {
      if (filename.endsWith('.pdf')) {
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
    console.error('listSavedFiles error:', error);
    return [];
  }
}
