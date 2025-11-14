import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bebwclyyvdygylodctfe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlYndjbHl5dmR5Z3lsb2RjdGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzAzMjMsImV4cCI6MjA3ODY0NjMyM30.ZUut1tIGOFredhDCrChX_nuTZUmCfPeXDYD8SaMF8RY';

// NOTE: The private key is for server-side operations only and should NEVER 
// be used in a frontend application. We will use the public anonymous key.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
