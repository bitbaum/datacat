'use client';

import React, { useState, useEffect } from 'react';
import { FieldConfig } from '../types/form';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';

interface FieldEditorProps {
  field: FieldConfig;
  onUpdate: (updates: Partial<FieldConfig>) => void;
}

export function FieldEditor({ field, onUpdate }: FieldEditorProps) {
  const [label, setLabel] = useState(field.label);
  const [placeholder, setPlaceholder] = useState(field.placeholder || '');
  const [options, setOptions] = useState(field.options || []);
  const [rows, setRows] = useState(field.rows || 3);

  const { fields, steps, isMultiStep } = useFormBuilderStore();
  const allOtherFields = (isMultiStep ? steps.flatMap((s) => s.fields) : fields).filter(
    (f) => f.id !== field.id,
  );

  // Reset state when the selected field changes
  useEffect(() => {
    setLabel(field.label);
    setPlaceholder(field.placeholder || '');
    setOptions(field.options || []);
    setRows(field.rows || 3);
  }, [field]);

  const handleUpdate = (updates: Partial<FieldConfig>) => {
    onUpdate(updates);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };

  const handleLabelBlur = () => {
    if (label.trim() === '') {
      setLabel(field.label); // revert if empty
    } else if (label.trim() !== field.label) {
      handleUpdate({
        label: label.trim(),
        name: label.trim().toLowerCase().replace(/\s+/g, '_'),
      });
    }
  };

  const handlePlaceholderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaceholder(e.target.value);
  };

  const handlePlaceholderBlur = () => {
    if (placeholder !== field.placeholder) {
      handleUpdate({ placeholder });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      label: value,
      value: value.toLowerCase().replace(/\s+/g, '_'),
    };
    setOptions(newOptions);
  };

  const handleOptionBlur = () => {
    handleUpdate({ options });
  };

  const addOption = () => {
    const newOption = {
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };
    const newOptions = [...options, newOption];
    setOptions(newOptions);
    handleUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    handleUpdate({ options: newOptions });
  };

  const handleRowsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRows = parseInt(e.target.value, 10);
    setRows(newRows);
    handleUpdate({ rows: newRows });
  };

  const handleLogicChange = (
    key: keyof NonNullable<FieldConfig['conditionalLogic']>,
    value: string,
  ) => {
    const newLogic = {
      ...(field.conditionalLogic || { fieldId: '', condition: 'isEqualTo', value: '' }),
      [key]: value,
    };

    if (key === 'condition') {
      newLogic.condition = value as NonNullable<FieldConfig['conditionalLogic']>['condition'];
    }

    onUpdate({ conditionalLogic: newLogic });
  };

  const clearLogic = () => {
    onUpdate({ conditionalLogic: undefined });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 space-y-6">
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Feld bearbeiten: {field.label}
        </h4>
      </div>

      {/* General Settings */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="field-label"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Bezeichnung
          </label>
          <input
            type="text"
            id="field-label"
            value={label}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="field-placeholder"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Platzhalter
          </label>
          <input
            type="text"
            id="field-placeholder"
            value={placeholder}
            onChange={handlePlaceholderChange}
            onBlur={handlePlaceholderBlur}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            id="field-required"
            type="checkbox"
            checked={field.required}
            onChange={(e) => handleUpdate({ required: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label
            htmlFor="field-required"
            className="ml-2 block text-sm text-gray-900 dark:text-gray-200"
          >
            Pflichtfeld
          </label>
        </div>
      </div>

      {/* Type-specific Settings */}
      {field.type === 'select' && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Optionen</h5>
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={option.label}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                onBlur={handleOptionBlur}
                className="flex-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                onClick={() => removeOption(index)}
                className="p-1 text-red-500 hover:bg-red-100 rounded"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
          <button onClick={addOption} className="text-sm text-blue-600 hover:text-blue-800">
            + Option hinzufügen
          </button>
        </div>
      )}

      {field.type === 'textarea' && (
        <div>
          <label
            htmlFor="field-rows"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Zeilen
          </label>
          <select
            id="field-rows"
            value={rows}
            onChange={handleRowsChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option>3</option>
            <option>5</option>
            <option>8</option>
          </select>
        </div>
      )}

      {/* Conditional Logic Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Conditional Logic
        </h3>

        {!field.conditionalLogic ? (
          <button
            onClick={() => handleLogicChange('fieldId', allOtherFields[0]?.id || '')}
            className="w-full text-center px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Add Condition
          </button>
        ) : (
          <div className="space-y-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Show this field only if...</p>

            <div>
              <label
                htmlFor="logic-field"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Field
              </label>
              <select
                id="logic-field"
                value={field.conditionalLogic.fieldId}
                onChange={(e) => handleLogicChange('fieldId', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"
              >
                <option value="">Select a field...</option>
                {allOtherFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="logic-condition"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Condition
              </label>
              <select
                id="logic-condition"
                value={field.conditionalLogic.condition}
                onChange={(e) => handleLogicChange('condition', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"
              >
                <option value="isEqualTo">Is equal to</option>
                <option value="isNotEqualTo">Is not equal to</option>
                <option value="contains">Contains</option>
                <option value="doesNotContain">Does not contain</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="logic-value"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Value
              </label>
              <input
                type="text"
                id="logic-value"
                value={field.conditionalLogic.value}
                onChange={(e) => handleLogicChange('value', e.target.value)}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              />
            </div>

            <button
              onClick={clearLogic}
              className="w-full text-center px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
            >
              Remove Condition
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
