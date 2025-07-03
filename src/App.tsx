import React, { useState, useEffect } from 'react';
import { Activity, Heart } from 'lucide-react';
import { HouseOfficerForm } from './components/HouseOfficerForm';
import { Dashboard } from './components/Dashboard';
import { HouseOfficer } from './types';
import { loadHouseOfficers } from './utils/storage';

function App() {
  const [officers, setOfficers] = useState<HouseOfficer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedOfficers = loadHouseOfficers();
        setOfficers(savedOfficers);
      } catch (error) {
        console.error('Error loading officers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleOfficersUpdated = () => {
    const updatedOfficers = loadHouseOfficers();
    setOfficers(updatedOfficers);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
                FMC UMUAHIA, ABIA STATE
              </h1>
              <p className="text-lg sm:text-xl text-blue-600 font-semibold">
                DEPARTMENT OF INTERNAL MEDICINE
              </p>
              <p className="text-base sm:text-lg text-gray-600 font-medium">
                HOUSE OFFICERS CLINICAL FLOW
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HouseOfficerForm onOfficerAdded={handleOfficersUpdated} />
        
        {officers.length > 0 ? (
          <Dashboard officers={officers} onOfficersUpdated={handleOfficersUpdated} />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Welcome to the Clinical Flow System
            </h3>
            <p className="text-gray-600 mb-6">
              Start by adding your first house officer using the form above. 
              The dashboard will appear once you have added officers to track.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Features:</strong> Track rotations, manage presentations, 
                export reports, and integrate with Google Calendar.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            Built by <span className="font-semibold">Dr. Onyemachi Joseph</span>, 
            copyright <span className="font-semibold">2025</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Department of Internal Medicine • FMC Umuahia, Abia State
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;