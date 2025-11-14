import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bebwclyyvdygylodctfe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlYndjbHl5dmR5Z3lsb2RjdGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzAzMjMsImV4cCI6MjA3ODY0NjMyM30.ZUut1tIGOFredhDCrChX_nuTZUmCfPeXDYD8SaMF8RY';

/**
 * Custom fetch implementation with a 15-second timeout.
 * This prevents the application from freezing indefinitely if a network request
 * (like a Supabase token refresh) hangs, which can happen in certain environments
 * like Vercel or behind specific proxies.
 * @param resource The URL to fetch.
 * @param options The initial request options.
 * @returns A Promise that resolves with the Response.
 */
const fetchWithTimeout = (resource: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const timeout = 15000; // 15 seconds

  return new Promise<Response>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      // This error message will be shown to the user if a page gets stuck loading.
      reject(new Error('A requisição demorou muito e foi cancelada. Verifique sua conexão.'));
    }, timeout);

    // The original AbortSignal from the pages is still passed in options.signal.
    // This ensures that navigation away from a page still cancels the fetch.
    fetch(resource, options)
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithTimeout,
  },
});