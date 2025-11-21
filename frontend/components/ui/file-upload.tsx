'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formAnimations } from '@/lib/form-animations';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  showPreview?: boolean;
  animated?: boolean;
  mode?: 'compact' | 'expanded';
  onUpload?: (files: File[]) => void | Promise<void>;
  onRemove?: (index: number) => void;
  value?: File[];
  className?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      label,
      accept = '*/*',
      maxSize = 5 * 1024 * 1024, // 5MB default
      maxFiles = 5,
      multiple = true,
      disabled = false,
      error,
      hint,
      showPreview = true,
      animated = true,
      mode = 'expanded',
      onUpload,
      onRemove,
      value,
      className,
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const isImage = (file: File) => file.type.startsWith('image/');

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const validateFile = (file: File): string | null => {
      if (file.size > maxSize) {
        return `ファイルサイズが大きすぎます (最大: ${formatFileSize(maxSize)})`;
      }

      if (accept !== '*/*') {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const fileExtension = `.${file.name.split('.').pop()}`;
        const mimeType = file.type;

        const isAccepted = acceptedTypes.some(
          (type) =>
            type === fileExtension || type === mimeType || type === '*/*'
        );

        if (!isAccepted) {
          return `このファイル形式は許可されていません`;
        }
      }

      return null;
    };

    const simulateUpload = async (file: File, index: number) => {
      // Simulate upload progress
      // Simulación de progreso desactivada para evitar bucle infinito
      if (process.env.NODE_ENV === 'development') {
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          setUploadedFiles((prev) =>
            prev.map((f, i) =>
              i === index ? { ...f, progress } : f
            )
          );
        }
      }

      // Mark as success
      setUploadedFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'success' } : f
        )
      );
    };

    const handleFiles = async (files: FileList | null) => {
      if (!files || disabled) return;

      const fileArray = Array.from(files);

      // Check max files limit
      if (uploadedFiles.length + fileArray.length > maxFiles) {
        // Could show error toast here
        return;
      }

      // Validate and prepare files
      const newFiles: UploadedFile[] = [];
      for (const file of fileArray) {
        const validationError = validateFile(file);

        const uploadedFile: UploadedFile = {
          file,
          preview: isImage(file) ? URL.createObjectURL(file) : undefined,
          progress: 0,
          status: validationError ? 'error' : 'uploading',
          error: validationError || undefined,
        };

        newFiles.push(uploadedFile);
      }

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Start upload simulation for valid files
      const validFiles = newFiles.filter((f) => f.status === 'uploading');
      if (validFiles.length > 0) {
        onUpload?.(validFiles.map((f) => f.file));

        // Simulate upload for each file
        validFiles.forEach((_, index) => {
          simulateUpload(
            validFiles[index].file,
            uploadedFiles.length + index
          );
        });
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    };

    const handleClick = () => {
      if (!disabled) {
        fileInputRef.current?.click();
      }
    };

    const handleRemove = (index: number) => {
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
      onRemove?.(index);
    };

    // Cleanup preview URLs
    React.useEffect(() => {
      return () => {
        uploadedFiles.forEach((file) => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      };
    }, [uploadedFiles]);

    const isCompact = mode === 'compact';

    return (
      <div ref={ref} className={cn('w-full space-y-2', className)}>
        {/* Label */}
        {label && (
          <label
            className={cn(
              'block text-sm font-medium',
              error ? 'text-red-600' : 'text-foreground',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        {/* Drop Zone */}
        <motion.div
          className={cn(
            'relative border-2 border-dashed rounded-lg transition-all duration-200',
            'cursor-pointer overflow-hidden',
            isDragging &&
              !disabled &&
              'border-indigo-500 bg-indigo-50/50',
            !isDragging && !error && 'border-gray-300 hover:border-gray-400',
            error && 'border-red-500 bg-red-50/50',
            disabled && 'opacity-50 cursor-not-allowed',
            isCompact ? 'p-4' : 'p-8'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          animate={error && animated ? 'animate' : 'initial'}
          variants={error && animated ? formAnimations.shake : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div
            className={cn(
              'flex flex-col items-center justify-center gap-2 text-center',
              isCompact && 'flex-row gap-3'
            )}
          >
            <motion.div
              animate={
                isDragging && animated
                  ? { y: [0, -10, 0], scale: [1, 1.1, 1] }
                  : {}
              }
              transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
            >
              <CloudArrowUpIcon
                className={cn(
                  'text-gray-400',
                  isCompact ? 'w-6 h-6' : 'w-12 h-12'
                )}
              />
            </motion.div>

            <div className={cn(isCompact && 'text-left')}>
              <p
                className={cn(
                  'font-medium text-gray-700',
                  isCompact ? 'text-sm' : 'text-base'
                )}
              >
                {isDragging
                  ? 'ここにドロップ'
                  : 'ファイルをドロップまたはクリック'}
              </p>
              {!isCompact && (
                <p className="text-xs text-muted-foreground mt-1">
                  最大 {formatFileSize(maxSize)} · {maxFiles} ファイルまで
                </p>
              )}
            </div>
          </div>

          {/* Drag Overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                className="absolute inset-0 bg-indigo-500/10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Uploaded Files List */}
        <AnimatePresence mode="popLayout">
          {uploadedFiles.length > 0 && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {uploadedFiles.map((uploadedFile, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border bg-white',
                    uploadedFile.status === 'error' && 'border-red-200 bg-red-50',
                    uploadedFile.status === 'success' &&
                      'border-green-200 bg-green-50'
                  )}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                >
                  {/* Preview / Icon */}
                  {showPreview && uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : isImage(uploadedFile.file) ? (
                    <PhotoIcon className="w-10 h-10 text-gray-400" />
                  ) : (
                    <DocumentIcon className="w-10 h-10 text-gray-400" />
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>

                    {/* Progress Bar */}
                    {uploadedFile.status === 'uploading' && (
                      <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadedFile.progress}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    )}

                    {/* Error Message */}
                    {uploadedFile.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {uploadedFile.error}
                      </p>
                    )}
                  </div>

                  {/* Status Icon */}
                  {uploadedFile.status === 'success' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    </motion.div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint Text */}
        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="text-xs text-red-600 flex items-center gap-1"
              variants={formAnimations.slideDown}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export { FileUpload };
