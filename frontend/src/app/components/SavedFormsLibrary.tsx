'use client';

import React, { useState, useEffect } from 'react';
import { FieldConfig, FormStep } from '../types/form';
import { FilterControls, Filter, FilterOption } from './FilterControls';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';
import { Menu, Transition } from '@headlessui/react';
import { useApiRequest } from '../hooks/useApiRequest';
import { useModal } from '../hooks/useModal';
import { MenuIcons, ActionIcons, CommonIcons } from './shared/IconProvider';

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

interface SavedFormsLibraryProps {
  onLoadForm: (form: SavedForm) => void;
  onDuplicateForm?: (form: SavedForm) => void;
  onDeleteForm?: (formId: string) => void;
  onPreviewForm?: (form: SavedForm) => void;
  onStatusChange?: (formId: string, status: 'draft' | 'published' | 'archived') => void;
  onBack?: () => void;
}

export function SavedFormsLibrary({ 
  onLoadForm, 
  onDuplicateForm, 
  onDeleteForm, 
  onPreviewForm, 
  onStatusChange,
  onBack 
}: SavedFormsLibraryProps) {
  const { token } = useAuth();
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const loginModal = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string | string[]>>({ status: 'all', tags: [] });
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title' | 'submissionCount'>('updatedAt');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Check if user is logged in, show login modal if not
  useEffect(() => {
    if (!token) {
      loginModal.open();
      setLoading(false);
      return;
    }
    
    fetchForms();
  }, [token]);

  const fetchForms = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/v1/forms', { headers: { 'x-auth-token': token } });
      if (!res.ok) throw new Error('Failed to fetch forms');
      const data = await res.json();
      const parsedData = data.map((form: any): SavedForm => ({
        id: form.id,
        title: form.title,
        description: form.description,
        fields: form.structure.fields || [],
        steps: form.structure.steps || [],
        isMultiStep: form.structure.isMultiStep || false,
        createdAt: form.created_at,
        updatedAt: form.updated_at,
        status: form.status,
        submissionCount: form.submission_count || 0,
        tags: form.structure.tags || [],
        category: form.structure.category,
      }));
      setForms(parsedData);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    loginModal.close();
    // fetchForms will be called by the useEffect when token changes
  };

  // If not logged in, show login prompt
  if (!token) {
    return (
      <>
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Anmeldung erforderlich
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Um auf Ihre gespeicherten Formulare zuzugreifen, müssen Sie sich anmelden.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => loginModal.open()}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Anmelden
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                >
                  Zurück zum Builder
                </button>
              )}
            </div>
          </div>
        </div>
        <LoginModal
          isOpen={loginModal.isOpen}
          onClose={() => loginModal.close()}
          title="Anmelden um fortzufahren"
          message="Melden Sie sich an, um auf Ihre gespeicherten Formulare zuzugreifen."
        />
      </>
    );
  }

  // Filter and sort logic
  const defaultFilters = { status: 'all', tags: [] };
  const defaultSortBy = 'updatedAt';
  const isFiltered = searchTerm !== '' || sortBy !== defaultSortBy || JSON.stringify(selectedFilters) !== JSON.stringify(defaultFilters);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFilters(defaultFilters);
    setSortBy(defaultSortBy);
  };

  const allTags = [...new Set(forms.flatMap(f => f.tags || []))];
  const tagOptions: FilterOption[] = allTags.map(tag => ({ value: tag, label: tag }));

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
    { id: 'tags', label: 'Tags', type: 'pills', options: tagOptions }
  ];

  const handleFilterChange = (filterId: string, value: string | string[]) => {
    setSelectedFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value as typeof sortBy);
  };

  const filteredForms = forms.filter(form => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = form.title.toLowerCase().includes(searchLower) ||
                         (form.description || '').toLowerCase().includes(searchLower) ||
                         (form.tags || []).some(tag => tag.toLowerCase().includes(searchLower));
    
    const statusFilter = selectedFilters.status;
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    
    const tagsFilter = selectedFilters.tags as string[];
    const matchesTags = tagsFilter.length === 0 || tagsFilter.every(tag => (form.tags || []).includes(tag));

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
      case 'published': return 'Veröffentlicht';
      case 'draft': return 'Entwurf';
      case 'archived': return 'Archiviert';
      default: return status;
    }
  };

  const getNextStatusAction = (status: SavedForm['status']): { label: string; next: SavedForm['status'] } => {
    switch (status) {
      case 'draft': return { label: 'Veröffentlichen', next: 'published' };
      case 'published': return { label: 'Archivieren', next: 'archived' };
      case 'archived': return { label: 'Als Entwurf wiederherstellen', next: 'draft' };
      default: return { label: 'Veröffentlichen', next: 'published' };
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gespeicherte Formulare</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Verwalten und bearbeiten Sie Ihre gespeicherten Formulare
              </p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Zurück zum Builder
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Formulare werden geladen...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {viewMode === 'list' ? '⊞' : '☰'}
                </button>
              </div>
            </FilterControls>

            {/* Forms List/Grid */}
            {sortedForms.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isFiltered ? 'Keine Formulare gefunden' : 'Noch keine Formulare gespeichert'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {isFiltered 
                    ? 'Versuchen Sie einen anderen Suchbegriff oder ändern Sie die Filter.'
                    : 'Erstellen Sie Ihr erstes Formular mit dem Builder.'
                  }
                </p>
                {isFiltered && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {sortedForms.map((form) => (
                  <div
                    key={form.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {form.title}
                          </h3>
                          {form.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {form.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded-full ${getStatusColor(form.status)}`}>
                              {getStatusLabel(form.status)}
                            </span>
                            <span>{form.isMultiStep ? 'Mehrseitig' : 'Einseitig'}</span>
                            <span>•</span>
                            <span>{form.fields.length + (form.steps?.reduce((acc, step) => acc + step.fields.length, 0) || 0)} Felder</span>
                          </div>
                        </div>
                        
                        {/* Actions Menu */}
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </Menu.Button>
                          <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-in"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                          >
                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              {onPreviewForm && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => onPreviewForm(form)}
                                      className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 w-full text-left`}
                                    >
                                      Vorschau
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                              {onDuplicateForm && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => onDuplicateForm(form)}
                                      className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 w-full text-left`}
                                    >
                                      Duplizieren
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                              {onStatusChange && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => onStatusChange(form.id, getNextStatusAction(form.status).next)}
                                      className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 w-full text-left`}
                                    >
                                      {getNextStatusAction(form.status).label}
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                              {onDeleteForm && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => onDeleteForm(form.id)}
                                      className={`${active ? 'bg-red-100 dark:bg-red-900/30' : ''} block px-4 py-2 text-sm text-red-700 dark:text-red-300 w-full text-left`}
                                    >
                                      Löschen
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>

                      {/* Tags */}
                      {form.tags && form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {form.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                          {form.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              +{form.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>Aktualisiert: {new Date(form.updatedAt).toLocaleDateString('de-DE')}</span>
                        <span>{form.submissionCount} Einreichungen</span>
                      </div>

                      {/* Primary Action */}
                      <button
                        onClick={() => onLoadForm(form)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Bearbeiten
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 