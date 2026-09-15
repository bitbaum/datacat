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
/**
 * What the builder writes into the Prisma `Form.schema` Json column
 * (src/app/components/ModernFormBuilderLayout.tsx `doSave`) and what
 * GET /api/v1/forms hands back as `structure`.
 */
export interface StoredFormStructure {
  fields?: FieldConfig[];
  steps?: FormStep[];
  isMultiStep?: boolean;
  tags?: string[];
  category?: string;
}

/** One row of the GET /api/v1/forms response (src/app/api/v1/forms/route.ts), as JSON. */
export interface FormListRow {
  id: string;
  title: string;
  description: string | null;
  structure: StoredFormStructure;
  isMultiStep: boolean;
  status: SavedForm['status'];
  is_template: boolean;
  created_at: string;
  updated_at: string;
  submission_count: number;
}

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
