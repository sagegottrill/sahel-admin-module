import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { FormDefinition, FormField } from '../types';
import { dataClient } from '../lib/dataClient';

export default function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('selectedForm');
    if (stored) {
      setSelectedForm(JSON.parse(stored) as FormDefinition);
    }
  }, []);

  useEffect(() => {
    const hydrateFromProfile = async () => {
      if (!user?.uid) return;
      const profile = await dataClient.getUserProfile(user.uid);

      const base: Record<string, unknown> = {};
      if (profile?.full_name) base.full_name = profile.full_name;
      if (profile?.phone) base.phone = profile.phone;
      if (profile?.email) base.email = profile.email;
      if (user.email) base.email = user.email;
      setPayload((prev) => ({ ...base, ...prev }));
    };

    hydrateFromProfile();
  }, [user]);

  const fields: FormField[] = useMemo(() => selectedForm?.fields || [], [selectedForm]);

  const missingRequiredKeys = useMemo(() => {
    return fields
      .filter((f) => (f as any).required)
      .filter((f) => {
        const v = payload[f.key];
        return v === undefined || v === null || String(v).trim() === '';
      })
      .map((f) => f.key);
  }, [fields, payload]);

  const handleSubmit = async () => {
    if (!selectedForm) return;
    if (!user?.email) {
      navigate('/auth');
      return;
    }
    if (missingRequiredKeys.length > 0) {
      alert('Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const record = await dataClient.submit({
        form_id: selectedForm.id,
        submitter_email: user.email.toLowerCase(),
        submitter_user_id: user.uid,
        payload
      });
      setSubmittedId(record?.id || null);
      localStorage.removeItem('selectedForm');
    } catch (e) {
      console.error(e);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedForm) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">No form selected</h2>
          <p className="text-gray-600 mb-6">Choose a form to submit data.</p>
          <button
            onClick={() => navigate('/?view=jobs')}
            className="px-6 py-3 bg-brand-teal text-white rounded-lg font-semibold hover:bg-[#3d8568] transition-colors"
          >
            Browse forms
          </button>
        </div>
      </div>
    );
  }

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
          <h2 className="text-3xl font-bold text-[#1e3a5f] mb-2">Submission received</h2>
          <p className="text-gray-600 mb-6">Status: Pending (awaiting admin clearance).</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Submission ID</p>
            <p className="font-mono font-semibold text-brand-blue break-all">{submittedId}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[#1e3a5f] text-white py-3 rounded-lg font-semibold hover:bg-[#162c4b] transition-colors"
          >
            Go to Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">{selectedForm.name}</h1>
        {selectedForm.description ? <p className="text-gray-600 mb-8">{selectedForm.description}</p> : null}

        <div className="space-y-5">
          {fields.map((f) => {
            const value = payload[f.key] ?? '';

            if (f.type === 'select') {
              return (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {f.label}{f.required ? ' *' : ''}
                  </label>
                  <select
                    value={String(value)}
                    onChange={(e) => setPayload((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent"
                  >
                    <option value="">Select…</option>
                    {f.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              );
            }

            if (f.type === 'textarea') {
              return (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {f.label}{f.required ? ' *' : ''}
                  </label>
                  <textarea
                    value={String(value)}
                    onChange={(e) => setPayload((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent"
                  />
                </div>
              );
            }

            if (f.type === 'boolean') {
              return (
                <label key={f.key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => setPayload((p) => ({ ...p, [f.key]: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">{f.label}{f.required ? ' *' : ''}</span>
                </label>
              );
            }

            const inputType = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text';
            return (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {f.label}{f.required ? ' *' : ''}
                </label>
                <input
                  type={inputType}
                  value={String(value)}
                  onChange={(e) => setPayload((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a9d7e] focus:border-transparent"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => navigate('/?view=jobs')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-brand-teal text-white rounded-lg font-semibold hover:bg-[#3d8568] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

