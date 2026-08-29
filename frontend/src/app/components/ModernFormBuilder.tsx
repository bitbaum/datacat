'use client';

import React, { useState } from 'react';
import { FieldConfig, FieldTemplate } from '../types/form';
import { EmptyStep } from './EmptyStep';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fieldTemplates } from '../data/fieldTemplates';

export interface ModernFieldBuilderProps {
  field: FieldConfig;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onUpdateField: (updates: Partial<FieldConfig>) => void;
  onRemoveField: () => void;
  onDuplicateField: () => void;
  onSelect: () => void; // Add this
  isSelected: boolean; // Add this
  error?: string | null;
}

export function ModernFieldBuilder({
  field,
  value,
  onChange,
  onUpdateField,
  onRemoveField,
  onDuplicateField,
  onSelect, // Add this
  isSelected, // Add this
  error,
}: ModernFieldBuilderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(field.label);
  const [tempPlaceholder, setTempPlaceholder] = useState(field.placeholder || '');
  const [showOptions, setShowOptions] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const handleLabelClick = () => {
    setIsEditing(true);
  };

  const handleLabelSave = () => {
    if (tempLabel.trim()) {
      onUpdateField({
        label: tempLabel.trim(),
        name: tempLabel.toLowerCase().replace(/\s+/g, '_'),
      });
    }
    setIsEditing(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSave();
    } else if (e.key === 'Escape') {
      setTempLabel(field.label);
      setIsEditing(false);
    }
  };

  const toggleRequired = () => {
    onUpdateField({ required: !field.required });
  };

  const updateFieldType = (newType: FieldConfig['type']) => {
    const fieldDefaults: Record<FieldConfig['type'], Partial<FieldConfig>> = {
      text: {
        label: 'Textfeld',
        placeholder: 'Text eingeben...',
        options: undefined,
        rows: undefined,
      },
      email: {
        label: 'E-Mail',
        placeholder: 'E-Mail eingeben...',
        options: undefined,
        rows: undefined,
      },
      tel: {
        label: 'Telefon',
        placeholder: 'Telefonnummer eingeben...',
        options: undefined,
        rows: undefined,
      },
      date: {
        label: 'Datum',
        placeholder: '',
        options: undefined,
        rows: undefined,
      },
      select: {
        label: 'Auswahl',
        placeholder: undefined,
        options: [
          { value: '', label: 'Auswahl treffen' },
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
        ],
        rows: undefined,
      },
      textarea: {
        label: 'Textbereich',
        placeholder: 'Text eingeben...',
        options: undefined,
        rows: 3,
      },
      checkbox: {
        label: 'Checkbox',
        options: [{ value: 'true', label: 'Aktiviert' }],
      },
      radio: {
        label: 'Radio',
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
        ],
      },
      number: {
        label: 'Zahl',
        placeholder: '0',
        options: undefined,
        rows: undefined,
        min: 0,
        max: 100,
      },
      range: {
        label: 'Bereich',
        placeholder: undefined,
        options: undefined,
        rows: undefined,
        min: 0,
        max: 100,
        stepSize: 1,
      },
      file: {
        label: 'Datei',
        placeholder: undefined,
        options: undefined,
        rows: undefined,
        accept: '*/*',
        multiple: false,
      },
      url: {
        label: 'URL',
        placeholder: 'https://beispiel.de',
        options: undefined,
        rows: undefined,
      },
      password: {
        label: 'Passwort',
        placeholder: 'Passwort eingeben...',
        options: undefined,
        rows: undefined,
      },
    };

    const defaults = fieldDefaults[newType];
    const newName = (defaults.label || newType).toLowerCase().replace(/\s+/g, '_');

    onUpdateField({
      type: newType,
      label: defaults.label,
      name: `${newName}_${field.id.substring(0, 4)}`, // Keep a stable part of the old id for the name
      placeholder: defaults.placeholder,
      options: defaults.options,
      rows: defaults.rows,
      min: defaults.min,
      max: defaults.max,
      stepSize: defaults.stepSize,
      accept: defaults.accept,
      multiple: defaults.multiple,
    });
  };

  const fieldTypeLabels: Record<FieldConfig['type'], string> = {
    text: 'Text',
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative bg-white dark:bg-gray-800 rounded-lg border-2 transition-all duration-200 ${
        isDragging
          ? 'border-blue-500 shadow-lg scale-105'
          : isSelected
            ? 'border-blue-500 shadow-md'
            : error
              ? 'border-red-300 dark:border-red-600'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${isEditing ? 'border-blue-500 shadow-lg' : ''}`}
    >
      {/* Drag Handle */}
      <div
        className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className="absolute -inset-1 bg-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </div>

      <div className="p-6 pl-12">
        {/* Field Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={tempLabel}
                onChange={(e) => setTempLabel(e.target.value)}
                onBlur={handleLabelSave}
                onKeyDown={handleLabelKeyDown}
                className="text-lg font-medium bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                autoFocus
              />
            ) : (
              <div
                onClick={handleLabelClick}
                className="text-lg font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {field.label}
                <svg
                  className="inline w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Field Type Selector */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {fieldTypeLabels[field.type]}
              <svg
                className="inline w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showOptions && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                {Object.entries(fieldTypeLabels).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => {
                      updateFieldType(type as FieldConfig['type']);
                      setShowOptions(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      field.type === type
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : ''
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Field Preview */}
        <div className="mb-4">
          {field.type === 'text' && (
            <input
              type="text"
              value={value}
              onChange={onChange}
              placeholder={field.placeholder || 'Text eingeben...'}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          )}

          {field.type === 'email' && (
            <input
              type="email"
              value={value}
              onChange={onChange}
              placeholder={field.placeholder || 'E-Mail eingeben...'}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          )}

          {field.type === 'tel' && (
            <input
              type="tel"
              value={value}
              onChange={onChange}
              placeholder={field.placeholder || 'Telefonnummer eingeben...'}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          )}

          {field.type === 'date' && (
            <input
              type="date"
              value={value}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          )}

          {field.type === 'select' && (
            <select
              value={value}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {(field.options || []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {field.type === 'textarea' && (
            <textarea
              value={value}
              onChange={onChange}
              rows={field.rows || 3}
              placeholder={field.placeholder || 'Text eingeben...'}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          )}

          {field.type === 'checkbox' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={value === 'true'}
                onChange={onChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-3 text-gray-700 dark:text-gray-300">
                {field.options?.[0]?.label || 'Label'}
              </label>
            </div>
          )}

          {field.type === 'radio' && (
            <div className="flex flex-col space-y-2">
              {(field.options || []).map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={value === option.value}
                    onChange={onChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          )}

          {field.type === 'number' && (
            <input
              type="number"
              value={value}
              onChange={onChange}
              placeholder={field.placeholder || '0'}
              min={field.min}
              max={field.max}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          )}

          {field.type === 'range' && (
            <div className="space-y-2">
              <input
                type="range"
                value={value || field.min || 0}
                onChange={onChange}
                min={field.min || 0}
                max={field.max || 100}
                step={field.stepSize || 1}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{field.min || 0}</span>
                <span className="font-medium">{value || field.min || 0}</span>
                <span>{field.max || 100}</span>
              </div>
            </div>
          )}

          {field.type === 'file' && (
            <input
              type="file"
              onChange={onChange}
              accept={field.accept}
              multiple={field.multiple}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          )}

          {field.type === 'url' && (
            <input
              type="url"
              value={value}
              onChange={onChange}
              placeholder={field.placeholder || 'https://beispiel.de'}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          )}

          {field.type === 'password' && (
            <input
              type="password"
              value={value}
              onChange={onChange}
              placeholder={field.placeholder || 'Passwort eingeben...'}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          )}

          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        {/* Field Footer / Actions */}
        <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={field.required}
                onChange={toggleRequired}
                className="sr-only"
              />
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  field.required ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    field.required ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Pflichtfeld</span>
            </label>

            {/* Placeholder Editor */}
            <input
              type="text"
              value={tempPlaceholder}
              onChange={(e) => setTempPlaceholder(e.target.value)}
              onBlur={() => onUpdateField({ placeholder: tempPlaceholder })}
              placeholder="Platzhaltertext..."
              className="text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-2 py-1 text-gray-600 dark:text-gray-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateField();
              }}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Feld duplizieren"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              onClick={onRemoveField}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Feld löschen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close options */}
      {showOptions && <div className="fixed inset-0 z-[5]" onClick={() => setShowOptions(false)} />}
    </div>
  );
}

// THIS IS THE SECOND COMPONENT IN THE FILE

interface ModernFormBuilderProps {
  fields: FieldConfig[];
  formData: Record<string, string>;
  onFieldChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onUpdateField: (id: string, updates: Partial<FieldConfig>) => void;
  onRemoveField: (id: string) => void;
  onDuplicateField: (id: string) => void;
  onSelectField: (id: string) => void; // Add this
  selectedFieldId?: string; // Add this
  errors: Record<string, string | null>;
}

export function ModernFormBuilder({
  fields,
  formData,
  onFieldChange,
  onUpdateField,
  onRemoveField,
  onDuplicateField,
  onSelectField, // Add this
  selectedFieldId, // Add this
  errors,
}: ModernFormBuilderProps) {
  const { addField, addTemplateFields, clearAllFields } = useFormBuilderStore();

  if (fields.length === 0) {
    return (
      <EmptyStep
        onAddField={(type: FieldConfig['type']) => addField(type)}
        onAddTemplate={(template: FieldTemplate) => addTemplateFields(template)}
      />
    );
  }

  return (
    <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-6">
        {fields.map((field) => (
          <ModernFieldBuilder
            key={field.id}
            field={field}
            value={formData[field.name] || ''}
            onChange={onFieldChange}
            onUpdateField={(updates) => onUpdateField(field.id, updates)}
            onRemoveField={() => onRemoveField(field.id)}
            onDuplicateField={() => onDuplicateField(field.id)}
            onSelect={() => onSelectField(field.id)} // Add this
            isSelected={selectedFieldId === field.id} // Add this
            error={errors[field.name]}
          />
        ))}
        {/* inline add placeholder */}
        <div className="flex items-center justify-center py-6">
          <div className="flex gap-4">
            <button
              onClick={() => addField('text')}
              className="flex items-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Feld hinzufügen"
            >
              ＋ Feld
            </button>
            <button
              onClick={() => addTemplateFields(fieldTemplates[0])}
              className="flex items-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Sektion hinzufügen"
            >
              ＋ Sektion
            </button>
            <button
              onClick={clearAllFields}
              className="flex items-center px-4 py-2 border-2 border-dashed border-red-300 dark:border-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
              title="Alle Felder löschen"
            >
              🗑 Alle löschen
            </button>
          </div>
        </div>
      </div>
    </SortableContext>
  );
}
