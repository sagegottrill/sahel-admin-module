import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isDemoMode } from './demoMode';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = (() => {
    if (isDemoMode()) return null;
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Missing Supabase environment variables. Demo mode should be enabled.');
        return null;
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
    });
})();
