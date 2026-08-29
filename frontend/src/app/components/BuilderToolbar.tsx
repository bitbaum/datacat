// created_date: 2025-07-09
// last_modified_date: 2025-07-09
// last_modified_summary: "Neue BuilderToolbar für formularspezifische Aktionen (Speichern, Vorschau, Neu) eingeführt."

'use client';

// @ts-ignore – Typings werden in DevDependencies bereitgestellt, aber der Linter findet sie evtl. nicht zur Build-Zeit
import { toast, Toaster } from 'react-hot-toast';
import React, { useEffect, useState } from 'react';

interface BuilderToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onPreview: () => void;
  onNew: () => void;
  hasUnsavedChanges: boolean;
  sidebarWidth?: number; // Width of the sidebar in px so the toolbar can align correctly
}

export function BuilderToolbar({
  title,
  onTitleChange,
  onSave,
  onPreview,
  onNew,
  hasUnsavedChanges,
  sidebarWidth = 384, // default 96 w-96 => 24rem
}: BuilderToolbarProps) {
  const [shrink, setShrink] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const shouldShrink = window.scrollY > 80;
      if (shouldShrink !== shrink) {
        setShrink(shouldShrink);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shrink]);

  return (
    <div
      className={`sticky z-30 top-16 border-b bg-white/80 backdrop-blur dark:bg-gray-900/80 shadow-sm transition-all duration-300 ${
        shrink ? 'py-1' : 'py-3'
      }`}
      style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)` }}
    >
      <div className="flex items-center gap-2 px-4">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Formular-Titel"
          className={`mr-4 rounded-md border p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white transition-all duration-300 ${
            shrink ? 'w-40 md:w-56' : 'w-56 md:w-64 lg:w-80 xl:w-96'
          }`}
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
          className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          Vorschau
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Neu
        </button>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
