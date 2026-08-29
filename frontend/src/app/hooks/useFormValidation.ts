import { useState, useCallback } from 'react';
import { FieldConfig } from '../types/form';

export interface ValidationError {
  field: string;
  message: string;
}

export function useFormValidation(fields: FieldConfig[]) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: FieldConfig, value: string): ValidationError | null => {
    // Required field validation
    if (field.required && (!value || value.trim() === '')) {
      return {
        field: field.name,
        message: `${field.label} ist erforderlich`,
      };
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') {
      return null;
    }

    // Email validation
    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return {
          field: field.name,
          message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        };
      }
    }

    // Phone validation
    if (field.type === 'tel') {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
      if (!phoneRegex.test(value)) {
        return {
          field: field.name,
          message: 'Bitte geben Sie eine gültige Telefonnummer ein',
        };
      }
    }

    // Date validation
    if (field.type === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return {
          field: field.name,
          message: 'Bitte geben Sie ein gültiges Datum ein',
        };
      }
    }

    // Text length validation
    if (field.type === 'text' || field.type === 'textarea') {
      if (value.length < 2) {
        return {
          field: field.name,
          message: `${field.label} muss mindestens 2 Zeichen enthalten`,
        };
      }
      if (value.length > 500) {
        return {
          field: field.name,
          message: `${field.label} darf maximal 500 Zeichen enthalten`,
        };
      }
    }

    return null;
  }, []);

  const validateForm = useCallback(
    (formData: Record<string, string>) => {
      const newErrors: Record<string, string> = {};

      fields.forEach((field) => {
        const value = formData[field.name] || '';
        const error = validateField(field, value);
        if (error) {
          newErrors[field.name] = error.message;
        } else {
          newErrors[field.name] = '';
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors);
    },
    [fields, validateField],
  );

  const validateSingleField = useCallback(
    (fieldName: string, value: string) => {
      const field = fields.find((f) => f.name === fieldName);
      if (!field) return '';

      const error = validateField(field, value);

      const newErrors = { ...errors };
      if (error) {
        newErrors[fieldName] = error.message;
      } else {
        newErrors[fieldName] = '';
      }

      setErrors(newErrors);
      return newErrors[fieldName];
    },
    [fields, errors, validateField],
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getFieldError = (fieldName: string) => errors[fieldName];
  const hasErrors = Object.values(errors).some((error) => error);

  return { validateForm, validateSingleField, getFieldError, hasErrors, errors, clearErrors };
}
