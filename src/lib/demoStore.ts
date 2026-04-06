import type { FormDefinition, Submission } from '../types';

type DemoUser = { uid: string; email: string };
type DemoProfile = { id: string; email: string; full_name?: string; phone?: string; role?: string };

const KEY = {
  user: 'srs_demo_user',
  profiles: 'srs_demo_profiles',
  forms: 'srs_demo_forms',
  submissions: 'srs_demo_submissions'
} as const;

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const demoStore = {
  // ----- Auth -----
  getUser(): DemoUser | null {
    return readJson<DemoUser | null>(KEY.user, null);
  },
  setUser(user: DemoUser | null) {
    if (!user) localStorage.removeItem(KEY.user);
    else writeJson(KEY.user, user);
    window.dispatchEvent(new Event('srs-demo-auth'));
  },

  // ----- Profiles -----
  upsertProfile(profile: DemoProfile) {
    const profiles = readJson<DemoProfile[]>(KEY.profiles, []);
    const idx = profiles.findIndex((p) => p.id === profile.id || p.email.toLowerCase() === profile.email.toLowerCase());
    if (idx >= 0) profiles[idx] = { ...profiles[idx], ...profile };
    else profiles.push(profile);
    writeJson(KEY.profiles, profiles);
  },
  getProfileById(id: string): DemoProfile | null {
    const profiles = readJson<DemoProfile[]>(KEY.profiles, []);
    return profiles.find((p) => p.id === id) || null;
  },
  isAdminEmail(email: string): boolean {
    const profiles = readJson<DemoProfile[]>(KEY.profiles, []);
    const p = profiles.find((x) => x.email.toLowerCase() === email.toLowerCase());
    return (p?.role || '').toLowerCase() === 'admin';
  },

  // ----- Forms -----
  ensureSeed() {
    const existingForms = readJson<FormDefinition[]>(KEY.forms, []);
    if (existingForms.length === 0) {
      const seed: FormDefinition[] = [
        {
          id: crypto.randomUUID(),
          name: 'Field Incident Report',
          description: 'Universal incident intake form for field teams (offline-friendly).',
          is_active: true,
          fields: [
            { key: 'full_name', label: 'Full Name', type: 'text', required: true },
            { key: 'phone', label: 'Phone', type: 'text', required: true },
            { key: 'region', label: 'Region', type: 'text', required: true },
            {
              key: 'incident_type',
              label: 'Incident Type',
              type: 'select',
              required: true,
              options: ['Safety', 'Logistics', 'Health', 'Security', 'Other']
            },
            { key: 'summary', label: 'Summary', type: 'textarea', required: true },
            { key: 'occurred_on', label: 'Occurred On', type: 'date', required: false }
          ]
        }
      ];
      writeJson(KEY.forms, seed);
    }

    const existingSubs = readJson<Submission[]>(KEY.submissions, []);
    if (!Array.isArray(existingSubs)) writeJson(KEY.submissions, []);
  },

  listActiveForms(): FormDefinition[] {
    this.ensureSeed();
    return readJson<FormDefinition[]>(KEY.forms, []).filter((f) => f.is_active !== false);
  },

  // ----- Submissions -----
  insertSubmission(input: Omit<Submission, 'id' | 'created_at'>): Submission {
    this.ensureSeed();
    const all = readJson<Submission[]>(KEY.submissions, []);
    const now = new Date().toISOString();
    const record: Submission = {
      id: crypto.randomUUID(),
      created_at: now,
      ...input
    };
    all.unshift(record);
    writeJson(KEY.submissions, all);
    return record;
  },

  listSubmissions(): Submission[] {
    this.ensureSeed();
    return readJson<Submission[]>(KEY.submissions, []);
  },

  latestSubmissionByEmail(email: string): Submission | null {
    const all = this.listSubmissions();
    return all.find((s) => s.submitter_email.toLowerCase() === email.toLowerCase()) || null;
  },

  updateSubmissions(ids: string[], patch: Partial<Submission>) {
    const all = this.listSubmissions();
    const updated = all.map((s) => (ids.includes(s.id) ? { ...s, ...patch } : s));
    writeJson(KEY.submissions, updated);
  }
};

