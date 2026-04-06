import { supabase } from './supabase';
import { isDemoMode } from './demoMode';
import { demoStore } from './demoStore';
import type { FormDefinition, Submission } from '../types';

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Enable demo mode or set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
};

export const dataClient = {
  async listForms(): Promise<FormDefinition[]> {
    if (isDemoMode()) return demoStore.listActiveForms();
    const sb = requireSupabase();
    const { data, error } = await sb.from('forms').select('*').eq('is_active', true);
    if (error) throw error;
    return (data || []) as FormDefinition[];
  },

  async getUserProfile(userId: string): Promise<{ full_name?: string; phone?: string; email?: string } | null> {
    if (isDemoMode()) return demoStore.getProfileById(userId);
    const sb = requireSupabase();
    const { data } = await sb.from('users').select('*').eq('id', userId).single();
    return data || null;
  },

  async upsertUserProfile(profile: { id: string; email: string; full_name?: string; phone?: string; role?: string }) {
    if (isDemoMode()) {
      demoStore.upsertProfile(profile);
      return;
    }
    const sb = requireSupabase();
    // best-effort insert; real deployments should enforce via server-side auth
    await sb.from('users').insert([profile]);
  },

  async submit(form: { form_id: string; submitter_email: string; submitter_user_id?: string | null; payload: Record<string, unknown> }) {
    if (isDemoMode()) {
      const rec = demoStore.insertSubmission({
        form_id: form.form_id,
        submitter_email: form.submitter_email,
        submitter_user_id: form.submitter_user_id || null,
        status: 'Pending',
        payload: form.payload
      } as any);
      return rec;
    }
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('submissions')
      .insert([form])
      .select('*')
      .single();
    if (error) throw error;
    return data as Submission;
  },

  async latestSubmissionByEmail(email: string): Promise<Submission | null> {
    if (isDemoMode()) return demoStore.latestSubmissionByEmail(email);
    const sb = requireSupabase();
    const { data, error } = await sb.rpc('get_latest_submission_by_email', { email_input: email }).maybeSingle();
    if (error) throw error;
    return (data || null) as Submission | null;
  },

  async submissionsForAdmin(adminEmail: string): Promise<Submission[]> {
    if (isDemoMode()) {
      // In demo mode, any email ending with "@admin.local" is treated as admin unless a profile says otherwise.
      const profileAdmin = demoStore.isAdminEmail(adminEmail);
      const isAdmin = profileAdmin || adminEmail.toLowerCase().endsWith('@admin.local');
      return isAdmin ? demoStore.listSubmissions() : [];
    }

    // Keep paging behavior in caller; RPC supports range
    const sb = requireSupabase();
    const { data, error } = await sb.rpc('get_submissions_for_admin', { admin_email: adminEmail });
    if (error) throw error;
    return (data || []) as Submission[];
  },

  async clear(ids: string[], status: 'Approved' | 'Rejected', clearedByEmail: string) {
    if (isDemoMode()) {
      demoStore.updateSubmissions(ids, { status, cleared_at: new Date().toISOString(), cleared_by_email: clearedByEmail } as any);
      return;
    }
    const sb = requireSupabase();
    const { error } = await sb
      .from('submissions')
      .update({ status, cleared_at: new Date().toISOString(), cleared_by_email: clearedByEmail })
      .in('id', ids);
    if (error) throw error;
  }
};

