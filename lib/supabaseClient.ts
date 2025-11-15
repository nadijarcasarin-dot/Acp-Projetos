import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bebwclyyvdygylodctfe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlYndjbHl5dmR5Z3lsb2RjdGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzAzMjMsImV4cCI6MjA3ODY0NjMyM30.ZUut1tIGOFredhDCrChX_nuTZUmCfPeXDYD8SaMF8RY';

/**
 * Custom fetch implementation with a robust 15-second timeout using AbortController.
 * This actively cancels the network request if it takes too long, preventing the browser's
 * connection pool from being exhausted by hanging requests (e.g., failed token refreshes).
 * This is the definitive fix for the intermittent application freezes.
 * @param resource The URL to fetch.
 * @param options The initial request options.
 * @returns A Promise that resolves with the Response.
 */
const fetchWithTimeout = async (resource: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const timeout = 15000; // 15 seconds

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Combine the timeout signal with any signal passed from the calling function (e.g., from a page's useEffect cleanup)
  const signal = options.signal;
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      // This error message will be shown to the user if a page gets stuck loading.
      throw new Error('A requisição demorou muito e foi cancelada. Verifique sua conexão.');
    }
    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithTimeout,
  },
});