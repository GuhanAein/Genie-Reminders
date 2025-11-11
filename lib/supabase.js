import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://izykdxzldmsadajbtevb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6eWtkeHpsZG1zYWRhamJ0ZXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjY1NjEsImV4cCI6MjA3ODQ0MjU2MX0.yb9ovIdEqYjKUbFDY0vaRa-tFY3DaLHtdoEQZwa12rI'; // User needs to provide this

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('reminders').select('count');
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
}

