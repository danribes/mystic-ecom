/**
 * File Validation Utilities
 *
 * Provides magic byte (file signature) validation to prevent malicious file uploads.
 * Validates that file content actually matches the claimed MIME type/extension.
 *
 * Security Task: T205
 */

/**
 * File magic bytes (file signatures) for common file types
 * These are the first few bytes that identify a file type
 */
const FILE_SIGNATURES: Record<string, {
  signature: number[][];  // Multiple possible signatures
  offset: number;         // Offset where signature starts
  extension: string[];    // Valid extensions
  mimeType: string[];     // Valid MIME types
}> = {
  // Images
  'jpeg': {
    signature: [
      [0xFF, 0xD8, 0xFF, 0xE0],  // JPEG/JFIF
      [0xFF, 0xD8, 0xFF, 0xE1],  // JPEG/Exif
      [0xFF, 0xD8, 0xFF, 0xE2],  // JPEG/Canon
      [0xFF, 0xD8, 0xFF, 0xE8],  // JPEG/SPIFF
    ],
    offset: 0,
    extension: ['jpg', 'jpeg'],
    mimeType: ['image/jpeg'],
  },
  'png': {
    signature: [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    ],
    offset: 0,
    extension: ['png'],
    mimeType: ['image/png'],
  },
  'gif': {
    signature: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],  // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],  // GIF89a
    ],
    offset: 0,
    extension: ['gif'],
    mimeType: ['image/gif'],
  },
  'webp': {
    signature: [
      [0x52, 0x49, 0x46, 0x46],  // RIFF
    ],
    offset: 0,
    extension: ['webp'],
    mimeType: ['image/webp'],
  },

  // Documents
  'pdf': {
    signature: [
      [0x25, 0x50, 0x44, 0x46, 0x2D],  // %PDF-
    ],
    offset: 0,
    extension: ['pdf'],
    mimeType: ['application/pdf'],
  },
  'zip': {
    signature: [
      [0x50, 0x4B, 0x03, 0x04],  // PK.. (ZIP)
      [0x50, 0x4B, 0x05, 0x06],  // PK.. (empty ZIP)
      [0x50, 0x4B, 0x07, 0x08],  // PK.. (spanned ZIP)
    ],
    offset: 0,
    extension: ['zip', 'epub', 'jar'],
    mimeType: ['application/zip', 'application/epub+zip', 'application/java-archive'],
  },

  // Audio
  'mp3': {
    signature: [
      [0xFF, 0xFB],              // MP3 with MPEG-1 Layer 3
      [0xFF, 0xF3],              // MP3 with MPEG-1 Layer 3
      [0xFF, 0xF2],              // MP3 with MPEG-2 Layer 3
      [0x49, 0x44, 0x33],        // ID3v2 tag
    ],
    offset: 0,
    extension: ['mp3'],
    mimeType: ['audio/mpeg', 'audio/mp3'],
  },
  'wav': {
    signature: [
      [0x52, 0x49, 0x46, 0x46],  // RIFF
    ],
    offset: 0,
    extension: ['wav'],
    mimeType: ['audio/wav', 'audio/wave', 'audio/x-wav'],
  },

  // Video
  'mp4': {
    signature: [
      [0x66, 0x74, 0x79, 0x70],  // ftyp
    ],
    offset: 4,  // MP4 signature is at byte 4
    extension: ['mp4', 'm4v', 'm4a'],
    mimeType: ['video/mp4', 'audio/mp4'],
  },
  'mov': {
    signature: [
      [0x66, 0x74, 0x79, 0x70, 0x71, 0x74],  // ftypqt
    ],
    offset: 4,
    extension: ['mov'],
    mimeType: ['video/quicktime'],
  },
};

/**
 * Read magic bytes from a file buffer
 *
 * @param buffer - File buffer to read from
 * @param length - Number of bytes to read
 * @param offset - Offset to start reading from
 * @returns Array of byte values
 */
function readMagicBytes(buffer: ArrayBuffer, length: number, offset: number = 0): number[] {
  const view = new Uint8Array(buffer);
  const bytes: number[] = [];

  for (let i = offset; i < Math.min(offset + length, view.length); i++) {
    bytes.push(view[i]);
  }

  return bytes;
}

/**
 * Check if magic bytes match a signature
 *
 * @param bytes - Actual bytes from file
 * @param signature - Expected signature bytes
 * @returns True if bytes match signature
 */
