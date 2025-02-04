import { createClient, SupabaseClient } from '@supabase/supabase-js';

// For server-side only
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Ensure URL is valid before creating client
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error('Invalid Supabase URL. Please check your VITE_SUPABASE_URL environment variable.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: Error) => {
  console.error('Supabase error:', error);
  throw new Error('An error occurred while processing your request');
};

// Helper function to transform dates in responses
export const transformDates = <T extends Record<string, any>>(data: T): T => {
  const result = { ...data } as T;
  Object.entries(result).forEach(([key, value]) => {
    if (value instanceof Date) {
      (result as any)[key] = value.toISOString();
    }
  });
  return result;
};