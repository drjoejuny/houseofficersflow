import React from 'react';
import { HouseOfficer } from '../types';
import { getDaysUntilDate, getTimelineColor, getTimelineProgress, formatDate } from '../utils/dateUtils';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  officers: HouseOfficer[];
  type: 'signout' | 'presentation';
}

export const TimelineChart: React.FC<Props> = ({ officers, type }) => {
  const sortedOfficers = officers
    .filter(officer => type === 'signout' ? officer.expectedSignOutDate : officer.clinicalPresentationDate)
    .sort((a, b) => {
      const dateA = type === 'signout' ? a.expectedSignOutDate : a.clinicalPresentationDate;
      const dateB = type === 'signout' ? b.expectedSignOutDate : b.clinicalPresentationDate;
      return getDaysUntilDate(dateA) - getDaysUntilDate(dateB);
    });

  const title = type === 'signout' ? 'Sign-Out Timeline' : 'Presentation Timeline';
  const icon = type === 'signout' ? <Clock className="w-5 h-5" /> : <Calendar className="w-5 h-5" />;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>

      <div className="space-y-4">
        {sortedOfficers.map((officer) => {
          const targetDate = type === 'signout' ? officer.expectedSignOutDate : officer.clinicalPresentationDate;
          const daysUntil = getDaysUntilDate(targetDate);
          const colorClass = getTimelineColor(targetDate);
          const progress = getTimelineProgress(officer.dateSignedIn, targetDate);
          
          return (
            <div key={`${officer.id}-${type}`} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{officer.fullName}</span>
                  <span className="text-sm text-gray-500">({officer.unitAssigned})</span>
                  {daysUntil <= 7 && daysUntil >= 0 && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">
                    {formatDate(targetDate)}
                  </div>
                  <div className={`text-xs ${
                    daysUntil <= 7 && daysUntil >= 0 ? 'text-red-600 font-semibold' :
                    daysUntil <= 14 && daysUntil >= 0 ? 'text-yellow-600 font-semibold' :
                    daysUntil >= 0 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {daysUntil >= 0 ? `${daysUntil} days` : `${Math.abs(daysUntil)} days ago`}
                  </div>
                </div>
              </div>
              
              {/* Timeline Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${colorClass}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Started: {formatDate(officer.dateSignedIn)}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
              </div>

              {type === 'presentation' && officer.clinicalPresentationTopic && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Topic:</strong> {officer.clinicalPresentationTopic}
                </div>
              )}
            </div>
          );
        })}

        {sortedOfficers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No {type === 'signout' ? 'sign-out dates' : 'presentation dates'} scheduled</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>≤ 1 week</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>≤ 2 weeks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Future</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Past</span>
          </div>
        </div>
      </div>
    </div>
  );
};