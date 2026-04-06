export const isDemoMode = (): boolean => {
  // Explicit opt-in always wins.
  if (import.meta.env.VITE_DEMO_MODE === '1') return true;

  // Auto-enable demo mode if required backend config is missing.
  const firebaseKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return !firebaseKey || !supabaseUrl || !supabaseKey;
};

