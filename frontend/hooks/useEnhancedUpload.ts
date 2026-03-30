/**
 * Enhanced Upload Hook
 * Provides a robust file upload solution with progress tracking, error handling, and duplicate prevention
 */

import { useState, useRef, useCallback } from 'react';
import { uploadFilesAdmin, validateFile, compressImage } from '../lib/supabase-storage';

interface UploadOptions {
  bucket: string;
  pathPrefix?: string;
  maxFiles?: number;
  maxSize?: number;
  compress?: boolean;
  onProgress?: (progress: number) => void;
  onSuccess?: (urls: string[]) => void;
  onError?: (error: Error) => void;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadedUrls: string[];
}

export function useEnhancedUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    uploadedUrls: []
  });
  
  const uploadAbortController = useRef<AbortController | null>(null);
  const isUploadingRef = useRef(false);

  const uploadFiles = useCallback(async (
    files: File[], 
    options: UploadOptions
  ): Promise<string[]> => {
    // Prevent duplicate uploads
    if (isUploadingRef.current) {
      console.log('Upload already in progress, ignoring duplicate call');
      throw new Error('Upload already in progress');
    }

    // Cancel any existing upload
    if (uploadAbortController.current) {
      uploadAbortController.current.abort();
    }

    // Create new abort controller
    uploadAbortController.current = new AbortController();
    isUploadingRef.current = true;

    const {
      bucket,
      pathPrefix,
      maxFiles = 10,
      maxSize = 10 * 1024 * 1024, // 10MB
      compress = true,
      onProgress,
      onSuccess,
      onError
    } = options;

    try {
      setUploadState({
        uploading: true,
        progress: 0,
        error: null,
        uploadedUrls: []
      });

      // Validate file count
      if (files.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`);
      }

      // Validate all files
      const validationErrors: string[] = [];
      for (const file of files) {
        const validation = validateFile(file, maxSize);
        if (!validation.valid) {
          validationErrors.push(`${file.name}: ${validation.error}`);
        }
      }

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('; '));
      }

      // Process files (compress if needed)
      const processedFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          if (compress && file.type.startsWith('image/')) {
            const compressed = await compressImage(file);
            processedFiles.push(compressed);
          } else {
            processedFiles.push(file);
          }
          
          // Update progress
          const progress = ((i + 1) / files.length) * 50; // Processing is 50% of work
          setUploadState(prev => ({ ...prev, progress }));
          onProgress?.(progress);
          
        } catch (processError) {
          console.warn(`Failed to process ${file.name}:`, processError);
          processedFiles.push(file); // Use original file if processing fails
        }
      }

      // Upload files
      const urls = await uploadFilesAdmin(bucket, processedFiles, pathPrefix, false); // Already compressed
      
      // Update final progress
      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        uploadedUrls: urls
      });

      onSuccess?.(urls);
      return urls;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        uploadedUrls: []
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;

    } finally {
      isUploadingRef.current = false;
      uploadAbortController.current = null;
    }
  }, []);

  const cancelUpload = useCallback(() => {
    if (uploadAbortController.current) {
      uploadAbortController.current.abort();
      uploadAbortController.current = null;
    }
    
    isUploadingRef.current = false;
    
    setUploadState({
      uploading: false,
      progress: 0,
      error: 'Upload cancelled',
      uploadedUrls: []
    });
  }, []);

  const resetUpload = useCallback(() => {
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
      uploadedUrls: []
    });
  }, []);

  return {
    ...uploadState,
    uploadFiles,
    cancelUpload,
    resetUpload
  };
}
