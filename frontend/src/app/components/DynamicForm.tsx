'use client';

import { useState, useEffect } from 'react';
import { FormBuilderLayout } from './FormBuilderLayout';
import { FormFieldBuilder } from './FormFieldBuilder';
import { FieldEditor } from './FieldEditor';
import { FieldGroup } from './FieldGroup';
import { GroupManager } from './GroupManager';
import { SaveTemplateModal } from './SaveTemplateModal';
import { Button } from './Button';
import { FieldConfig, FormData } from '../types/form';
import { useFormValidation } from '../hooks/useFormValidation';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTemplateManager } from '../hooks/useTemplateManager';

interface DynamicFormProps {
  initialFields: FieldConfig[];
  onSubmit: (data: FormData) => void;
  onFieldsChange?: (fields: FieldConfig[]) => void;
}

export function DynamicForm({ initialFields, onSubmit, onFieldsChange }: DynamicFormProps) {
  const [fields, setFields] = useState<FieldConfig[]>(initialFields);
  const [formData, setFormData] = useState<FormData>(() => {
    const data: FormData = {};
    initialFields.forEach((field) => {
      data[field.name] = '';
    });
    return data;
  });

  const { validateForm, validateSingleField, getFieldError, hasErrors, clearErrors } =
    useFormValidation(fields);
  const { savedData, saveNow, clearSavedData, getLastSaveTime, hasSavedData } = useAutoSave(
    formData,
    fields,
  );
  const { saveTemplate } = useTemplateManager();
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [editingField, setEditingField] = useState<FieldConfig | null>(null);

  // Load saved data on component mount
  useEffect(() => {
    if (savedData && Object.keys(formData).every((key) => !formData[key])) {
      // Only load if current form is empty
      setFormData(savedData.formData);
      if (savedData.fields.length !== fields.length) {
        setFields(savedData.fields);
        onFieldsChange?.(savedData.fields);
      }
    }
  }, [savedData]); // Only run when savedData changes, not on every render

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFieldBlur = (fieldName: string) => {
    const value = formData[fieldName] || '';
    validateSingleField(fieldName, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);

    if (errors.length === 0) {
      clearSavedData(); // Clear auto-save data on successful submit
      onSubmit(formData);
    }
  };

  const handleSaveDraft = () => {
    saveNow();
  };

  const handleSaveAsTemplate = async (name: string, description: string) => {
    await saveTemplate(name, description, fields);
  };

  const handleCreateGroup = (groupName: string) => {
    // Group creation side-effects can be handled here if necessary
  };

  const handleDeleteGroup = (groupName: string) => {
    // Move all fields from this group to 'Allgemeine Felder'
    const updatedFields = fields.map((field) =>
      field.group === groupName ? { ...field, group: undefined } : field,
    );
    setFields(updatedFields);
    onFieldsChange?.(updatedFields);
  };

  const getAvailableGroups = () => {
    const groups = new Set<string>();
    fields.forEach((field) => {
      if (field.group) {
        groups.add(field.group);
      }
    });
    return Array.from(groups);
  };

  const addField = (fieldConfig: FieldConfig) => {
    const newFields = [...fields, fieldConfig];
    setFields(newFields);
    setFormData((prev) => ({
      ...prev,
      [fieldConfig.name]: '',
    }));
    onFieldsChange?.(newFields);
  };

  const addQuickField = (type: FieldConfig['type']) => {
    const fieldNames: Record<FieldConfig['type'], string> = {
      text: 'Textfeld',
      email: 'E-Mail',
      tel: 'Telefon',
      date: 'Datum',
      select: 'Auswahl',
      textarea: 'Textbereich',
      checkbox: 'Checkbox',
      radio: 'Radio',
      number: 'Zahl',
      range: 'Bereich',
      file: 'Datei',
      url: 'URL',
      password: 'Passwort',
    };

    const fieldConfig: FieldConfig = {
      id: `quick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `${fieldNames[type]?.toLowerCase().replace(/[^a-z]/g, '_') || type}_${Date.now()}`,
      label: fieldNames[type] || type,
      required: false,
      placeholder: type === 'select' ? undefined : `${fieldNames[type]} eingeben...`,
      options:
        type === 'select'
          ? [
              { value: '', label: 'Auswahl treffen' },
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ]
          : undefined,
      rows: type === 'textarea' ? 3 : undefined,
    };

    addField(fieldConfig);
  };

  const removeField = (fieldId: string) => {
    const newFields = fields.filter((field) => field.id !== fieldId);
    setFields(newFields);
    const fieldToRemove = fields.find((field) => field.id === fieldId);
    if (fieldToRemove) {
      setFormData((prev) => {
        const newData = { ...prev };
        delete newData[fieldToRemove.name];
        return newData;
      });
    }
    onFieldsChange?.(newFields);
  };

  const updateField = (fieldId: string, updates: Partial<FieldConfig>) => {
    const newFields = fields.map((field) =>
      field.id === fieldId ? { ...field, ...updates } : field,
    );
    setFields(newFields);
    onFieldsChange?.(newFields);
  };

  const handleEditField = (field: FieldConfig) => {
    setEditingField(field);
  };

  const handleSaveFieldEdit = (updates: Partial<FieldConfig>) => {
    if (editingField) {
      updateField(editingField.id, updates);
      setEditingField(null);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    removeField(fieldId);
    setEditingField(null);
  };

  return (
    <FormBuilderLayout
      onAddField={addField}
      onSaveTemplate={() => setShowSaveTemplateModal(true)}
      onSaveDraft={handleSaveDraft}
      onManageGroups={() => setShowGroupManager(true)}
      canSubmit={!hasErrors}
    >
      <div className="space-y-6">
        {/* Auto-save Notification */}
        {hasSavedData && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 animate-fade-in backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Automatisch gespeichert {getLastSaveTime()}
                </span>
              </div>
              <button
                type="button"
                onClick={clearSavedData}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium hover:underline transition-all duration-200"
              >
                Entwurf löschen
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {fields.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Beginnen Sie mit dem Formular-Design
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Öffnen Sie die Sidebar oder ziehen Sie Felder hierher, um Ihr Formular zu erstellen
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group fields by their group property */}
          {(() => {
            const groupedFields = fields.reduce(
              (groups, field) => {
                const groupName = field.group || 'Allgemeine Felder';
                if (!groups[groupName]) {
                  groups[groupName] = [];
                }
                groups[groupName].push(field);
                return groups;
              },
              {} as Record<string, FieldConfig[]>,
            );

            return (
              <div className="space-y-6">
                {Object.entries(groupedFields).map(([groupName, groupFields]) => {
                  if (
                    groupName === 'Allgemeine Felder' &&
                    Object.keys(groupedFields).length === 1
                  ) {
                    // If there's only one group and it's the default, render fields directly
                    return (
                      <div key={groupName} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {groupFields.map((field) => (
                          <FormFieldBuilder
                            key={field.id}
                            field={field}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            onBlur={() => handleFieldBlur(field.name)}
                            onRemove={() => removeField(field.id)}
                            onEdit={() => handleEditField(field)}
                            error={getFieldError(field.name)}
                            isEditing={editingField?.id === field.id}
                          />
                        ))}
                      </div>
                    );
                  }

                  // Render as field groups
                  return (
                    <div
                      key={groupName}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {groupName}
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {groupFields.length} Feld{groupFields.length !== 1 ? 'er' : ''}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groupFields.map((field) => (
                          <FormFieldBuilder
                            key={field.id}
                            field={field}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            onBlur={() => handleFieldBlur(field.name)}
                            onRemove={() => removeField(field.id)}
                            onEdit={() => handleEditField(field)}
                            error={getFieldError(field.name)}
                            isEditing={editingField?.id === field.id}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Validation Errors */}
          {hasErrors && (
            <div className="bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border border-red-200 dark:border-red-800/50 rounded-xl p-4 animate-fade-in backdrop-blur-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                    Bitte korrigieren Sie die folgenden Fehler:
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {fields.length > 0 && (
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={hasErrors}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Formular absenden
              </Button>
            </div>
          )}
        </form>

        {/* Modals */}
        {editingField && <FieldEditor field={editingField} onUpdate={handleSaveFieldEdit} />}

        {showGroupManager && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowGroupManager(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Gruppen verwalten
                </h3>
                <button
                  onClick={() => setShowGroupManager(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <GroupManager
                availableGroups={getAvailableGroups()}
                onCreateGroup={handleCreateGroup}
                onDeleteGroup={handleDeleteGroup}
              />
            </div>
          </div>
        )}

        <SaveTemplateModal
          isOpen={showSaveTemplateModal}
          onClose={() => setShowSaveTemplateModal(false)}
          onSave={handleSaveAsTemplate}
          fields={fields}
        />
      </div>
    </FormBuilderLayout>
  );
}
