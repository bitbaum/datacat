'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Submission {
  id: string;
  data: Record<string, any>;
  submittedAt: string;
}

const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const { formId } = params;
  const { token } = useAuth();

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!formId || !token) return;

    const fetchSubmissions = async () => {
      setLoading(true);
      const url = new URL(`/api/v1/submissions/form/${formId}`, window.location.origin);
      if (search) url.searchParams.append('search', search);
      if (startDate) url.searchParams.append('startDate', startDate.toISOString());
      if (endDate) url.searchParams.append('endDate', endDate.toISOString());

      try {
        const res = await fetch(url.toString(), {
          headers: { 'x-auth-token': token },
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to fetch submissions.');
        }
        const data = await res.json();
        setSubmissions(data.submissions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = setTimeout(() => {
      fetchSubmissions();
    }, 500); // Debounce search input

    return () => clearTimeout(debounceFetch);
  }, [formId, token, search, startDate, endDate]);

  const downloadCSV = () => {
    const headers =
      submissions.length > 0 ? ['Submitted At', ...Object.keys(submissions[0].data)] : [];
    const csvRows = [
      headers.join(','),
      ...submissions.map((sub) => {
        const row = [
          new Date(sub.submittedAt).toLocaleString(),
          ...headers.slice(1).map((header) => JSON.stringify(sub.data[header] || '')),
        ];
        return row.join(',');
      }),
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${formId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tableHeaders =
    submissions.length > 0 ? ['Submitted At', ...Object.keys(submissions[0].data)] : [];

  if (loading) return <div className="p-8">Loading submissions...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Form Submissions</h1>

        {/* Filter and Export Controls */}
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <input
            type="search"
            placeholder="Search submissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow block w-full pl-4 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
          />
          <div className="flex items-center gap-2">
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date || undefined)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start Date"
              className="w-full pl-4 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date || undefined)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="End Date"
              className="w-full pl-4 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
          </div>
          <button
            onClick={downloadCSV}
            disabled={submissions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Download CSV
          </button>
        </div>

        {submissions.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                    {Object.keys(submission.data).map((key) => (
                      <td
                        key={key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200"
                      >
                        {String(submission.data[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">This form has no submissions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionsPage;
