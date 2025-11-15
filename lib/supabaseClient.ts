import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bebwclyyvdygylodctfe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlYndjbHl5dmR5Z3lsb2RjdGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzAzMjMsImV4cCI6MjA3ODY0NjMyM30.ZUut1tIGOFredhDCrChX_nuTZUmCfPeXDYD8SaMF8RY';

// Reverted to the standard client initialization.
// The global fetch timeout was causing critical issues with Supabase's internal operations
// like auth refresh and realtime connections, leading to application freezes.
// Timeouts are now handled at the page/component level where the data is fetched.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);