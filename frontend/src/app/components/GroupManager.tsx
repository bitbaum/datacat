'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { FormField } from './FormField';

interface GroupManagerProps {
  availableGroups: string[];
  onCreateGroup: (groupName: string) => void;
  onDeleteGroup: (groupName: string) => void;
  className?: string;
}

export function GroupManager({
  availableGroups,
  onCreateGroup,
  onDeleteGroup,
  className = '',
}: GroupManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleCreateGroup = () => {
    if (newGroupName.trim() && !availableGroups.includes(newGroupName.trim())) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName('');
      setIsOpen(false);
    }
  };

  const handleDeleteGroup = (groupName: string) => {
    onDeleteGroup(groupName);
    setShowDeleteConfirm(null);
  };

  const defaultGroups = ['Allgemeine Felder'];
  const customGroups = availableGroups.filter((group) => !defaultGroups.includes(group));

  return (
    <div className={`relative ${className}`}>
      <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        Gruppen verwalten
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl p-6 z-20 animate-fade-in">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Feldgruppen verwalten
            </h3>

            {/* Create new group */}
            <div className="space-y-3">
              <FormField
                type="text"
                id="newGroupName"
                name="newGroupName"
                label="Neue Gruppe erstellen"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Gruppenname eingeben..."
              />
              <Button
                type="button"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || availableGroups.includes(newGroupName.trim())}
                size="sm"
                className="w-full"
              >
                Gruppe erstellen
              </Button>
            </div>

            {/* Existing groups */}
            {customGroups.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bestehende Gruppen
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customGroups.map((group) => (
                    <div
                      key={group}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-sm text-gray-900 dark:text-white truncate">
                        {group}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(group)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Gruppe löschen"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                            clipRule="evenodd"
                          />
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Schließen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gruppe löschen</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Sind Sie sicher, dass Sie die Gruppe &quot;{showDeleteConfirm}&quot; löschen
                möchten? Die Felder werden zur Gruppe &quot;Allgemeine Felder&quot; verschoben.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={() => handleDeleteGroup(showDeleteConfirm)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  Löschen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
