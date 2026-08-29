'use client';

// Centralized icon exports to reduce duplication across components
import {
  // Form Building Icons
  SquaresPlusIcon,
  DocumentArrowUpIcon,
  CameraIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  Squares2X2Icon,

  // Navigation Icons
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,

  // Action Icons
  RocketLaunchIcon,
  SparklesIcon,
  EyeIcon,
  EyeSlashIcon,
  ShareIcon,
  ArrowDownTrayIcon,

  // Status Icons
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,

  // Menu Icons
  Bars3Icon,
  EllipsisVerticalIcon,
  EllipsisHorizontalIcon,

  // Common Icons
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  HomeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

import {
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationCircleIcon as ExclamationCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
} from '@heroicons/react/24/solid';

// Icon categories for better organization
export const FormBuilderIcons = {
  AddField: SquaresPlusIcon,
  Upload: DocumentArrowUpIcon,
  Camera: CameraIcon,
  Duplicate: DocumentDuplicateIcon,
  Folder: FolderIcon,
  Plus: PlusIcon,
  Edit: PencilSquareIcon,
  Delete: TrashIcon,
  Grid: Squares2X2Icon,
};

export const NavigationIcons = {
  Close: XMarkIcon,
  Left: ChevronLeftIcon,
  Right: ChevronRightIcon,
  Up: ChevronUpIcon,
  Down: ChevronDownIcon,
};

export const ActionIcons = {
  Launch: RocketLaunchIcon,
  Magic: SparklesIcon,
  View: EyeIcon,
  Hide: EyeSlashIcon,
  Share: ShareIcon,
  Download: ArrowDownTrayIcon,
};

export const StatusIcons = {
  Success: CheckIcon,
  Warning: ExclamationTriangleIcon,
  Info: InformationCircleIcon,
  Error: XCircleIcon,
  // Solid versions for filled states
  SuccessFilled: CheckCircleIconSolid,
  WarningFilled: ExclamationCircleIconSolid,
  InfoFilled: InformationCircleIconSolid,
  ErrorFilled: XCircleIconSolid,
};

export const MenuIcons = {
  Menu: Bars3Icon,
  MoreVertical: EllipsisVerticalIcon,
  MoreHorizontal: EllipsisHorizontalIcon,
};

export const CommonIcons = {
  Search: MagnifyingGlassIcon,
  Filter: AdjustmentsHorizontalIcon,
  Calendar: CalendarIcon,
  Clock: ClockIcon,
  User: UserIcon,
  Users: UsersIcon,
  Home: HomeIcon,
  Settings: Cog6ToothIcon,
};

// Combined export for backwards compatibility
export const Icons = {
  ...FormBuilderIcons,
  ...NavigationIcons,
  ...ActionIcons,
  ...StatusIcons,
  ...MenuIcons,
  ...CommonIcons,
};

// Icon component with common props
export interface IconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export function createIconComponent(IconComponent: React.ComponentType<{ className?: string }>) {
  return function Icon({ className = '', size = 'md', color, ...props }: IconProps & any) {
    const sizeClass = sizeClasses[size as keyof typeof sizeClasses];
    const combinedClassName = `${sizeClass} ${className}`;
    const style = color ? { color } : undefined;

    return <IconComponent className={combinedClassName} style={style} {...props} />;
  };
}

// Pre-created icon components for common usage
export const IconComponents = {
  AddField: createIconComponent(FormBuilderIcons.AddField),
  Upload: createIconComponent(FormBuilderIcons.Upload),
  Camera: createIconComponent(FormBuilderIcons.Camera),
  Edit: createIconComponent(FormBuilderIcons.Edit),
  Delete: createIconComponent(FormBuilderIcons.Delete),
  Close: createIconComponent(NavigationIcons.Close),
  Success: createIconComponent(StatusIcons.Success),
  Error: createIconComponent(StatusIcons.Error),
  Warning: createIconComponent(StatusIcons.Warning),
  Info: createIconComponent(StatusIcons.Info),
  Search: createIconComponent(CommonIcons.Search),
  Settings: createIconComponent(CommonIcons.Settings),
};

export default Icons;
