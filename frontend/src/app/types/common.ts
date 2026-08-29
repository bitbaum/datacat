// Common types and interfaces shared across components

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
}

export interface ErrorProps {
  error?: string | null;
  onErrorClear?: () => void;
}

// Modal-related types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface ConfirmDialogProps extends Omit<ModalProps, 'children'> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

// Form-related types
export interface FormControlProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends FormControlProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  onChange: (value: string | string[]) => void;
}

// Button types
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ComponentType<any>;
  rightIcon?: React.ComponentType<any>;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// Navigation types
export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
  badge?: string | number;
  children?: NavigationItem[];
  disabled?: boolean;
  onClick?: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

// Data display types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  width?: string | number;
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  empty?: React.ReactNode;
  onRowClick?: (item: T, index: number) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  keyField?: keyof T;
}

// Filter and search types
export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
  searchable?: boolean;
}

export interface ActiveFilter {
  filterId: string;
  value: string | string[];
  label?: string;
}

export interface FilterProps extends BaseComponentProps {
  groups: FilterGroup[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  onClear?: () => void;
}

// Pagination types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginationProps extends BaseComponentProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
  limitOptions?: number[];
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  pagination?: PaginationInfo;
}

export interface ApiError {
  message: string;
  code?: string | number;
  field?: string;
}

// Form builder specific shared types
export interface FormBuilderAction {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  shortcut?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  onClick: () => void;
}

export interface ToolbarProps extends BaseComponentProps {
  actions: FormBuilderAction[];
  title?: string;
  subtitle?: string;
  showDividers?: boolean;
}

// Toast/notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Theme types
export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Animation types
export type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce';
export type AnimationDirection = 'up' | 'down' | 'left' | 'right';

export interface AnimationProps {
  type?: AnimationType;
  direction?: AnimationDirection;
  duration?: number;
  delay?: number;
  className?: string;
}

// Generic utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event handler types
export type ChangeHandler<T = any> = (value: T) => void;
export type ClickHandler = (event: React.MouseEvent) => void;
export type KeyboardHandler = (event: React.KeyboardEvent) => void;
export type FocusHandler = (event: React.FocusEvent) => void;
