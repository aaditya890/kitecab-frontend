/**
 * Production settings. Only PUBLIC values belong here — this file ships to every browser.
 * Secret keys live in kitecab-backend (Vercel environment variables), never here.
 */
export const environment = {
  production: true,
  /** Search engines may index this build (false for staging/test builds). */
  indexable: true,
  siteUrl: 'https://kitecab.com',
  /** kitecab-backend on Vercel. TODO: set the real URL after the first Vercel deploy. */
  apiUrl: 'https://kitecab-backend.vercel.app/api',
  supabaseUrl: 'https://zakyzpxuqdkhrrhgwccn.supabase.co',
  /** Supabase anon/publishable key — public by design; database rules (RLS) protect the data. */
  supabaseKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpha3l6cHh1cWRraHJyaGd3Y2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2Mzc4NjMsImV4cCI6MjA0NjIxMzg2M30.zT_S6pxhT8XsWGN1RdVqteSjS8hYwrNMAHPcbiRaauQ',
};
