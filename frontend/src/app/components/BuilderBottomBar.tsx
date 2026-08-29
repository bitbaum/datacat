// created_date: 2025-07-09
// last_modified_date: 2025-07-09
// last_modified_summary: "Neue BuilderBottomBar als Sticky Bottom Aktionsleiste erstellt."

'use client';

import React from 'react';
// @ts-ignore – Typings for react-hot-toast available in dev deps
import { toast, Toaster } from 'react-hot-toast';

interface BuilderBottomBarProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onPreview: () => void;
  onNew: () => void;
  hasUnsavedChanges: boolean;
  sidebarWidth?: number; // px offset for left sidebar
}

export function BuilderBottomBar({
  title,
  onTitleChange,
  onSave,
  onPreview,
  onNew,
  hasUnsavedChanges,
  sidebarWidth = 384,
}: BuilderBottomBarProps) {
  return (
    <div
      className="fixed bottom-0 z-30 bg-white/90 backdrop-blur dark:bg-gray-900/90 border-t shadow-inner transition-all"
      style={{ left: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)` }}
    >
      <div className="flex items-center gap-2 px-4 py-2">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Formular-Titel"
          className="sr-only"
        />
        <button
          onClick={() => {
            onSave();
            toast.success('Formular gespeichert! Du findest es unter "Forms".');
          }}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Speichern
          {hasUnsavedChanges && <span className="ml-2 h-2 w-2 rounded-full bg-green-400" />}
        </button>
        <button
          onClick={onPreview}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Vorschau
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          + Neu
        </button>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
