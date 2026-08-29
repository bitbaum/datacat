'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormField } from '../../components/FormField';
import { Button } from '../../components/Button';
import { FieldConfig } from '../../types/form';

interface PublicForm {
  id: string;
  title: string;
  description: string;
  structure: {
    fields: FieldConfig[];
    // Add other structure properties if needed, e.g., isMultiStep
  };
}

const PublicFormPage = () => {
  const [form, setForm] = useState<PublicForm | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (!id) return;
    const fetchForm = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/forms/public/${id}`);
        if (res.status === 404) {
          setError('This form could not be found or has not been published.');
        } else if (!res.ok) {
          throw new Error('Failed to fetch form data.');
        } else {
          const data = await res.json();
          setForm(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    // @ts-ignore
    const inputValue = isCheckbox ? e.target.checked : value;
    setFormData((prev) => ({ ...prev, [name]: inputValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: id, data: formData }),
      });
      if (!res.ok) {
        throw new Error('Failed to submit the form. Please try again.');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p>Loading form...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-center p-4">
        <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">Thank You!</h2>
        <p className="text-lg text-gray-800 dark:text-gray-200">
          Your submission has been received successfully.
        </p>
      </div>
    );
  }

  if (!form) {
    return null; // Should be handled by loading/error states
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{form.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{form.description}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.structure.fields.map((field) => (
            <FormField
              key={field.id}
              {...field}
              value={formData[field.name] || ''}
              onChange={handleInputChange}
            />
          ))}
          <div className="pt-4">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit Form'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicFormPage;
