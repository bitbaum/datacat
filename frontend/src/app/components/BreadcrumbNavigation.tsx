'use client';

import React from 'react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbNavigation({ items }: BreadcrumbNavigationProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4 animate-in fade-in duration-300">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg
              className="w-4 h-4 text-gray-300 dark:text-gray-600 transition-colors duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className={`relative px-2 py-1 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105 active:scale-95 ${
                item.isActive
                  ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800'
                  : 'hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {item.label}
              {!item.isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 scale-x-0 transition-transform duration-200 group-hover:scale-x-100"></span>
              )}
            </button>
          ) : (
            <span
              className={`px-2 py-1 rounded-md transition-all duration-200 ${
                item.isActive
                  ? 'text-gray-900 dark:text-white font-medium bg-blue-50 dark:bg-blue-900/30 shadow-sm'
                  : ''
              }`}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}

      <style jsx>{`
        .animate-in {
          animation-fill-mode: both;
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
}
