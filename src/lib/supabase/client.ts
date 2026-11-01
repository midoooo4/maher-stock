import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xseppbwelknbygjzbzir.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZXBwYndlbGtuYnlnanpiemlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MjA1OTMsImV4cCI6MjEwOTA5NjU5M30.QKAh0XbhS65tLHzrXVdki9A3POvcbK9ZB0iJof_zHnA';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
