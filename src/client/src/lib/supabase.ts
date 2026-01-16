import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tpmzseuakolatevgcsyp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwbXpzZXVha29sYXRldmdjc3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NTkxMDIsImV4cCI6MjA4NDEzNTEwMn0.FLs8MT9fsf4iJVcLfRyJCJqDMXI4xRajZJMonVj36ZQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
