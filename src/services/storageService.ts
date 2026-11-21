import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type UploadTaskSnapshot,
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_INLINE_IMAGE_BYTES = 512 * 1024;
const FILE_READ_TIMEOUT_MS = 10_000;
const STORAGE_UPLOAD_TIMEOUT_MS = 20_000;
const DOWNLOAD_URL_TIMEOUT_MS = 8_000;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file type and size before upload
 */
export function validateComplaintImage(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid image type (${file.type}). Only JPEG, PNG, and WebP images are accepted.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMB}MB) exceeds the 5MB maximum limit.`,
    };
  }

  return { valid: true };
}

export function readComplaintImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let finished = false;
    let timer: ReturnType<typeof setTimeout>;
    const cleanup = () => clearTimeout(timer);
    timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      reader.abort();
      cleanup();
      reject(new Error('Reading the selected photograph timed out.'));
    }, FILE_READ_TIMEOUT_MS);

    reader.onload = () => {
      if (finished) return;
      finished = true;
      cleanup();
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('The selected photograph could not be read.'));
    };
    reader.onerror = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error('The selected photograph could not be read.'));
    };
    reader.onabort = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error('Reading the selected photograph was cancelled.'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads evidence to Firebase Storage, with a size-limited Firestore data-URL
 * fallback that stays below Firestore's document-size limit.
 */
export async function uploadComplaintImage(file: File, userId: string = 'anonymous'): Promise<string> {
  const validation = validateComplaintImage(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const inlineFallback = async (storageError?: unknown): Promise<string> => {
    if (file.size > MAX_INLINE_IMAGE_BYTES) {
      const detail = storageError instanceof Error ? ` ${storageError.message}` : '';
      throw new Error(
        `The photograph could not be attached, and it is too large for safe Firestore storage. Select an image no larger than 512 KB or enable Firebase Storage.${detail}`
      );
    }
    if (storageError && import.meta.env.DEV) {
      console.warn('[CivicResolve] Firebase Storage upload failed; using the size-limited inline image fallback.');
    }
    return await readComplaintImageAsDataUrl(file);
  };

  if (isFirebaseConfigured() && storage) {
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `complaint_evidence/${userId}/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      const snapshot = await new Promise<UploadTaskSnapshot>((resolve, reject) => {
        let unsubscribe: (() => void) | undefined;
        const timer = setTimeout(() => {
          unsubscribe?.();
          uploadTask.cancel();
          reject(new Error('Photograph upload timed out.'));
        }, STORAGE_UPLOAD_TIMEOUT_MS);
        unsubscribe = uploadTask.on(
          'state_changed',
          undefined,
          (error) => {
            clearTimeout(timer);
            unsubscribe?.();
            reject(error);
          },
          () => {
            clearTimeout(timer);
            unsubscribe?.();
            resolve(uploadTask.snapshot);
          }
        );
      });
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const downloadUrl = await Promise.race([
        getDownloadURL(snapshot.ref),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Timed out retrieving the uploaded photograph URL.')), DOWNLOAD_URL_TIMEOUT_MS);
        }),
      ]).finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });
      return downloadUrl;
    } catch (error) {
      return await inlineFallback(error);
    }
  }

  return await inlineFallback();
}
