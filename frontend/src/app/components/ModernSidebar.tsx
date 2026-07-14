'use client';

import React, { useState } from 'react';
import { FieldConfig, FormStep, FieldTemplate } from '../types/form';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fieldTemplates } from '../data/fieldTemplates';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';
import { FieldEditor } from './FieldEditor';
import { PencilSquareIcon, TrashIcon, SquaresPlusIcon, Squares2X2Icon, CameraIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { ConfirmDialog } from './ConfirmDialog';
import { microTemplates, formTemplates, allTemplates } from '../data/templates';
import { visionService, VisionAnalysisProgress } from '../services/visionService';
import { useAuth } from '../context/AuthContext';

interface FieldTypeOption {
  type: FieldConfig['type'];
  label: string;
  icon: string;
}

interface ModernSidebarProps {
  onSaveForm: () => void; // Rename prop in interface
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedFieldId?: string;
  onFieldSelect: (fieldId: string | undefined) => void;
  onFieldUpdate: (fieldId: string, updates: Partial<FieldConfig>) => void;
  onShowTemplateLibrary?: () => void; // New prop for showing template library in main area
  onShowSavedForms?: () => void; // New prop for showing saved forms in main area
  currentView?: 'hub' | 'builder' | 'sections' | 'templates' | 'saved-forms' | 'about'; // Current view state
  onBackToBuilder?: () => void; // Function to navigate back to builder
}

// Sortable wrapper for sidebar field item
interface SortableSidebarItemProps {
  field: FieldConfig;
  selectedFieldId?: string;
  onFieldSelect: (id: string) => void;
  onFieldDuplicate: (id: string, stepId?: string) => void;
  onFieldDelete: (id: string, stepId?: string) => void;
  getFieldIcon: (type: FieldConfig['type']) => string;
}

function SortableSidebarItem({ 
  field, 
  selectedFieldId, 
  onFieldSelect, 
  onFieldDuplicate, 
  onFieldDelete, 
  getFieldIcon 
}: SortableSidebarItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}
      className={`p-3 rounded-lg border transition-all duration-200 group ${
        selectedFieldId === field.id
          ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-400 dark:border-blue-600'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
      onClick={() => onFieldSelect(field.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0" {...attributes} {...listeners}>
          <div className="text-lg mr-3 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing">⠿</div>
          <div className="text-lg mr-2">{getFieldIcon(field.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{field.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              {field.type}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFieldDuplicate(field.id, field.stepId);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            title="Duplizieren"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFieldDelete(field.id, field.stepId);
            }}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="Löschen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


export function ModernSidebar({
  onSaveForm, // Use new prop name
  collapsed,
  onToggleCollapse,
  selectedFieldId,
  onFieldSelect,
  onFieldUpdate,
  onShowTemplateLibrary, // Pass new prop
  onShowSavedForms, // Pass new prop
  currentView = 'builder',
  onBackToBuilder,
}: ModernSidebarProps) {
  const { token } = useAuth(); // Add auth context
  const {
    fields,
    steps,
    isMultiStep,
    currentStep,
    addField,
    duplicateField,
    removeField,
    moveField,
    addTemplateFields,
    clearAllFields,
    toggleMultiStep,
    addStep,
    updateStep,
    removeStep,
    reorderStep,
    setCurrentStep,
  } = useFormBuilderStore();

  const [activeTab, setActiveTab] = useState<'structure' | 'add' | 'templates'>('structure');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [tempStepTitle, setTempStepTitle] = useState<string>('');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  
  // Vision upload state
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<VisionAnalysisProgress | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const allFields = isMultiStep ? steps.flatMap(s => s.fields) : fields;

  const fieldTypes: FieldTypeOption[] = [
    { type: 'text', label: 'Text', icon: '📝' },
    { type: 'email', label: 'E-Mail', icon: '📧' },
    { type: 'tel', label: 'Telefon', icon: '📞' },
    { type: 'date', label: 'Datum', icon: '📅' },
    { type: 'select', label: 'Auswahl', icon: '📋' },
    { type: 'textarea', label: 'Textbereich', icon: '📄' }
  ];

  const getFieldIcon = (type: FieldConfig['type']) => {
    return fieldTypes.find(f => f.type === type)?.icon || '❓';
  };
  
  const handleQuickAdd = (type: FieldConfig['type']) => {
    const stepId = isMultiStep ? steps[currentStep]?.id : undefined;
    if (isMultiStep && !stepId) {
      console.error("Cannot add field, no step selected.");
      return;
    }
    addField(type, stepId);
  };
  
  const handleAddTemplate = (template: FieldTemplate) => {
    const stepId = isMultiStep ? steps[currentStep]?.id : undefined;
    if (isMultiStep && !stepId) {
      console.error("Cannot add template, no step selected.");
      return;
    }
    addTemplateFields(template, stepId);
  };



  // Handle vision upload
  const handleVisionUpload = async (file: File) => {
    const validation = visionService.isValidFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsProcessing(true);
    setAnalysisProgress(null);

    try {
      const result = file.type === 'application/pdf' 
        ? await visionService.analyzePDF(file, setAnalysisProgress)
        : await visionService.analyzeImage(file, setAnalysisProgress);

      if (result.success) {
        const stepId = isMultiStep ? steps[currentStep]?.id : undefined;
        
        // Add analyzed fields to the form
        result.fields.forEach(fieldConfig => {
          addField(fieldConfig.type, stepId);
          // Update the newly added field with the analyzed configuration
          const currentFields = isMultiStep ? steps[currentStep]?.fields || [] : fields;
          const newField = currentFields[currentFields.length - 1];
          if (newField) {
            Object.assign(newField, {
              label: fieldConfig.label,
              name: fieldConfig.name,
              required: fieldConfig.required,
              placeholder: fieldConfig.placeholder,
              options: fieldConfig.options
            });
          }
        });

        // Switch to structure tab to show results
        setActiveTab('structure');
      } else {
        alert(`Analyse fehlgeschlagen: ${result.error}`);
      }
    } catch (error) {
      alert('Fehler beim Analysieren der Datei');
    } finally {
      setIsProcessing(false);
      setAnalysisProgress(null);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleVisionUpload(file);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleVisionUpload(file);
    }
  };
  
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 1) Handle step reordering when both active & over are step IDs
    const activeStepIndex = steps.findIndex((s) => s.id === active.id);
    const overStepIndex   = steps.findIndex((s) => s.id === over.id);

    if (activeStepIndex !== -1 && overStepIndex !== -1) {
      // Dragging a whole step container
      reorderStep(activeStepIndex, overStepIndex);
      return;
    }

    // 2) Handle field movement across (or within) steps
    const allFields = isMultiStep ? steps.flatMap((s) => s.fields) : fields;
    const activeFieldIndex = allFields.findIndex((f) => f.id === active.id);
    const overFieldIndex   = allFields.findIndex((f) => f.id === over.id);

    if (activeFieldIndex !== -1 && overFieldIndex !== -1) {
      moveField(activeFieldIndex, overFieldIndex);
    }
  };

  const handleEditStepTitle = (step: FormStep) => {
    setEditingStepId(step.id);
    setTempStepTitle(step.title);
  };

  const handleSaveStepTitle = (stepId: string) => {
    updateStep(stepId, { title: tempStepTitle });
    setEditingStepId(null);
  };

  const [stepIdPendingDelete, setStepIdPendingDelete] = useState<string | null>(null);
  const handleDeleteStep = (stepId: string) => {
    setStepIdPendingDelete(stepId);
  };
  const confirmDelete = () => {
    if (stepIdPendingDelete) removeStep(stepIdPendingDelete);
    setStepIdPendingDelete(null);
  };

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };
  
  const selectedField = allFields.find(f => f.id === selectedFieldId);

  const sidebarWidthClass = collapsed ? 'w-16' : 'w-96';
  const sidebarContentHiddenClass = collapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100 w-full';

  const renderStructureTab = () => {
    // Placeholder when no steps/fields yet
    if (isMultiStep && steps.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Noch keine Schritte vorhanden.</p>
          <button
            onClick={() => addStep({ title: `Schritt 1`, description: '', fields: [], isOptional: false })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Ersten Schritt hinzufügen
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500">Oder wechseln Sie zum Tab "Vorlagen", um eine vorgefertigte Sektion einzufügen.</p>
        </div>
      );
    }

    if (!isMultiStep && fields.length === 0) {
      return (
        <div className="py-6 px-4 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Formular erstellen
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Wählen Sie eine Methode, um zu beginnen
            </p>
          </div>
          
          <div className="space-y-3">
            {/* By Field */}
            <button
              onClick={() => setActiveTab('add')}
              className="w-full flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-left transition-colors"
            >
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg mr-3">
                <SquaresPlusIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Nach Feldern</p>
                <p className="text-xs text-blue-600 dark:text-blue-300">Einzelne Felder oder Upload</p>
              </div>
            </button>

            {/* By Field Blocks */}
            <button
              onClick={() => setActiveTab('templates')}
              className="w-full flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 text-left transition-colors"
            >
              <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg mr-3">
                <div className="w-5 h-5 text-green-600 dark:text-green-400 text-lg flex items-center justify-center">🧱</div>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Nach Sektionen</p>
                <p className="text-xs text-green-600 dark:text-green-300">Vorgefertigte Feldgruppen</p>
              </div>
            </button>

            {/* Template Library */}
            <button
              onClick={() => setActiveTab('templates')}
              className="w-full flex items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-left transition-colors"
            >
              <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg mr-3">
                <DocumentArrowUpIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Ganze Vorlage</p>
                <p className="text-xs text-amber-600 dark:text-amber-300">Aus Bibliothek auswählen</p>
              </div>
            </button>

            {/* Saved Templates - Only when logged in */}
            <button
              onClick={() => {
                const isLoggedIn = !!token;
                if (isLoggedIn) {
                  setActiveTab('templates');
                } else {
                  alert('Bitte melden Sie sich an, um auf Ihre gespeicherten Vorlagen zuzugreifen.');
                }
              }}
              className="w-full flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-left transition-colors"
            >
              <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg mr-3">
                <div className="w-5 h-5 text-purple-600 dark:text-purple-400 text-lg flex items-center justify-center">⭐</div>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Gespeicherte Vorlagen</p>
                <p className="text-xs text-purple-600 dark:text-purple-300">Ihre eigenen Vorlagen</p>
              </div>
            </button>

            {/* Upload File */}
            <button
              onClick={() => document.getElementById('structure-file-input')?.click()}
              disabled={isProcessing}
              className="w-full flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-left transition-colors disabled:opacity-50"
            >
              <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg mr-3">
                <CameraIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Datei hochladen</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-300">Screenshot oder PDF</p>
              </div>
            </button>

            <input
              id="structure-file-input"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Processing Status in Structure Tab */}
          {isProcessing && analysisProgress && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                  {analysisProgress.message}
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isMultiStep) {
      return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <SortableStepItem
                  key={step.id}
                  step={step}
                  index={index}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                  isExpanded={expandedSteps[step.id] ?? false}
                  onToggleExpansion={() => toggleStepExpansion(step.id)}
                  editingStepId={editingStepId}
                  tempStepTitle={tempStepTitle}
                  onTempStepTitleChange={setTempStepTitle}
                  onEditStepTitle={() => handleEditStepTitle(step)}
                  onSaveStepTitle={() => handleSaveStepTitle(step.id)}
                  onDeleteStep={() => handleDeleteStep(step.id)}
                >
                  {/* Fields within this step */}
                  <SortableContext items={step.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 pt-2">
                      {step.fields.map((field) => (
                        <SortableSidebarItem
                          key={field.id}
                          field={field}
                          selectedFieldId={selectedFieldId}
                          onFieldSelect={onFieldSelect}
                          onFieldDuplicate={duplicateField}
                          onFieldDelete={removeField}
                          getFieldIcon={getFieldIcon}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </SortableStepItem>
              ))}
              <button
                onClick={() => addStep({ title: `Schritt ${steps.length + 1}`, description: '', fields: [], isOptional: false })}
                className="w-full text-center px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Neuen Schritt hinzufügen
              </button>
            </div>
          </SortableContext>
        </DndContext>
      );
    }
    
    return (
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {fields.map((field) => (
               <SortableSidebarItem
                key={field.id}
                field={field}
                selectedFieldId={selectedFieldId}
                onFieldSelect={onFieldSelect}
                onFieldDuplicate={duplicateField}
                onFieldDelete={removeField}
                getFieldIcon={getFieldIcon}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };

    const renderAddTab = () => (
    <div className="space-y-4">
      {/* Quick Add Fields */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Einzelne Felder
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {fieldTypes.map(ft => (
            <button
              key={ft.type}
              onClick={() => handleQuickAdd(ft.type)}
              className="flex flex-col items-center p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-600 transition-colors"
            >
              <span className="text-xl mb-1">{ft.icon}</span>
              <span className="text-xs font-medium">{ft.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => {
    // Group micro-templates by category for better organization
    const categories = {
      'Basis': microTemplates.filter(t => ['contact-basic', 'address-full', 'personal-details'].includes(t.id)),
      'Beruf': microTemplates.filter(t => ['company-info', 'employment-details', 'skills-qualifications'].includes(t.id)),
      'Gesundheit': microTemplates.filter(t => ['health-basic', 'medical-history'].includes(t.id)),
      'Event': microTemplates.filter(t => ['event-registration', 'workshop-preferences'].includes(t.id)),
      'Finanzen': microTemplates.filter(t => ['payment-info', 'banking-details'].includes(t.id)),
      'Support': microTemplates.filter(t => ['customer-feedback', 'support-request'].includes(t.id)),
      'Rechtliches': microTemplates.filter(t => ['legal-consent', 'data-privacy'].includes(t.id)),
      'Bildung': microTemplates.filter(t => ['course-enrollment'].includes(t.id)),
      'Reisen': microTemplates.filter(t => ['travel-booking'].includes(t.id))
    };

    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Feld-Sektionen
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Vorgefertigte Feldgruppen für verschiedene Anwendungsfälle
          </p>
        </div>

        {/* Button to show full template library in main area */}
        <div className="mb-4">
          <button
            onClick={() => onShowTemplateLibrary?.()}
            className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-1">📚</div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Vollständige Bibliothek</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">Alle Vorlagen durchsuchen</p>
            </div>
          </button>
        </div>

        {Object.entries(categories).map(([categoryName, templates]) => 
          templates.length > 0 && (
            <div key={categoryName}>
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                {categoryName}
              </h4>
              <div className="space-y-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleAddTemplate(template)}
                    className="w-full flex items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-left transition-colors"
                  >
                    <span className="text-lg mr-3">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">{template.name}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-300 truncate">{template.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        {/* Quick access to popular combinations */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Beliebte Kombinationen
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                // Add multiple sections for HR forms
                const hrSections = ['contact-basic', 'personal-details', 'employment-details'];
                hrSections.forEach(id => {
                  const template = microTemplates.find(t => t.id === id);
                  if (template) handleAddTemplate(template);
                });
              }}
              className="w-full flex items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 text-left transition-colors"
            >
              <span className="text-lg mr-3">👥</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">HR-Formular</p>
                <p className="text-xs text-green-600 dark:text-green-300">Kontakt + Personal + Beruf</p>
              </div>
            </button>

            <button
              onClick={() => {
                // Add multiple sections for event registration
                const eventSections = ['contact-basic', 'event-registration', 'payment-info'];
                eventSections.forEach(id => {
                  const template = microTemplates.find(t => t.id === id);
                  if (template) handleAddTemplate(template);
                });
              }}
              className="w-full flex items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-left transition-colors"
            >
              <span className="text-lg mr-3">🎪</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Event-Anmeldung</p>
                <p className="text-xs text-purple-600 dark:text-purple-300">Kontakt + Event + Zahlung</p>
              </div>
            </button>
          </div>
        </div>

        {/* Saved Templates Access */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => {
              // Check if user is logged in using auth context
              const isLoggedIn = !!token;
              if (isLoggedIn) {
                onShowSavedForms?.();
              } else {
                alert('Bitte melden Sie sich an, um auf Ihre gespeicherten Vorlagen zuzugreifen.');
              }
            }}
            className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-600 hover:border-amber-500 dark:hover:border-amber-400 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-1">⭐</div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Gespeicherte Vorlagen</p>
              <p className="text-xs text-amber-600 dark:text-amber-300">Ihre eigenen Formulare</p>
            </div>
          </button>
        </div>
      </div>
    );
  };

  const renderUploadTab = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Formular aus Bild erstellen
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Foto, Screenshot oder PDF hochladen
            </p>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => document.getElementById('camera-input')?.click()}
              disabled={isProcessing}
              className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CameraIcon className="w-4 h-4 mr-2" />
              Foto aufnehmen
            </button>
            
            <button
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={isProcessing}
              className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
              Datei hochladen
            </button>
          </div>
          
          <input
            id="camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraCapture}
          />
          
          <input
            id="file-input"
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>
      
      {/* AI Processing Status */}
      {isProcessing && analysisProgress && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-900 dark:text-blue-100 font-medium">
              {analysisProgress.message}
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress.progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            {analysisProgress.progress}% abgeschlossen
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>💡 <strong>Tipp:</strong> Fotografieren Sie bestehende Formulare für schnelle Digitalisierung</p>
        <p>📋 Unterstützte Formate: JPG, PNG, GIF, WebP, PDF (max. 10MB)</p>
      </div>
    </div>
  );
  
  return (
    <aside className={`${sidebarWidthClass} bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {/* Hamburger / arrow icon */}
          <svg
            className="h-5 w-5 text-gray-600 dark:text-gray-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m-7-7l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {!collapsed && (
          <div className="flex items-center justify-between flex-1 ml-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Formular-Struktur</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Multi-Step</span>
              <button
                onClick={toggleMultiStep}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isMultiStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                title={isMultiStep ? 'Zu Ein-Schritt-Formular wechseln' : 'In Multi-Step umwandeln'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMultiStep ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabs */}
      {!collapsed && (
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 p-3 text-sm font-medium border-r first:rounded-l-lg last:rounded-r-lg transition-all duration-200 ${activeTab === 'structure' ? 'bg-white dark:bg-gray-700 shadow-sm scale-105' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-102'}`}
            onClick={() => {
              setActiveTab('structure');
              if (currentView !== 'builder' && onBackToBuilder) {
                onBackToBuilder();
              }
            }}
          >
            <span className="inline-flex items-center space-x-1 transition-colors duration-200">
              <Squares2X2Icon className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'structure' ? 'scale-110' : ''}`}/>
              <span>Struktur</span>
            </span>
          </button>
          <button
            className={`flex-1 p-3 text-sm font-medium border-r last:border-none transition-all duration-200 ${activeTab === 'add' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 shadow-sm scale-105' : 'hover:bg-blue-50/40 dark:hover:bg-blue-900/10 hover:scale-102'}`}
            onClick={() => {
              setActiveTab('add');
              if (currentView !== 'builder' && onBackToBuilder) {
                onBackToBuilder();
              }
            }}
          >
            <span className="inline-flex items-center space-x-1 transition-colors duration-200">
              <SquaresPlusIcon className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'add' ? 'scale-110' : ''}`}/>
              <span>Felder</span>
            </span>
          </button>
          <button
            className={`flex-1 p-3 text-sm font-medium transition-all duration-200 ${activeTab === 'templates' ? 'bg-amber-50 text-amber-700 dark:bg-yellow-900/30 shadow-sm scale-105' : 'hover:bg-amber-50/40 dark:hover:bg-yellow-900/10 hover:scale-102'}`}
            onClick={() => {
              setActiveTab('templates');
              onShowTemplateLibrary?.();
            }}
          >
            <span className="inline-flex items-center space-x-1 transition-colors duration-200">
              <SquaresPlusIcon className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'templates' ? 'scale-110' : ''}`}/>
              <span>Sektionen</span>
            </span>
          </button>
        </div>
      )}
      
      {/* Tab Content */}
      <div className={`flex-1 overflow-y-auto p-4 ${sidebarContentHiddenClass}`}>
        {activeTab === 'structure' && renderStructureTab()}
        {activeTab === 'add' && renderAddTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
      </div>
      
      {/* Selected Field Editor */}
      {selectedField && (
        <FieldEditor
          key={selectedField.id}
          field={selectedField}
          onUpdate={(updates) => onFieldUpdate(selectedField.id, updates)}
        />
      )}
      <ConfirmDialog
        isOpen={!!stepIdPendingDelete}
        title="Schritt löschen"
        message={`Sind Sie sicher, dass Sie diesen Schritt löschen möchten?
Alle Felder in diesem Schritt gehen verloren.`}
        confirmLabel="Löschen"
        onConfirm={confirmDelete}
        onCancel={() => setStepIdPendingDelete(null)}
      />

      {!collapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={onSaveForm}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Formular speichern
          </button>
          <button
            onClick={clearAllFields}
            className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Alle Felder löschen
          </button>
        </div>
      )}
    </aside>
  );
}

