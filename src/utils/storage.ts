import { HouseOfficer } from '../types';

const STORAGE_KEY = 'house_officers_data';

export const saveHouseOfficers = (officers: HouseOfficer[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(officers));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadHouseOfficers = (): HouseOfficer[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return [];
  }
};

export const addHouseOfficer = (officer: HouseOfficer): void => {
  const officers = loadHouseOfficers();
  officers.push(officer);
  saveHouseOfficers(officers);
};

export const updateHouseOfficer = (id: string, updatedOfficer: Partial<HouseOfficer>): void => {
  const officers = loadHouseOfficers();
  const index = officers.findIndex(officer => officer.id === id);
  if (index !== -1) {
    officers[index] = { ...officers[index], ...updatedOfficer };
    saveHouseOfficers(officers);
  }
};

export const deleteHouseOfficer = (id: string): void => {
  const officers = loadHouseOfficers();
  const filteredOfficers = officers.filter(officer => officer.id !== id);
  saveHouseOfficers(filteredOfficers);
};