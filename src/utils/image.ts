// src/utils/image.ts

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export type NormalizeImageOptions = {
  /**
   * Maximum final file size after normalization.
   * Default: 8 MB.
   */
  maxSizeMB?: number;

  /**
   * JPEG quality used when converting HEIC / HEIF.
   * Range: 0 - 1.
   * Default: 0.88.
   */
  heicQuality?: number;
};

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

export const IMAGE_ACCEPT =
  "image/*,.heic,.heif,.HEIC,.HEIF";

const HEIC_EXTENSIONS =
  new Set([
    "heic",
    "heif",
  ]);

const HEIC_MIME_TYPES =
  new Set([
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
  ]);

const KNOWN_IMAGE_EXTENSIONS =
  new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "avif",
    "bmp",
    "heic",
    "heif",
  ]);

/*
 * =========================================================
 * PUBLIC API
 * =========================================================
 */

/**
 * Normalizes an uploaded image before sending it to Storage.
 *
 * - HEIC / HEIF -> JPEG
 * - Normal browser image -> unchanged
 * - Invalid files -> error
 * - Oversized output -> error
 */
export async function normalizeImageFile(
  file: File,
  options: NormalizeImageOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 8,
    heicQuality = 0.88,
  } = options;

  if (!file) {
    throw new Error(
      "No image was selected."
    );
  }

  if (!isSupportedImageFile(file)) {
    throw new Error(
      "Unsupported image format. Use JPG, JPEG, PNG, WebP, GIF, AVIF, HEIC, or HEIF."
    );
  }

  let normalizedFile =
    file;

  /*
   * HEIC / HEIF is unreliable for direct browser display,
   * so convert it to JPEG first.
   */

  if (isHeicFile(file)) {
    normalizedFile =
      await convertHeicToJpeg(
        file,
        heicQuality
      );
  }

  /*
   * Validate size AFTER conversion.
   */

  const maximumBytes =
    maxSizeMB *
    1024 *
    1024;

  if (
    normalizedFile.size >
    maximumBytes
  ) {
    throw new Error(
      `Image must be smaller than ${maxSizeMB} MB.`
    );
  }

  return normalizedFile;
}

/**
 * Useful for validating several selected images.
 */
export async function normalizeImageFiles(
  files: File[],
  options: NormalizeImageOptions = {}
): Promise<File[]> {
  return Promise.all(
    files.map(
      (file) =>
        normalizeImageFile(
          file,
          options
        )
    )
  );
}

/**
 * Detect HEIC / HEIF even when the browser
 * gives an empty or generic MIME type.
 */
export function isHeicFile(
  file: File
) {
  const extension =
    getFileExtension(
      file.name
    );

  return (
    HEIC_EXTENSIONS.has(
      extension
    ) ||
    HEIC_MIME_TYPES.has(
      file.type.toLowerCase()
    )
  );
}

/**
 * Checks browser-supported images + HEIC / HEIF.
 */
export function isSupportedImageFile(
  file: File
) {
  if (
    file.type
      .toLowerCase()
      .startsWith(
        "image/"
      )
  ) {
    return true;
  }

  const extension =
    getFileExtension(
      file.name
    );

  return KNOWN_IMAGE_EXTENSIONS.has(
    extension
  );
}

/*
 * =========================================================
 * HEIC -> JPEG
 * =========================================================
 */

async function convertHeicToJpeg(
  file: File,
  quality: number
): Promise<File> {
  try {
    /*
     * Dynamic import is intentional.
     *
     * heic2any depends on browser APIs,
     * therefore it should only be loaded when
     * an actual HEIC image needs conversion.
     */

    const module =
      await import(
        "heic2any"
      );

    const heic2any =
      module.default;

    const result =
      await heic2any({
        blob:
          file,

        toType:
          "image/jpeg",

        quality:
          clamp(
            quality,
            0.5,
            1
          ),

        multiple:
          false,
      });

    const blob =
      Array.isArray(
        result
      )
        ? result[0]
        : result;

    if (!blob) {
      throw new Error(
        "HEIC conversion returned an empty file."
      );
    }

    const outputName =
      replaceExtension(
        file.name,
        "jpg"
      );

    return new File(
      [blob],
      outputName,
      {
        type:
          "image/jpeg",

        lastModified:
          file.lastModified ||
          Date.now(),
      }
    );
  } catch (error) {
    console.error(
      "HEIC conversion error:",
      error
    );

    throw new Error(
      "This HEIC/HEIF photo could not be converted. Try another photo or convert it to JPG first."
    );
  }
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getFileExtension(
  fileName: string
) {
  return (
    fileName
      .split(".")
      .pop()
      ?.trim()
      .toLowerCase() ??
    ""
  );
}

function replaceExtension(
  fileName: string,
  extension: string
) {
  const cleanName =
    fileName
      .replace(
        /\.[^/.]+$/,
        ""
      )
      .trim();

  return `${
    cleanName ||
    "photo"
  }.${extension}`;
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(
      value,
      min
    ),
    max
  );
}