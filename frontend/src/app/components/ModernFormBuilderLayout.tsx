'use client';

// @ts-ignore – Typings for react-hot-toast available in dev deps
import { toast } from 'react-hot-toast';
import React, { useState, useCallback, useEffect } from 'react';
import { ModernSidebar } from '../components/ModernSidebar';
import { MultiStepFormBuilder } from './MultiStepFormBuilder';
import { SaveTemplateModal } from './SaveTemplateModal';
import type { TemplateData } from './TemplateLibrary';
import { TemplateLibrary } from './TemplateLibrary';
import type { SavedForm } from './SavedForms';
import { SavedForms } from './SavedForms';
import type { FieldConfig, FormData, FormTemplate, FormStep } from '../types/form';
import { useFormValidation } from '../hooks/useFormValidation';
import { useAutoSave } from '../hooks/useAutoSave';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';
import { ModernFormBuilder } from './ModernFormBuilder';
import { FormPreviewModal } from './FormPreviewModal';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import AboutPage from '../about/page';
import { useAuth } from '../context/AuthContext';
import { BuilderBottomBar } from './BuilderBottomBar';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { UnifiedFormCreationHub } from './UnifiedFormCreationHub';
import { SectionLibrary } from './SectionLibrary';
import { SavedFormsLibrary } from './SavedFormsLibrary';

interface ModernFormBuilderLayoutProps {
  initialState?: Partial<ReturnType<typeof useFormBuilderStore.getState>>;
  onSubmit: (data: FormData) => void;
  onFieldsChange: (fields: FieldConfig[]) => void;
}