// Sortable Step Item Component
interface SortableStepItemProps {
  step: FormStep;
  index: number;
  currentStep: number;
  onStepChange: (index: number) => void;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  children: React.ReactNode;
  editingStepId: string | null;
  tempStepTitle: string;
  onTempStepTitleChange: (title: string) => void;
  onEditStepTitle: () => void;
  onSaveStepTitle: () => void;
  onDeleteStep: () => void;
}

function SortableStepItem({
  step, index, currentStep, onStepChange, children, editingStepId, tempStepTitle,
  onTempStepTitleChange, onEditStepTitle, onSaveStepTitle, onDeleteStep, isExpanded, onToggleExpansion
}: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingStepId === step.id;

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSaveStepTitle();
    }
  };

  React.useEffect(() => {
    if (isEditing) {
      // Focus logic here if needed, e.g., using a ref
    }
  }, [isEditing]);

  const handleHeaderClick = () => {
    onStepChange(index);
    onToggleExpansion();
  };

  return (
    <div ref={setNodeRef} style={style}
      className={`rounded-lg transition-all duration-300 ${
        currentStep === index
          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600'
          : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={handleHeaderClick}>
         <div className="flex items-center flex-1 min-w-0">
            <div ref={setActivatorNodeRef} className="text-lg mr-3 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>⠿</div>
            {editingStepId === step.id ? (
                <input 
                    type="text"
                    value={tempStepTitle}
                    onChange={(e) => onTempStepTitleChange(e.target.value)}
                    onBlur={onSaveStepTitle}
                    onKeyDown={(e) => e.key === 'Enter' && onSaveStepTitle()}
                    autoFocus
                    className="p-1 -m-1 w-full bg-transparent border-b"
                    onClick={e => e.stopPropagation()}
                />
            ) : (
                <span className="font-semibold text-gray-900 dark:text-white truncate">{step.title}</span>
            )}
        </div>
        <div className="flex items-center space-x-1 ml-2">
            <button onClick={(e)=>{e.stopPropagation(); onEditStepTitle();}} className="p-1 text-gray-400 hover:text-blue-600" title="Bearbeiten">
              <PencilSquareIcon className="w-5 h-5" />
            </button>
            <button onClick={(e)=>{e.stopPropagation(); onDeleteStep();}} className="p-1 text-gray-400 hover:text-red-600" title="Löschen">
              <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      {isExpanded && <div className="p-3 border-t border-gray-200 dark:border-gray-600">{children}</div>}
    </div>
  );
}