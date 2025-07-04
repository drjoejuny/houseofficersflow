import { createClient } from '@supabase/supabase-js';
import { HouseOfficer } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      house_officers: {
        Row: HouseOfficer;
        Insert: Omit<HouseOfficer, 'id' | 'createdAt'>;
        Update: Partial<Omit<HouseOfficer, 'id'>>;
      };
    };
  };
}