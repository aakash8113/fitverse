/**
 * Compress an image file client-side before upload.
 * Downsizes to a max dimension while maintaining aspect ratio,
 * and adjusts JPEG quality to keep file size reasonable.
 *
 * @param file   - The original File from an <input type="file">
 * @param opts   - Optional config
 * @returns      A new File object (or the original if compression fails)
 */
export interface CompressOptions {
  /** Max width/height in pixels (default 1920) */
  maxDimension?: number;
  /** JPEG quality 0–1 (default 0.8) */
  quality?: number;
  /** Output format — defaults to original type or 'image/jpeg' */
  type?: string;
}

export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const { maxDimension = 1920, quality = 0.8 } = opts;

  // Skip non-image or already-small files
  if (!file.type.startsWith('image/')) return file;
  if (file.size < 500 * 1024) return file; // <500KB — skip

  try {
    const original = await readFileAsImage(file);

    let { width, height } = original;

    // Downscale if larger than maxDimension
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Draw onto canvas at new size
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(original, 0, 0, width, height);

    // Determine output type
    const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outType, outType === 'image/png' ? undefined : quality)
    );
    if (!blob) return file;

    // Only use compressed version if it's actually smaller
    if (blob.size >= file.size) return file;

    const ext = outType.split('/')[1] || 'jpg';
    const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
    return new File([blob], name, { type: outType });
  } catch {
    return file; // Fall back to original on error
  }
}

/**
 * Compress multiple images in parallel.
 */
export async function compressImages(
  files: File[],
  opts?: CompressOptions
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, opts)));
}

// ── Helpers ───────────────────────────────────────────────────────────────

function readFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image'));
    };
    img.src = url;
  });
}