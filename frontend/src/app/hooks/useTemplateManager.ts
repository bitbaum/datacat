import { useState, useCallback } from 'react';
import { FormTemplate, FieldConfig } from '../types/form';
import { useLocalStorage } from './useLocalStorage';

export function useTemplateManager() {
  const [savedTemplates, setSavedTemplates] = useLocalStorage<FormTemplate[]>('form-templates', []);
  const [isLoading, setIsLoading] = useState(false);

  const saveTemplate = useCallback(
    async (name: string, description: string, fields: FieldConfig[]): Promise<FormTemplate> => {
      setIsLoading(true);

      try {
        const newTemplate: FormTemplate = {
          id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          description: description.trim(),
          fields: fields.map((field) => ({
            ...field,
            id: `${field.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          })),
        };

        const updatedTemplates = [...savedTemplates, newTemplate];
        setSavedTemplates(updatedTemplates);

        return newTemplate;
      } finally {
        setIsLoading(false);
      }
    },
    [savedTemplates, setSavedTemplates],
  );

  const updateTemplate = useCallback(
    async (
      templateId: string,
      updates: Partial<Omit<FormTemplate, 'id'>>,
    ): Promise<FormTemplate | null> => {
      setIsLoading(true);

      try {
        const updatedTemplates = savedTemplates.map((template) =>
          template.id === templateId ? { ...template, ...updates } : template,
        );

        setSavedTemplates(updatedTemplates);

        return updatedTemplates.find((t) => t.id === templateId) || null;
      } finally {
        setIsLoading(false);
      }
    },
    [savedTemplates, setSavedTemplates],
  );

  const deleteTemplate = useCallback(
    async (templateId: string): Promise<boolean> => {
      setIsLoading(true);

      try {
        const updatedTemplates = savedTemplates.filter((template) => template.id !== templateId);
        setSavedTemplates(updatedTemplates);
        return true;
      } catch (error) {
        console.error('Error deleting template:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [savedTemplates, setSavedTemplates],
  );

  const duplicateTemplate = useCallback(
    async (templateId: string): Promise<FormTemplate | null> => {
      const originalTemplate = savedTemplates.find((t) => t.id === templateId);
      if (!originalTemplate) return null;

      return saveTemplate(
        `${originalTemplate.name} (Kopie)`,
        originalTemplate.description,
        originalTemplate.fields,
      );
    },
    [savedTemplates, saveTemplate],
  );

  const getTemplate = useCallback(
    (templateId: string): FormTemplate | null => {
      return savedTemplates.find((template) => template.id === templateId) || null;
    },
    [savedTemplates],
  );

  const searchTemplates = useCallback(
    (query: string): FormTemplate[] => {
      if (!query.trim()) return savedTemplates;

      const lowercaseQuery = query.toLowerCase();
      return savedTemplates.filter(
        (template) =>
          template.name.toLowerCase().includes(lowercaseQuery) ||
          template.description.toLowerCase().includes(lowercaseQuery),
      );
    },
    [savedTemplates],
  );

  const getTemplateStats = useCallback(() => {
    const totalTemplates = savedTemplates.length;
    const avgFieldsPerTemplate =
      totalTemplates > 0
        ? savedTemplates.reduce((sum, template) => sum + template.fields.length, 0) / totalTemplates
        : 0;

    const fieldTypeStats = savedTemplates.reduce(
      (stats, template) => {
        template.fields.forEach((field) => {
          stats[field.type] = (stats[field.type] || 0) + 1;
        });
        return stats;
      },
      {} as Record<string, number>,
    );

    return {
      totalTemplates,
      avgFieldsPerTemplate: Math.round(avgFieldsPerTemplate * 10) / 10,
      fieldTypeStats,
    };
  }, [savedTemplates]);

  return {
    templates: savedTemplates,
    isLoading,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    getTemplate,
    searchTemplates,
    getTemplateStats,
  };
}