function matchesSignature(bytes: number[], signature: number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Detect file type from magic bytes
 *
 * @param buffer - File buffer to analyze
 * @returns Detected file type or null if unknown
 */
export function detectFileType(buffer: ArrayBuffer): {
  type: string;
  extension: string[];
  mimeType: string[];
} | null {
  // Read enough bytes to check all signatures
  const maxBytesNeeded = 20; // Sufficient for all our signatures
  const bytes = readMagicBytes(buffer, maxBytesNeeded);

  // Check each file type
  for (const [type, info] of Object.entries(FILE_SIGNATURES)) {
    const bytesToCheck = readMagicBytes(buffer, 20, info.offset);

    // Check all possible signatures for this type
    for (const signature of info.signature) {
      if (matchesSignature(bytesToCheck, signature)) {
        return {
          type,
          extension: info.extension,
          mimeType: info.mimeType,
        };
      }
    }
  }

  return null;
}

/**
 * Validate file against claimed MIME type
 *
 * @param buffer - File buffer to validate
 * @param claimedMimeType - MIME type claimed by upload
 * @returns Validation result with details
 */
export function validateFileMagicBytes(
  buffer: ArrayBuffer,
  claimedMimeType: string
): {
  valid: boolean;
  detectedType?: string;
  message?: string;
} {
  // Detect actual file type from magic bytes
  const detected = detectFileType(buffer);

  if (!detected) {
    return {
      valid: false,
      message: 'Unable to detect file type from content. File may be corrupted or unsupported.',
    };
  }

  // Check if detected MIME type matches claimed MIME type
  const mimeTypeMatches = detected.mimeType.some(
    mime => mime.toLowerCase() === claimedMimeType.toLowerCase()
  );

  if (!mimeTypeMatches) {
    return {
      valid: false,
      detectedType: detected.type,
      message: `File content doesn't match claimed type. Expected: ${claimedMimeType}, Detected: ${detected.mimeType[0]}`,
    };
  }

  return {
    valid: true,
    detectedType: detected.type,
    message: 'File type validated successfully',
  };
}

/**
 * Validate file extension against detected file type
 *
 * @param buffer - File buffer to validate
 * @param filename - Filename with extension
 * @returns Validation result
 */
export function validateFileExtension(
  buffer: ArrayBuffer,
  filename: string
): {
  valid: boolean;
  detectedType?: string;
  message?: string;
} {
  // Extract extension from filename
  const extension = filename.split('.').pop()?.toLowerCase();

  if (!extension) {
    return {
      valid: false,
      message: 'File must have an extension',
    };
  }

  // Detect actual file type
  const detected = detectFileType(buffer);

  if (!detected) {
    return {
      valid: false,
      message: 'Unable to detect file type from content',
    };
  }

  // Check if extension matches detected type
  const extensionMatches = detected.extension.some(
    ext => ext.toLowerCase() === extension.toLowerCase()
  );

  if (!extensionMatches) {
    return {
      valid: false,
      detectedType: detected.type,
      message: `File extension doesn't match content. Extension: .${extension}, Detected type: ${detected.type} (expected: ${detected.extension.join(', ')})`,
    };
  }

  return {
    valid: true,
    detectedType: detected.type,
    message: 'File extension validated successfully',
  };
}

/**
 * Complete file validation (MIME type + extension + magic bytes)
 *
 * @param file - File to validate (with buffer, mimeType, and name)
 * @returns Comprehensive validation result
 */
export async function validateFile(file: {
  buffer: ArrayBuffer;
  mimeType: string;
  name: string;
}): Promise<{
  valid: boolean;
  detectedType?: string;
  errors: string[];
}> {
  const errors: string[] = [];

  // Validate magic bytes against claimed MIME type
  const mimeValidation = validateFileMagicBytes(file.buffer, file.mimeType);
  if (!mimeValidation.valid) {
    errors.push(mimeValidation.message || 'MIME type validation failed');
  }

  // Validate extension against detected type
  const extensionValidation = validateFileExtension(file.buffer, file.name);
  if (!extensionValidation.valid) {
    errors.push(extensionValidation.message || 'Extension validation failed');
  }

  return {
    valid: errors.length === 0,
    detectedType: mimeValidation.detectedType || extensionValidation.detectedType,
    errors,
  };
}

/**
 * Get supported file types for display to users
 */
export function getSupportedFileTypes(): Array<{
  type: string;
  extensions: string[];
  mimeTypes: string[];
}> {
  return Object.entries(FILE_SIGNATURES).map(([type, info]) => ({
    type,
    extensions: info.extension,
    mimeTypes: info.mimeType,
  }));
}

/**
 * Check if a MIME type is supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
  return Object.values(FILE_SIGNATURES).some(info =>
    info.mimeType.some(mime => mime.toLowerCase() === mimeType.toLowerCase())
  );
}

/**
 * Check if a file extension is supported
 */
export function isSupportedExtension(extension: string): boolean {
  const ext = extension.toLowerCase().replace('.', '');
  return Object.values(FILE_SIGNATURES).some(info =>
    info.extension.some(e => e.toLowerCase() === ext)
  );
}
