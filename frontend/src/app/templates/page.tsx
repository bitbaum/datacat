'use client';

import React from 'react';
import { TemplateLibrary, TemplateData } from '../components/TemplateLibrary';
import { TemplatePreviewModal } from '../components/TemplatePreviewModal';
import { FormTemplate } from '../types/form';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const router = useRouter();

  const [previewTemplate, setPreviewTemplate] = React.useState<FormTemplate | null>(null);

  const handleUseTemplate = (template: TemplateData) => {
    // Store template data in localStorage for the builder to pick up
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    // Navigate to builder
    router.push('/builder?from=template');
  };

  const handlePreviewTemplate = (template: TemplateData) => {
    // Convert template fields to include fake ids for preview to satisfy FormTemplate type
    const withIds: FormTemplate = {
      ...template,
      fields: template.fields.map((f, idx) => ({ ...f, id: `preview-${idx}` })),
    };
    setPreviewTemplate(withIds);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TemplateLibrary
        onUseTemplate={handleUseTemplate}
        onPreviewTemplate={handlePreviewTemplate}
      />
      <TemplatePreviewModal
        isOpen={!!previewTemplate}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
}
