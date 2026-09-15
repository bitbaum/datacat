'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { formatFileSize } from '@/lib/format';
import { ICON, OutlineIcon, SpinnerIcon } from './icons';

/**
 * What the Image / Video / Audio ingestion components have in common: the
 * backend URL and auth header, the `{ data }` envelope their routes answer
 * with, the upload state machine, the object-URL preview of a picked file,
 * and the card / banner / progress / button / result chrome around it.
 */

/** Base URL of the Express backend the ingestion routes live on. */
export const INGEST_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export type UploadState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export function authHeaders(token?: string | null): Record<string, string> | undefined {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

/** Unwraps the backend's `{ data }` envelope; on a non-2xx throws its `error`. */
export async function readIngestionResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Upload failed');
  }
  const data = await response.json();
  return data.data as T;
}

interface UploadCallbacks<T> {
  onUploadComplete?: (result: T) => void;
  onError?: (error: string) => void;
}

/** idle → uploading → processing → complete | error, plus the result and message. */
export function useIngestionUpload<T>({ onUploadComplete, onError }: UploadCallbacks<T>) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => {
    setUploadState('uploading');
    setUploadProgress(0);
    setError(null);
  }, []);

  const succeed = useCallback(
    (data: T) => {
      setUploadProgress(100);
      setUploadState('complete');
      setResult(data);
      onUploadComplete?.(data);
    },
    [onUploadComplete],
  );

  const fail = useCallback(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setUploadState('error');
      onError?.(message);
    },
    [onError],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setUploadState('idle');
  }, []);

  return {
    uploadState,
    setUploadState,
    uploadProgress,
    setUploadProgress,
    result,
    error,
    setError,
    busy: uploadState === 'uploading' || uploadState === 'processing',
    start,
    succeed,
    fail,
    reset,
  };
}

interface FilePreviewOptions {
  accept: (file: File) => boolean;
  rejectMessage: string;
  /** Runs whenever the selection changes (a new file, or cleared). */
  onChange: () => void;
  onReject: (message: string) => void;
}

/** A picked file and its object-URL preview, released when replaced or unmounted. */
export function useFilePreview({ accept, rejectMessage, onChange, onReject }: FilePreviewOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const select = useCallback(
    (file: File) => {
      setSelectedFile(file);
      onChange();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl, onChange],
  );

  const clear = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    onChange();
  }, [previewUrl, onChange]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        select(file);
      }
    },
    [select],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && accept(file)) {
        select(file);
      } else {
        onReject(rejectMessage);
      }
    },
    [select, accept, onReject, rejectMessage],
  );

  return { selectedFile, previewUrl, select, clear, handleFileChange, handleDrop };
}

export function IngestionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <OutlineIcon d={icon} className="w-6 h-6 text-indigo-600" />
        {title}
      </h2>
      {children}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
      <p className="flex items-center gap-2">
        <OutlineIcon d={ICON.exclamation} className="w-5 h-5" />
        {message}
      </p>
    </div>
  );
}

export function ProgressBar({
  label,
  progress,
  transition = 'duration-300',
  children,
}: {
  label: string;
  progress: number;
  transition?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-indigo-600 transition-all ${transition}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {children}
    </div>
  );
}

export function SubmitButton({
  busy,
  busyLabel,
  label,
  icon,
  onClick,
  className = 'flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors',
}: {
  busy: boolean;
  busyLabel: string;
  label: string;
  icon: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button onClick={onClick} disabled={busy} className={className}>
      {busy ? (
        <>
          <SpinnerIcon className="w-5 h-5 animate-spin" />
          {busyLabel}
        </>
      ) : (
        <>
          <OutlineIcon d={icon} className="w-5 h-5" />
          {label}
        </>
      )}
    </button>
  );
}

export function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-green-200 bg-green-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
        <OutlineIcon d={ICON.check} className="w-5 h-5" />
        {title}
      </h3>
      {children}
    </div>
  );
}

/** One label/value tile in a result's metadata grid. */
export function MetaTile({
  label,
  center = false,
  valueClassName = '',
  children,
}: {
  label: string;
  center?: boolean;
  valueClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white p-3 rounded-lg${center ? ' text-center' : ''}`}>
      <p className="text-gray-500">{label}</p>
      <p className={`font-semibold text-gray-800${valueClassName ? ` ${valueClassName}` : ''}`}>
        {children}
      </p>
    </div>
  );
}

/** Name and size of the picked file, with the action button beside it. */
export function SelectedFileRow({
  file,
  children,
}: {
  file: File | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-gray-600">
        <p className="font-medium">{file?.name}</p>
        <p>{formatFileSize(file?.size || 0)}</p>
      </div>
      {children}
    </div>
  );
}

/** The red X over a preview that discards the selection. */
export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
    >
      <OutlineIcon d={ICON.close} className="w-5 h-5" />
    </button>
  );
}

export function DropZone({
  onDrop,
  onOpen,
  children,
}: {
  onDrop: (e: React.DragEvent) => void;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onOpen}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
    >
      {children}
    </div>
  );
}
