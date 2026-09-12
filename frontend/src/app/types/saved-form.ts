import type { FieldConfig, FormStep } from './form';

/**
 * A form as the builder and the library both see it.
 *
 * This type used to live in `components/SavedForms.tsx`, next to a 533-line
 * component that nothing rendered. Two files imported the type; none imported
 * the component. Keeping a type inside a dead component file is what let the
 * component survive — every attempt to notice it was unused found an import and
 * stopped there.
 */
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
