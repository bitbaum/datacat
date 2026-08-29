'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { http, ApiSuccess } from '../services/http';

interface ProfileUser {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role?: string;
}

export default function ProfilePage() {
  const { token, user, loading, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await http.get<ApiSuccess<{ user: ProfileUser }>>(
          '/api/v1/user/me',
          true,
          token,
        );
        setProfile(data.user);
        setName(data.user.name ?? '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler beim Laden des Profils');
      }
    };
    load();
  }, [token]);

  const onSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await http.put<ApiSuccess<{ user: ProfileUser }>>(
        '/api/v1/user/me',
        { name },
        true,
        token,
      );
      setProfile(data.user);
      setMessage('Profil aktualisiert');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Laden…</div>;
  }
  if (!token) {
    return <div className="p-6">Bitte zuerst anmelden.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Mein Profil</h1>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      {message && <div className="mb-3 text-sm text-green-600">{message}</div>}
      <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">E-Mail</label>
          <input
            disabled
            value={profile?.email ?? ''}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-400"
          >
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
