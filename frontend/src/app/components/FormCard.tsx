import React from 'react';

interface FormCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormCard({ title, description, children, className = '' }: FormCardProps) {
  return (
    <div
      className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 dark:border-gray-700/30 ${className} animate-fade-in`}
    >
      <div className="px-8 py-10 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">{description}</p>
        )}
      </div>
      <div className="px-8 py-10">{children}</div>
    </div>
  );
}
