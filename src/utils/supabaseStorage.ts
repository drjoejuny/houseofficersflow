import { supabase } from '../lib/supabase';
import { HouseOfficer } from '../types';

export const saveHouseOfficersToSupabase = async (officers: HouseOfficer[]): Promise<void> => {
  try {
    // Clear existing data and insert new data
    const { error: deleteError } = await supabase
      .from('house_officers')
      .delete()
      .neq('id', '');

    if (deleteError) throw deleteError;

    if (officers.length > 0) {
      const { error: insertError } = await supabase
        .from('house_officers')
        .insert(officers);

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    throw error;
  }
};

export const loadHouseOfficersFromSupabase = async (): Promise<HouseOfficer[]> => {
  try {
    const { data, error } = await supabase
      .from('house_officers')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading from Supabase:', error);
    throw error;
  }
};

export const addHouseOfficerToSupabase = async (officer: Omit<HouseOfficer, 'id' | 'createdAt'>): Promise<HouseOfficer> => {
  try {
    const newOfficer = {
      ...officer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('house_officers')
      .insert([newOfficer])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding to Supabase:', error);
    throw error;
  }
};

export const updateHouseOfficerInSupabase = async (id: string, updates: Partial<HouseOfficer>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('house_officers')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating in Supabase:', error);
    throw error;
  }
};

export const deleteHouseOfficerFromSupabase = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('house_officers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
};