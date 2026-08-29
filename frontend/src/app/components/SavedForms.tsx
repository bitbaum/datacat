'use client';

import React, { useState, useEffect } from 'react';
import { FieldConfig, FormStep } from '../types/form';
import { FilterControls, Filter, FilterOption } from './FilterControls';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react'; // For dropdown

export interface SavedForm {
  id: string;
  title: string;
  description?: string;
  fields: FieldConfig[];
  steps?: FormStep[];
  isMultiStep: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  submissionCount: number;
  tags: string[];
  category?: string;
}

interface SavedFormsProps {
  forms: SavedForm[]; // Add forms to props
  loading: boolean; // Add loading to props
  onLoadForm: (form: SavedForm) => void;
  onDuplicateForm: (form: SavedForm) => void;
  onDeleteForm: (formId: string) => void;
  onPreviewForm: (form: SavedForm) => void;
  onStatusChange: (formId: string, newStatus: 'draft' | 'published' | 'archived') => void;
}

export function SavedForms({
  forms,
  loading,
  onLoadForm,
  onDuplicateForm,
  onDeleteForm,
  onPreviewForm,
  onStatusChange,
}: SavedFormsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string | string[]>>({
    status: 'all',
    tags: [],
  });
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title' | 'submissionCount'>(
    'updatedAt',
  );
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const defaultFilters = { status: 'all', tags: [] };
  const defaultSortBy = 'updatedAt';

  const isFiltered =
    searchTerm !== '' ||
    sortBy !== defaultSortBy ||
    JSON.stringify(selectedFilters) !== JSON.stringify(defaultFilters);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFilters(defaultFilters);
    setSortBy(defaultSortBy);
  };

  const allTags = [...new Set(forms.flatMap((f) => f.tags || []))];
  const tagOptions: FilterOption[] = allTags.map((tag) => ({ value: tag, label: tag }));

  const statusOptions: FilterOption[] = [
    { value: 'all', label: 'Alle Status' },
    { value: 'published', label: 'Veröffentlicht' },
    { value: 'draft', label: 'Entwurf' },
    { value: 'archived', label: 'Archiviert' },
  ];

  const sortOptions: FilterOption[] = [
    { value: 'updatedAt', label: 'Zuletzt aktualisiert' },
    { value: 'createdAt', label: 'Erstelldatum' },
    { value: 'title', label: 'Titel (A-Z)' },
    { value: 'submissionCount', label: 'Einreichungen' },
  ];

  const filters: Filter[] = [
    { id: 'status', label: 'Status', options: statusOptions },
    { id: 'tags', label: 'Tags', type: 'pills', options: tagOptions },
  ];

  const handleFilterChange = (filterId: string, value: string | string[]) => {
    setSelectedFilters((prev) => ({ ...prev, [filterId]: value }));
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value as typeof sortBy);
  };

  const filteredForms = forms.filter((form) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      form.title.toLowerCase().includes(searchLower) ||
      (form.description || '').toLowerCase().includes(searchLower) ||
      (form.tags || []).some((tag) => tag.toLowerCase().includes(searchLower));

    const statusFilter = selectedFilters.status;
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;

    const tagsFilter = selectedFilters.tags as string[];
    const matchesTags =
      tagsFilter.length === 0 || tagsFilter.every((tag) => (form.tags || []).includes(tag));

    return matchesSearch && matchesStatus && matchesTags;
  });

  const sortedForms = [...filteredForms].sort((a, b) => {
    switch (sortBy) {
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'submissionCount':
        return b.submissionCount - a.submissionCount;
      case 'updatedAt':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const getStatusColor = (status: SavedForm['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: SavedForm['status']) => {
    switch (status) {
      case 'published':
        return 'Veröffentlicht';
      case 'draft':
        return 'Entwurf';
      case 'archived':
        return 'Archiviert';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(link);
    // Optional: show a toast notification that link was copied
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading saved forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gespeicherte Formulare
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verwalten Sie Ihre erstellten Formulare und deren Einreichungen
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{forms.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🚀</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Veröffentlicht</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {forms.filter((f) => f.status === 'published').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📝</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Entwürfe</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {forms.filter((f) => f.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📥</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Einreichungen</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {forms.reduce((acc, f) => acc + (f.submissionCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <FilterControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          sortByOptions={sortOptions}
          currentSortBy={sortBy}
          onSortByChange={handleSortByChange}
          isFiltered={isFiltered}
          onClearAll={clearFilters}
        >
          {/* View Mode Toggle passed as children */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              aria-label="List View"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              aria-label="Grid View"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
              </svg>
            </button>
          </div>
        </FilterControls>

        {/* Forms List/Grid */}
        {sortedForms.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6'
                : 'space-y-4 mt-6'
            }
          >
            {sortedForms.map((form) => (
              <div
                key={form.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="text-2xl hidden sm:block">
                      {form.isMultiStep ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-indigo-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h7"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-purple-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate group-hover:underline cursor-pointer"
                        onClick={() => onLoadForm(form)}
                      >
                        {form.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {form.description}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center space-x-4 mx-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
                      <span>{form.submissionCount}</span>
                      <span className="text-xs text-gray-500">Einreichungen</span>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(form.status)}`}
                    >
                      {getStatusLabel(form.status)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link href={`/submissions/${form.id}`} passHref>
                      <a className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors text-sm text-center">
                        Submissions ({form.submissionCount})
                      </a>
                    </Link>
                    <button
                      onClick={() => onLoadForm(form)}
                      className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Bearbeiten"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onPreviewForm(form)}
                      className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Vorschau"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteForm(form.id)}
                      className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Löschen"
                    >
                      <svg
                        className="w-5 h-5"
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
                    </button>
                    {form.status === 'published' && (
                      <button
                        onClick={() => handleCopyLink(form.id)}
                        className="p-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        title="Shareable link"
                      >
                        Link kopieren
                      </button>
                    )}
                    {/* Dropdown for status change */}
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            ></path>
                          </svg>
                        </Menu.Button>
                      </div>
                      <Transition as={React.Fragment}>
                        <Menu.Items className="absolute right-0 w-48 mt-2 origin-top-right bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                          <div className="px-1 py-1 ">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onStatusChange(form.id, 'published')}
                                  className={`${active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-white'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                >
                                  Als Veröffentlicht markieren
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onStatusChange(form.id, 'draft')}
                                  className={`${active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-white'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                >
                                  Als Entwurf markieren
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onStatusChange(form.id, 'archived')}
                                  className={`${active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-white'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                >
                                  Archivieren
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">
              Keine Formulare gefunden, die Ihren Kriterien entsprechen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