export function ModernFormBuilderLayout({
  initialState,
  onSubmit,
  onFieldsChange,
}: ModernFormBuilderLayoutProps) {
  const {
    fields,
    steps,
    formData,
    isMultiStep,
    currentStep,
    setInitialState,
    setFormData,
    moveField,
    updateField,
    removeField,
    duplicateField,
    addField,
    addTemplateFields,
    loadTemplate,
  } = useFormBuilderStore();
  const { token } = useAuth();

  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>(undefined);
  const [currentView, setCurrentView] = useState<'hub' | 'builder' | 'sections' | 'templates' | 'saved-forms' | 'about'>('hub');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidthPx = sidebarCollapsed ? 64 : 384;
  const [formTitle, setFormTitle] = useState('Neues Formular');
  const [formDescription, setFormDescription] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState<TemplateData | SavedForm | null>(null);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'back'>('forward');

  useEffect(() => {
    setInitialState({
      fields: initialState?.fields || [],
      steps: initialState?.steps || [],
      isMultiStep: initialState?.isMultiStep || false,
    });
    if (initialState?.fields || initialState?.steps) {
      setHasUnsavedChanges(true);
    }
  }, [initialState, setInitialState]);

  useEffect(() => {
    const fetchForms = async () => {
      if (currentView !== 'saved-forms' || !token) {
        setFormsLoading(false);
        return;
      }
      try {
        setFormsLoading(true);
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
        setSavedForms(parsedData);
      } catch (error) {
        console.error('Error fetching forms:', error);
      } finally {
        setFormsLoading(false);
      }
    };
    fetchForms();
  }, [token, currentView]);

  const allFields = isMultiStep ? steps.flatMap(s => s.fields) : fields;
  const { hasErrors, errors } = useFormValidation(allFields);
  const { saveNow } = useAutoSave(formData, allFields);
  
  const getStepsWithErrors = useCallback((): Set<string> => {
    const stepErrorSet = new Set<string>();
    if (!hasErrors || !isMultiStep) return stepErrorSet;
    for (const step of steps) {
      for (const field of step.fields) {
        if (errors[field.name]) {
          stepErrorSet.add(step.id);
          break;
        }
      }
    }
    return stepErrorSet;
  }, [errors, steps, hasErrors, isMultiStep]);

  useEffect(() => {
    setHasUnsavedChanges(allFields.length > 0);
  }, [allFields]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(name, value);
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const flatFields = isMultiStep ? steps.flatMap(s => s.fields) : fields;
      const oldIndex = flatFields.findIndex((f) => f.id === active.id);
      const newIndex = flatFields.findIndex((f) => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveField(oldIndex, newIndex);
        setHasUnsavedChanges(true);
      }
    }
  };
  
  const handleSelectField = (fieldId?: string) => {
    if (fieldId === undefined) {
      setSelectedFieldId(undefined);
      return;
    }
    setSelectedFieldId(currentId => (currentId === fieldId ? undefined : fieldId));
  };

  const handleSaveForm = async () => {
    setShowSaveTemplateModal(true);
  };

  const doSave = async (name: string, description: string) => {
    if (!token) {
      throw new Error('Nicht angemeldet. Bitte melden Sie sich erneut an.');
    }
    const formPayload = {
      title: name,
      description: description,
      structure: { fields, steps, isMultiStep, tags: [] },
      status: 'draft',
      isTemplate: true,
    };

    const isUpdating = !!editingFormId;
    const url = isUpdating ? `/api/v1/forms/${editingFormId}` : '/api/v1/forms';
    const method = isUpdating ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(formPayload),
    });
    if (!response.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'save'} form`);
    const savedForm = await response.json();
    if (isUpdating) {
      setSavedForms(prev => prev.map(f => f.id === editingFormId ? { ...f, ...savedForm, ...savedForm.structure } : f));
    } else {
      setSavedForms(prev => [savedForm, ...prev]);
      setEditingFormId(savedForm.id);
    }
    setShowSaveTemplateModal(false);
    setHasUnsavedChanges(false);
  };

  const handleNewForm = () => {
    setInitialState({ fields: [], steps: [], isMultiStep: false });
    setFormTitle('Neues Formular');
    setFormDescription('');
    setHasUnsavedChanges(false);
    setCurrentView('builder');
    setEditingFormId(null);
    setSelectedFieldId(undefined);
  };

  const handleUseTemplate = (item: TemplateData | SavedForm) => {
    // Use addTemplateFields instead of loadTemplate so templates behave like sections
    const stepId = isMultiStep ? steps[currentStep]?.id : undefined;
    addTemplateFields(item as any, stepId);
    setCurrentView('builder');
    setHasUnsavedChanges(true);
  };

  const handleDeleteForm = async (formId: string) => {
    if (!token) { return; }
    try {
      const response = await fetch(`/api/v1/forms/${formId}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
      if (!response.ok) throw new Error('Failed to delete form');
      setSavedForms(prev => prev.filter(f => f.id !== formId));
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Formular konnte nicht gelöscht werden.');
    }
  };

  const handleDuplicateForm = async (form: SavedForm) => {
    if (!token) { return; }
    try {
      const response = await fetch('/api/v1/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          title: `${form.title} (Kopie)`,
          description: form.description,
          structure: { fields: form.fields, steps: form.steps, isMultiStep: form.isMultiStep, tags: form.tags },
          status: 'draft',
          isTemplate: true,
        }),
      });
      if (!response.ok) throw new Error('Failed to duplicate form');
      const duplicated = await response.json();
      setSavedForms(prev => [duplicated, ...prev]);
      toast.success('Formular dupliziert.');
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Formular konnte nicht dupliziert werden.');
    }
  };

  const handleStatusChange = async (formId: string, newStatus: 'draft' | 'published' | 'archived') => {
    if (!token) { return; }
    try {
      const response = await fetch(`/api/v1/forms/${formId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      setSavedForms(prev => prev.map(f => (f.id === formId ? { ...f, status: newStatus } : f)));
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Status konnte nicht aktualisiert werden.');
    }
  };

  // Handlers for sidebar communication with smooth transitions
  const handleShowTemplateLibrary = () => {
    setIsTransitioning(true);
    setNavigationDirection('forward');
    setTimeout(() => {
      setCurrentView('templates');
      setIsTransitioning(false);
    }, 150);
  };

  const handleBackToBuilder = () => {
    setIsTransitioning(true);
    setNavigationDirection('back');
    setTimeout(() => {
      setCurrentView('builder');
      setIsTransitioning(false);
    }, 150);
  };

  const handleShowHub = () => {
    setIsTransitioning(true);
    setNavigationDirection('back');
    setTimeout(() => {
      setCurrentView('hub');
      setIsTransitioning(false);
    }, 150);
  };

  const handleShowSectionLibrary = () => {
    setIsTransitioning(true);
    setNavigationDirection('forward');
    setTimeout(() => {
      setCurrentView('sections');
      setIsTransitioning(false);
    }, 150);
  };

  const handleShowSavedFormsLibrary = () => {
    setIsTransitioning(true);
    setNavigationDirection('forward');
    setTimeout(() => {
      setCurrentView('saved-forms');
      setIsTransitioning(false);
    }, 150);
  };

  const handleMethodSelect = (method: 'fields' | 'sections' | 'templates' | 'saved-forms' | 'upload') => {
    setIsTransitioning(true);
    setNavigationDirection('forward');
    
    setTimeout(() => {
      switch (method) {
        case 'fields':
        case 'upload':
          setCurrentView('builder');
          break;
        case 'sections':
          setCurrentView('sections');
          break;
        case 'templates':
          setCurrentView('templates');
          break;
        case 'saved-forms':
          setCurrentView('saved-forms');
          break;
      }
      setIsTransitioning(false);
    }, 150);
  };

  const getBreadcrumbItems = () => {
    const items = [
      {
        label: 'Formular Hub',
        onClick: currentView !== 'hub' ? handleShowHub : undefined,
        isActive: currentView === 'hub',
      },
    ];

    // Add builder if we're not on hub
    if (currentView !== 'hub') {
      items.push({
        label: 'Formular Builder',
        onClick: currentView !== 'builder' ? handleBackToBuilder : undefined,
        isActive: currentView === 'builder',
      });
    }

    switch (currentView) {
      case 'sections':
        items.push({
          label: 'Sektionen-Bibliothek',
          onClick: undefined,
          isActive: true,
        });
        break;
      case 'templates':
        items.push({
          label: 'Vorlagen-Bibliothek',
          onClick: undefined,
          isActive: true,
        });
        break;
      case 'saved-forms':
        items.push({
          label: 'Gespeicherte Formulare',
          onClick: undefined,
          isActive: true,
        });
        break;
      case 'about':
        items.push({
          label: 'Über',
          onClick: undefined,
          isActive: true,
        });
        break;
    }

    return items;
  };

  const handleShowSavedForms = () => {
    if (!token) {
      alert('Bitte melden Sie sich an, um auf Ihre gespeicherten Vorlagen zuzugreifen.');
      return;
    }
    setCurrentView('saved-forms');
  };

  const renderContent = () => {
    const builderProps = {
      formData,
      onFieldChange: handleInputChange,
      onUpdateField: (id: string, updates: Partial<FieldConfig>) => {
        updateField(id, updates);
        setHasUnsavedChanges(true);
      },
      onRemoveField: (id: string) => {
        if (id === selectedFieldId) setSelectedFieldId(undefined);
        removeField(id);
        setHasUnsavedChanges(true);
      },
      onDuplicateField: (id: string) => {
        duplicateField(id);
        setHasUnsavedChanges(true);
      },
      onSelectField: handleSelectField,
      selectedFieldId,
      errors,
    };
    
    switch (currentView) {
      case 'hub':
        return (
          <UnifiedFormCreationHub
            onMethodSelect={handleMethodSelect}
            onShowSectionLibrary={handleShowSectionLibrary}
            onShowTemplateLibrary={handleShowTemplateLibrary}
            onShowSavedForms={handleShowSavedFormsLibrary}
          />
        );
      case 'sections':
        return (
          <SectionLibrary
            onUseSection={(section) => {
              // Use the same function as the hub and sidebar
              const stepId = isMultiStep ? steps[currentStep]?.id : undefined;
              addTemplateFields(section, stepId);
              setCurrentView('builder');
              setHasUnsavedChanges(true);
            }}
            onBack={handleBackToBuilder}
          />
        );
      case 'templates':
        return <TemplateLibrary onUseTemplate={handleUseTemplate} onPreviewTemplate={setSelectedTemplatePreview} onBack={handleBackToBuilder} />;
      case 'saved-forms':
        return (
          <SavedFormsLibrary
            onLoadForm={handleUseTemplate}
            onDuplicateForm={handleDuplicateForm}
            onDeleteForm={handleDeleteForm}
            onPreviewForm={setSelectedTemplatePreview}
            onStatusChange={handleStatusChange}
            onBack={handleBackToBuilder}
          />
        );
      case 'about':
        return <AboutPage />;
      case 'builder':
      default:
        return isMultiStep ? (
          <MultiStepFormBuilder {...builderProps} steps={steps} stepsWithErrors={getStepsWithErrors()} />
        ) : (
          <div className="max-w-4xl mx-auto">
            <ModernFormBuilder {...builderProps} fields={fields} />
          </div>
        );
    }
  };

  const getPreviewTemplate = (): FormTemplate | null => {
    if (selectedTemplatePreview) {
        const isSavedForm = 'title' in selectedTemplatePreview;
        return {
            id: selectedTemplatePreview.id,
            name: isSavedForm ? selectedTemplatePreview.title : selectedTemplatePreview.name,
            description: selectedTemplatePreview.description || '',
            fields: (selectedTemplatePreview.fields || []).map((field: any) => 
                field.id ? field : { ...field, id: `field_${Date.now()}_${Math.random()}` }
            ),
            steps: selectedTemplatePreview.steps || [],
            isMultiStep: selectedTemplatePreview.isMultiStep || false,
        };
    }
    return null;
  };
  
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
        <ModernSidebar
            onSaveForm={handleSaveForm}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            selectedFieldId={selectedFieldId}
            onFieldSelect={handleSelectField}
            onFieldUpdate={(id, updates) => {
                updateField(id, updates);
                setHasUnsavedChanges(true);
            }}
            onShowTemplateLibrary={handleShowTemplateLibrary}
            onShowSavedForms={handleShowSavedForms}
            currentView={currentView}
            onBackToBuilder={handleBackToBuilder}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 relative">
            <div className="max-w-4xl mx-auto">
              <BreadcrumbNavigation items={getBreadcrumbItems()} />
            </div>
            
            {/* Main Content with Smooth Transitions */}
            <div className={`transition-all duration-300 ease-in-out ${
              isTransitioning ? 
                navigationDirection === 'forward' ? 
                  'opacity-0 transform translate-x-8' : 
                  'opacity-0 transform -translate-x-8'
                : 'opacity-100 transform translate-x-0'
            }`}>
              {currentView === 'builder' && (
                <div className="max-w-4xl mx-auto mb-8">
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Formular-Titel"
                    className="w-full text-3xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none dark:text-white transition-colors duration-200"
                  />
                </div>
              )}
              {renderContent()}
            </div>
            
            {/* Loading overlay during transitions */}
            {isTransitioning && (
              <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-blue-600"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {navigationDirection === 'forward' ? 'Navigiere...' : 'Zurück...'}
                  </span>
                </div>
              </div>
            )}
          </main>
          {currentView === 'builder' && (
            <BuilderBottomBar
              title={formTitle}
              onTitleChange={setFormTitle}
              onSave={handleSaveForm}
              onPreview={() => setShowPreviewModal(true)}
              onNew={handleNewForm}
              hasUnsavedChanges={hasUnsavedChanges}
              sidebarWidth={sidebarWidthPx}
            />
          )}
        </div>

        {showSaveTemplateModal && (
          <SaveTemplateModal
            isOpen={showSaveTemplateModal}
            fields={fields}
            onSave={doSave}
            onClose={() => setShowSaveTemplateModal(false)}
            initialName={formTitle}
            initialDescription={formDescription}
          />
        )}
        {showPreviewModal && (
          <FormPreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            form={{
              title: formTitle,
              description: formDescription,
              fields: isMultiStep ? steps.flatMap(s => s.fields) : fields
            }}
          />
        )}
        {selectedTemplatePreview && (
          <TemplatePreviewModal
            template={getPreviewTemplate()}
            isOpen={!!selectedTemplatePreview}
            onClose={() => setSelectedTemplatePreview(null)}
          />
        )}
      </div>
    </DndContext>
  );
}