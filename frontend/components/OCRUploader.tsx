'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { DocumentTextIcon, ArrowUpTrayIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface OCRUploaderProps {
  onOCRComplete: (ocrData: any) => void;
}

export default function OCRUploader({ onOCRComplete }: OCRUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('rirekisho');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const fileType = selectedFile.type;
    if (!fileType.match(/image\/(jpeg|jpg|png)|application\/pdf/)) {
      toast.error('ファイル形式が無効です。JPG、PNG、またはPDF形式のファイルをアップロードしてください。');
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('ファイルサイズが大きすぎます。5MB以下のファイルをアップロードしてください。');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (fileType.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('ファイルを選択してください。');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate upload progress
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const nextProgress = prev + 10;
          if (nextProgress >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return 90;
          }
          return nextProgress;
        });
      }, 300);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/candidates/ocr/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'OCR処理に失敗しました。');
      }

      const data = await response.json();
      toast.success('OCR処理が完了しました。');

      // Pass OCR results to parent component
      if (data.success && data.data) {
        onOCRComplete(data.data);
      }
    } catch (error: any) {
      if (progressInterval) clearInterval(progressInterval);
      toast.error(`OCR処理エラー: ${error.message}`);
      console.error('OCR processing error:', error);
    } finally {
      setIsUploading(false);
      // Keep progress at 100% for a moment, then reset
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">OCRドキュメントアップロード</h3>

      <div className="mb-4">
        <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">
          ドキュメントタイプ
        </label>
        <select
          id="document-type"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="rirekisho">履歴書 (Rirekisho)</option>
          <option value="zairyu_card">在留カード (Zairyu Card)</option>
          <option value="license">運転免許証 (Driver's License)</option>
        </select>
      </div>

      {!file ? (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
              >
                <span>ファイルを選択</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              <p className="pl-1">またはドラッグ＆ドロップ</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, PDFファイル（最大5MB）</p>
          </div>
        </div>
      ) : (
        <div className="mt-1 flex flex-col items-center p-4 border border-gray-300 rounded-md">
          <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="text-sm text-gray-900">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-red-500 hover:text-red-700"
              disabled={isUploading}
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>

          {previewUrl && (
            <div className="mt-2 mb-4 max-w-xs max-h-40 overflow-hidden">
              <Image
                src={previewUrl}
                alt="Preview"
                width={400}
                height={300}
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {uploadProgress > 0 && (
            <div className="w-full mt-2">
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${uploadProgress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
                  ></div>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs font-semibold inline-block text-indigo-600">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`
            inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${!file || isUploading
              ? 'bg-indigo-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }
          `}
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              処理中...
            </>
          ) : (
            <>
              <ArrowUpTrayIcon className="-ml-1 mr-2 h-4 w-4" />
              アップロードとOCR処理
            </>
          )}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <span className="inline-flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
            ドキュメントをアップロードすると、OCRが自動的に情報を抽出します。
          </span>
        </p>
      </div>
    </div>
  );
}
