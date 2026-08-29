'use client';

import React from 'react';
import { LoginForm } from './LoginForm';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function LoginModal({
  isOpen,
  onClose,
  title = 'Anmeldung erforderlich',
  message = 'Bitte melden Sie sich an, um auf diese Funktion zuzugreifen.',
}: LoginModalProps) {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose(); // Close modal on successful login
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{message}</p>
          </div>

          {/* Login form */}
          <div className="p-0">
            <LoginForm
              onSuccess={handleSuccess}
              showRegisterLink={true}
              className="max-w-none shadow-none border-0 rounded-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
