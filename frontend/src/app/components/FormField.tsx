import React from 'react';

interface BaseFieldProps {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  className?: string;
  error?: string | null;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
  options?: { value: string; label: string }[];
}

type FormFieldProps = BaseFieldProps & {
  type:
    | 'text'
    | 'email'
    | 'tel'
    | 'date'
    | 'select'
    | 'textarea'
    | 'checkbox'
    | 'radio'
    | 'number'
    | 'range'
    | 'file'
    | 'url'
    | 'password';
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  placeholder?: string;
  rows?: number;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  stepSize?: number;
  accept?: string;
  multiple?: boolean;
};

const baseInputClasses =
  'w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-700/50 dark:text-white transition-all duration-200 backdrop-blur-sm';
const baseLabelClasses = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2';

const getInputClasses = (hasError: boolean) => {
  if (hasError) {
    return `${baseInputClasses} border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10`;
  }
  return `${baseInputClasses} border-gray-200 dark:border-gray-600 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50/50 dark:bg-gray-800/50`;
};

export function FormField(props: FormFieldProps) {
  const { id, name, label, required, className = '', error, onBlur } = props;
  const isFullWidth = props.type === 'textarea';
  const hasError = !!error;

  const renderField = () => {
    switch (props.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'date':
        return (
          <input
            type={props.type}
            id={id}
            name={name}
            value={props.value}
            onChange={props.onChange}
            onBlur={onBlur}
            placeholder={props.placeholder}
            required={required}
            className={`${getInputClasses(hasError)} ${className}`}
          />
        );

      case 'select': {
        const options = props.options || [];
        return (
          <select
            id={id}
            name={name}
            value={props.value}
            onChange={props.onChange}
            onBlur={onBlur}
            required={required}
            className={`${getInputClasses(hasError)} ${className}`}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      case 'textarea':
        return (
          <textarea
            id={id}
            name={name}
            value={props.value}
            onChange={props.onChange}
            onBlur={onBlur}
            placeholder={props.placeholder}
            rows={props.rows || 3}
            required={required}
            className={`${getInputClasses(hasError)} ${className}`}
          />
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={id}
            name={name}
            checked={props.value === 'true'}
            onChange={(e) => {
              const mockEvent = {
                target: { name, value: e.target.checked ? 'true' : 'false' },
              } as React.ChangeEvent<HTMLInputElement>;
              props.onChange(mockEvent);
            }}
            onBlur={onBlur}
            required={required}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        );

      case 'radio': {
        const options = props.options || [];
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`${id}-${option.value}`}
                  name={name}
                  value={option.value}
                  checked={props.value === option.value}
                  onChange={props.onChange}
                  onBlur={onBlur}
                  required={required}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor={`${id}-${option.value}`}
                  className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
      }

      case 'number':
        return (
          <input
            type="number"
            id={id}
            name={name}
            value={props.value}
            onChange={props.onChange}
            onBlur={onBlur}
            placeholder={props.placeholder}
            min={props.min}
            max={props.max}
            required={required}
            className={`${getInputClasses(hasError)} ${className}`}
          />
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              id={id}
              name={name}
              value={props.value || props.min || 0}
              onChange={props.onChange}
              onBlur={onBlur}
              min={props.min || 0}
              max={props.max || 100}
              step={props.stepSize || 1}
              required={required}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{props.min || 0}</span>
              <span className="font-medium">{props.value || props.min || 0}</span>
              <span>{props.max || 100}</span>
            </div>
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            id={id}
            name={name}
            onChange={props.onChange}
            onBlur={onBlur}
            accept={props.accept}
            multiple={props.multiple}
            required={required}
            className={`${getInputClasses(hasError)} ${className} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
          />
        );

      case 'url':
      case 'password':
        return (
          <input
            type={props.type}
            id={id}
            name={name}
            value={props.value}
            onChange={props.onChange}
            onBlur={onBlur}
            placeholder={props.placeholder}
            required={required}
            className={`${getInputClasses(hasError)} ${className}`}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${isFullWidth ? 'md:col-span-2' : ''} group`}>
      <label
        htmlFor={id}
        className={`${baseLabelClasses} group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors duration-200`}
      >
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {renderField()}
        {!error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 flex items-center space-x-1 animate-fade-in">
          <svg
            className="w-4 h-4 text-red-500 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
