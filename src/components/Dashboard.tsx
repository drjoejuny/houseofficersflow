import React, { useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Download, Filter, Search, Calendar, Users, TrendingUp, Edit, Trash2, Check, X, Database } from 'lucide-react';
import { HouseOfficer, FilterOptions } from '../types';
import { formatDate, isUpcoming, calculateSignOutDate, getTimelineColor, getDaysUntilDate } from '../utils/dateUtils';
import { generatePDF } from '../utils/pdfExport';
import { createBulkCalendarEvents } from '../utils/calendarIntegration';
import { updateHouseOfficer, deleteHouseOfficer } from '../utils/storage';
import { TimelineChart } from './TimelineChart';
import { PriorityAllocation } from './PriorityAllocation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Props {
  officers: HouseOfficer[];
  onOfficersUpdated: () => void;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

const UNITS = [
  'Cardiology 1',
  'Cardiology 2',
  'Nephrology',
  'Neurology',
  'Endocrinology',
  'Pulmonology',
  'Gastroenterology',
  'Infectious Disease/Dermatology',
  'Rheumatology'
];

export const Dashboard: React.FC<Props> = ({ officers, onOfficersUpdated }) => {
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signature, setSignature] = useState('');
  const [editingOfficer, setEditingOfficer] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<HouseOfficer>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    unit: '',
    gender: '',
    searchTerm: '',
    sortBy: 'fullName',
    sortOrder: 'asc'
  });

  const dashboardRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  // Filter and sort officers
  const filteredOfficers = officers
    .filter(officer => {
      const matchesUnit = !filters.unit || officer.unitAssigned === filters.unit;
      const matchesGender = !filters.gender || officer.gender === filters.gender;
      const matchesSearch = !filters.searchTerm || 
        officer.fullName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (officer.clinicalPresentationTopic && officer.clinicalPresentationTopic.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      return matchesUnit && matchesGender && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];
      const comparison = aValue.localeCompare(bValue);
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

  // Calculate statistics
  const stats = {
    total: filteredOfficers.length,
    male: filteredOfficers.filter(o => o.gender === 'Male').length,
    female: filteredOfficers.filter(o => o.gender === 'Female').length,
    upcomingPresentations: filteredOfficers.filter(o => o.clinicalPresentationDate && isUpcoming(o.clinicalPresentationDate)).length,
    upcomingSignOuts: filteredOfficers.filter(o => isUpcoming(o.expectedSignOutDate)).length
  };

  // Chart data
  const unitData = Object.entries(
    filteredOfficers.reduce((acc, officer) => {
      acc[officer.unitAssigned] = (acc[officer.unitAssigned] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([unit, count]) => ({ unit: unit.replace('/', '/\n'), count }));

  const barChartData = {
    labels: unitData.map(item => item.unit),
    datasets: [
      {
        label: 'Officers',
        data: unitData.map(item => item.count),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  const pieChartData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [stats.male, stats.female],
        backgroundColor: ['#3B82F6', '#EC4899'],
        borderColor: ['#2563EB', '#DB2777'],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const handleExportPDF = async () => {
    if (!signature.trim()) {
      alert('Please enter your full name as signature');
      return;
    }

    setIsExporting(true);

    const officersToExport = selectedOfficers.length > 0 
      ? filteredOfficers.filter(o => selectedOfficers.includes(o.id))
      : filteredOfficers;

    try {
      // Pass the charts container to include charts in PDF
      await generatePDF(officersToExport, signature, chartsRef.current || undefined);
      setShowSignatureModal(false);
      setSignature('');
      setSelectedOfficers([]);
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`PDF Export Failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleOfficerSelection = (officerId: string) => {
    setSelectedOfficers(prev => 
      prev.includes(officerId) 
        ? prev.filter(id => id !== officerId)
        : [...prev, officerId]
    );
  };

  const selectAllOfficers = () => {
    setSelectedOfficers(
      selectedOfficers.length === filteredOfficers.length 
        ? [] 
        : filteredOfficers.map(o => o.id)
    );
  };

  const startEditing = (officer: HouseOfficer) => {
    setEditingOfficer(officer.id);
    setEditFormData(officer);
  };

  const cancelEditing = () => {
    setEditingOfficer(null);
    setEditFormData({});
  };

  const saveOfficer = async () => {
    if (!editFormData.fullName?.trim() || !editFormData.unitAssigned) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedOfficer = {
      ...editFormData,
      expectedSignOutDate: editFormData.dateSignedIn ? calculateSignOutDate(editFormData.dateSignedIn) : editFormData.expectedSignOutDate
    } as HouseOfficer;

    try {
      await updateHouseOfficer(editingOfficer!, updatedOfficer);
      setEditingOfficer(null);
      setEditFormData({});
      onOfficersUpdated();
    } catch (error) {
      console.error('Error updating officer:', error);
      alert('Error updating officer. Please try again.');
    }
  };

  const handleDeleteOfficer = async (officerId: string, officerName: string) => {
    if (window.confirm(`Are you sure you want to delete ${officerName}? This action cannot be undone.`)) {
      try {
        await deleteHouseOfficer(officerId);
        setSelectedOfficers(prev => prev.filter(id => id !== officerId));
        onOfficersUpdated();
      } catch (error) {
        console.error('Error deleting officer:', error);
        alert('Error deleting officer. Please try again.');
      }
    }
  };

  const handleEditInputChange = (field: keyof HouseOfficer, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const units = [...new Set(officers.map(o => o.unitAssigned))];

  return (
    <div className="space-y-8">
      {/* Database Status Indicator */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Database Connected
            </p>
            <p className="text-xs text-green-600">
              Data is automatically synced across all your devices via Supabase
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Officers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">M</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Male</p>
              <p className="text-2xl font-bold text-gray-800">{stats.male}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-pink-600 font-bold">F</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Female</p>
              <p className="text-2xl font-bold text-gray-800">{stats.female}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Upcoming Presentations</p>
              <p className="text-2xl font-bold text-gray-800">{stats.upcomingPresentations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Upcoming Sign Outs</p>
              <p className="text-2xl font-bold text-gray-800">{stats.upcomingSignOuts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Allocation */}
      <PriorityAllocation officers={officers} />

      {/* Timeline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TimelineChart officers={officers} type="signout" />
        <TimelineChart officers={officers} type="presentation" />
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filters & Search</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search officers..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.unit}
            onChange={(e) => setFilters(prev => ({ ...prev, unit: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Units</option>
            {units.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>

          <select
            value={filters.gender}
            onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters(prev => ({ 
                ...prev, 
                sortBy: sortBy as FilterOptions['sortBy'], 
                sortOrder: sortOrder as FilterOptions['sortOrder']
              }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="fullName-asc">Name (A-Z)</option>
            <option value="fullName-desc">Name (Z-A)</option>
            <option value="dateSignedIn-asc">Sign In (Oldest)</option>
            <option value="dateSignedIn-desc">Sign In (Newest)</option>
            <option value="clinicalPresentationDate-asc">Presentation (Earliest)</option>
            <option value="clinicalPresentationDate-desc">Presentation (Latest)</option>
          </select>
        </div>
      </div>

      {/* Charts - This section will be captured for PDF */}
      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Officers by Unit</h3>
          <div className="h-80">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Gender Distribution</h3>
          <div className="h-80">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Officers Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">House Officers List</h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllOfficers}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                {selectedOfficers.length === filteredOfficers.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={() => createBulkCalendarEvents(
                  selectedOfficers.length > 0 
                    ? filteredOfficers.filter(o => selectedOfficers.includes(o.id))
                    : filteredOfficers
                )}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Add to Calendar
              </button>
              <button
                onClick={() => setShowSignatureModal(true)}
                disabled={isExporting}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export PDF with Charts ({selectedOfficers.length || filteredOfficers.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedOfficers.length === filteredOfficers.length && filteredOfficers.length > 0}
                    onChange={selectAllOfficers}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sign In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presentation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sign Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOfficers.map((officer) => (
                <tr key={officer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedOfficers.includes(officer.id)}
                      onChange={() => toggleOfficerSelection(officer.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOfficer === officer.id ? (
                      <input
                        type="text"
                        value={editFormData.fullName || ''}
                        onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{officer.fullName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOfficer === officer.id ? (
                      <select
                        value={editFormData.gender || ''}
                        onChange={(e) => handleEditInputChange('gender', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        officer.gender === 'Male' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {officer.gender}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOfficer === officer.id ? (
                      <select
                        value={editFormData.unitAssigned || ''}
                        onChange={(e) => handleEditInputChange('unitAssigned', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-gray-900">{officer.unitAssigned}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingOfficer === officer.id ? (
                      <input
                        type="text"
                        value={editFormData.clinicalPresentationTopic || ''}
                        onChange={(e) => handleEditInputChange('clinicalPresentationTopic', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={officer.clinicalPresentationTopic || 'Not specified'}>
                        {officer.clinicalPresentationTopic || <span className="text-gray-400 italic">Not specified</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOfficer === officer.id ? (
                      <input
                        type="date"
                        value={editFormData.dateSignedIn || ''}
                        onChange={(e) => handleEditInputChange('dateSignedIn', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{formatDate(officer.dateSignedIn)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOfficer === officer.id ? (
                      <input
                        type="date"
                        value={editFormData.clinicalPresentationDate || ''}
                        onChange={(e) => handleEditInputChange('clinicalPresentationDate', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className={`text-sm ${
                        officer.clinicalPresentationDate && isUpcoming(officer.clinicalPresentationDate) 
                          ? 'text-green-600 font-semibold' 
                          : 'text-gray-900'
                      }`}>
                        {officer.clinicalPresentationDate 
                          ? formatDate(officer.clinicalPresentationDate)
                          : <span className="text-gray-400 italic">Not scheduled</span>
                        }
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getTimelineColor(officer.expectedSignOutDate)}`}></div>
                      <div className={`text-sm ${isUpcoming(officer.expectedSignOutDate) ? 'text-orange-600 font-semibold' : 'text-gray-900'}`}>
                        {editFormData.dateSignedIn && editingOfficer === officer.id 
                          ? formatDate(calculateSignOutDate(editFormData.dateSignedIn))
                          : formatDate(officer.expectedSignOutDate)
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        ({getDaysUntilDate(officer.expectedSignOutDate)}d)
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {editingOfficer === officer.id ? (
                        <>
                          <button
                            onClick={saveOfficer}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                            title="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(officer)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                            title="Edit officer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOfficer(officer.id, officer.fullName)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            title="Delete officer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOfficers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No house officers found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Digital Signature Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please enter your full name as a digital signature for the PDF export. 
              The PDF will include beautiful charts and comprehensive data.
            </p>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSignatureModal(false);
                  setSignature('');
                }}
                disabled={isExporting}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExportPDF}
                disabled={!signature.trim() || isExporting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Exporting...
                  </>
                ) : (
                  'Export PDF with Charts'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};