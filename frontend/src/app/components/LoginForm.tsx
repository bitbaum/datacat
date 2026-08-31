'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { http, ApiSuccess } from '../services/http';
import { ROUTES } from '@/lib/routes';

interface LoginFormProps {
  onSuccess?: () => void; // Optional callback for successful login
  showRegisterLink?: boolean; // Whether to show register link
  className?: string; // Additional styling
}

export function LoginForm({ onSuccess, showRegisterLink = true, className = '' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithCredentials } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const ok = await loginWithCredentials(email, password);
      if (!ok) throw new Error('Invalid credentials');

      // Call optional success callback (for modal usage)
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800 ${className}`}
    >
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Anmelden</h2>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="E-Mail-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {loading ? 'Anmeldung…' : 'Anmelden'}
          </button>
        </div>
      </form>
      {showRegisterLink && (
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Noch kein Konto?{' '}
          <Link
            href={ROUTES.register}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Registrieren
          </Link>
        </p>
      )}
    </div>
  );
}
