// src/utils/pdfHelpers.js
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Format bytes to readable file size
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get file extension
 */
export function getFileExtension(filename) {
  return filename?.split(".").pop()?.toLowerCase() || "";
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExt(filename) {
  return filename?.replace(/\.[^/.]+$/, "") || "file";
}

/**
 * Generate unique output filename
 */
export function generateOutputName(prefix = "foxpdf") {
  const timestamp = Date.now();
  return `${prefix}_${timestamp}.pdf`;
}

/**
 * Get file info from URI
 */
export async function getFileInfo(uri) {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    return info;
  } catch (error) {
    console.error("Error getting file info:", error);
    return null;
  }
}

/**
 * Read file as base64
 */
export async function readFileAsBase64(uri) {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
}

/**
 * Write base64 data to file
 */
export async function writeBase64ToFile(base64Data, outputPath) {
  try {
    await FileSystem.writeAsStringAsync(outputPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return outputPath;
  } catch (error) {
    console.error("Error writing file:", error);
    throw error;
  }
}

/**
 * Copy file to cache directory for sharing
 */
export async function copyToCache(uri, filename) {
  const destUri = FileSystem.cacheDirectory + filename;
  await FileSystem.copyAsync({ from: uri, to: destUri });
  return destUri;
}

/**
 * Delete file
 */
export async function deleteFile(uri) {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}

/**
 * Convert image URI to Uint8Array bytes for pdf-lib.
 * Handles file://, ph:// (iOS PhotoKit), and content:// (Android) URIs.
 */
export async function imageUriToBytes(uri) {
  let fileUri = uri;
  // ph:// and content:// URIs can't be read directly by FileSystem — copy first
  if (!uri.startsWith("file://")) {
    const tmpName = `img_tmp_${Date.now()}.jpg`;
    fileUri = FileSystem.cacheDirectory + tmpName;
    await FileSystem.copyAsync({ from: uri, to: fileUri });
  }
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64ToUint8Array(base64);
}

/**
 * Normalize any supported image URI to a PDF-friendly local JPEG/PNG URI.
 * JPEG and PNG are preserved; other common formats are flattened to JPEG.
 */
export async function normalizeImageUriForPdf(uri, mimeType = null) {
  const mime = (mimeType || "").toLowerCase();
  const ext = getFileExtension(uri.split("?")[0]);
  const isJpeg =
    mime.includes("jpeg") ||
    mime.includes("jpg") ||
    ext === "jpg" ||
    ext === "jpeg";
  const isPng = mime.includes("png") || ext === "png";

  if (isJpeg || isPng) {
    if (uri.startsWith("file://")) {
      return {
        uri,
        mimeType: isJpeg ? "image/jpeg" : "image/png",
        converted: false,
      };
    }

    const localExt = isPng ? "png" : "jpg";
    const tmpName = `img_tmp_${Date.now()}.${localExt}`;
    const localUri = FileSystem.cacheDirectory + tmpName;
    await FileSystem.copyAsync({ from: uri, to: localUri });
    return {
      uri: localUri,
      mimeType: isJpeg ? "image/jpeg" : "image/png",
      converted: false,
    };
  }

  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return { uri: result.uri, mimeType: "image/jpeg", converted: true };
}

/**
 * Convert base64 to Uint8Array — strips whitespace/padding issues before decode.
 */
export function base64ToUint8Array(base64) {
  // Remove any whitespace that can break atob on Hermes
  const clean = base64.replace(/\s/g, "");
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64
 */
export function uint8ArrayToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
