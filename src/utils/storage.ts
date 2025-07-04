import { HouseOfficer } from '../types';
import { 
  loadHouseOfficersFromSupabase, 
  addHouseOfficerToSupabase, 
  updateHouseOfficerInSupabase, 
  deleteHouseOfficerFromSupabase 
} from './supabaseStorage';

const STORAGE_KEY = 'house_officers_data';

// Local storage fallback functions
const saveToLocalStorage = (officers: HouseOfficer[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(officers));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromLocalStorage = (): HouseOfficer[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return [];
  }
};

// Main functions that try Supabase first, fallback to localStorage
export const saveHouseOfficers = (officers: HouseOfficer[]): void => {
  saveToLocalStorage(officers);
};

export const loadHouseOfficers = async (): Promise<HouseOfficer[]> => {
  try {
    // Try Supabase first
    const supabaseData = await loadHouseOfficersFromSupabase();
    
    // If we have Supabase data, sync it to localStorage and return it
    if (supabaseData.length > 0) {
      saveToLocalStorage(supabaseData);
      return supabaseData;
    }
    
    // If no Supabase data, check localStorage
    const localData = loadFromLocalStorage();
    return localData;
  } catch (error) {
    console.error('Error loading from Supabase, falling back to localStorage:', error);
    return loadFromLocalStorage();
  }
};

export const addHouseOfficer = async (officer: HouseOfficer): Promise<void> => {
  try {
    // Try Supabase first
    await addHouseOfficerToSupabase(officer);
    
    // Also save to localStorage as backup
    const localOfficers = loadFromLocalStorage();
    localOfficers.push(officer);
    saveToLocalStorage(localOfficers);
  } catch (error) {
    console.error('Error adding to Supabase, saving to localStorage only:', error);
    
    // Fallback to localStorage only
    const localOfficers = loadFromLocalStorage();
    localOfficers.push(officer);
    saveToLocalStorage(localOfficers);
  }
};

export const updateHouseOfficer = async (id: string, updatedOfficer: Partial<HouseOfficer>): Promise<void> => {
  try {
    // Try Supabase first
    await updateHouseOfficerInSupabase(id, updatedOfficer);
    
    // Also update localStorage
    const localOfficers = loadFromLocalStorage();
    const index = localOfficers.findIndex(officer => officer.id === id);
    if (index !== -1) {
      localOfficers[index] = { ...localOfficers[index], ...updatedOfficer };
      saveToLocalStorage(localOfficers);
    }
  } catch (error) {
    console.error('Error updating in Supabase, updating localStorage only:', error);
    
    // Fallback to localStorage only
    const localOfficers = loadFromLocalStorage();
    const index = localOfficers.findIndex(officer => officer.id === id);
    if (index !== -1) {
      localOfficers[index] = { ...localOfficers[index], ...updatedOfficer };
      saveToLocalStorage(localOfficers);
    }
  }
};

export const deleteHouseOfficer = async (id: string): Promise<void> => {
  try {
    // Try Supabase first
    await deleteHouseOfficerFromSupabase(id);
    
    // Also delete from localStorage
    const localOfficers = loadFromLocalStorage();
    const filteredOfficers = localOfficers.filter(officer => officer.id !== id);
    saveToLocalStorage(filteredOfficers);
  } catch (error) {
    console.error('Error deleting from Supabase, deleting from localStorage only:', error);
    
    // Fallback to localStorage only
    const localOfficers = loadFromLocalStorage();
    const filteredOfficers = localOfficers.filter(officer => officer.id !== id);
    saveToLocalStorage(filteredOfficers);
  }
};