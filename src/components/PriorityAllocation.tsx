import React from 'react';
import { HouseOfficer } from '../types';
import { AlertTriangle, CheckCircle, Users, Target } from 'lucide-react';

interface Props {
  officers: HouseOfficer[];
}

const PRIORITY_UNITS = [
  { name: 'Nephrology', required: 3, priority: 1 },
  { name: 'Neurology', required: 2, priority: 2 },
  { name: 'Endocrinology', required: 2, priority: 3 },
  { name: 'Gastroenterology', required: 2, priority: 4 },
];

export const PriorityAllocation: React.FC<Props> = ({ officers }) => {
  const unitCounts = officers.reduce((acc, officer) => {
    acc[officer.unitAssigned] = (acc[officer.unitAssigned] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalRequired = PRIORITY_UNITS.reduce((sum, unit) => sum + unit.required, 0);
  const totalAssigned = PRIORITY_UNITS.reduce((sum, unit) => sum + (unitCounts[unit.name] || 0), 0);
  const completionPercentage = Math.round((totalAssigned / totalRequired) * 100);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Priority Unit Allocation</h3>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">Overall Progress</span>
          <span className="text-sm font-bold text-blue-800">{totalAssigned}/{totalRequired} officers</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-blue-600 mt-1">{completionPercentage}% complete</div>
      </div>

      {/* Priority Units */}
      <div className="space-y-4">
        {PRIORITY_UNITS.map((unit) => {
          const assigned = unitCounts[unit.name] || 0;
          const isComplete = assigned >= unit.required;
          const shortage = Math.max(0, unit.required - assigned);
          const progressPercentage = Math.min((assigned / unit.required) * 100, 100);

          return (
            <div 
              key={unit.name} 
              className={`border-2 rounded-lg p-4 transition-all ${
                isComplete 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <h4 className={`font-semibold ${
                      isComplete ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {unit.name}
                    </h4>
                    <p className="text-xs text-gray-600">Priority #{unit.priority}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    isComplete ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {assigned}/{unit.required}
                  </div>
                  {shortage > 0 && (
                    <div className="text-xs text-red-600 font-medium">
                      Need {shortage} more
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className={`w-full rounded-full h-2 ${
                  isComplete ? 'bg-green-200' : 'bg-red-200'
                }`}>
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isComplete ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Assigned Officers */}
              {assigned > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Assigned Officers:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {officers
                      .filter(officer => officer.unitAssigned === unit.name)
                      .map(officer => (
                        <span 
                          key={officer.id}
                          className={`px-2 py-1 text-xs rounded-full ${
                            officer.gender === 'Male' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {officer.fullName}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{totalAssigned}</div>
            <div className="text-sm text-gray-600">Total Assigned</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{totalRequired - totalAssigned}</div>
            <div className="text-sm text-gray-600">Still Needed</div>
          </div>
        </div>
      </div>
    </div>
  );
};