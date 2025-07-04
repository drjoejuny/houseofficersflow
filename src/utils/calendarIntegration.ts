import { HouseOfficer } from '../types';
import { formatDate } from './dateUtils';

export const createGoogleCalendarEvent = (officer: HouseOfficer, eventType: 'presentation' | 'signout'): void => {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  
  let title: string;
  let date: string;
  let details: string;
  
  if (eventType === 'presentation') {
    if (!officer.clinicalPresentationDate) {
      alert('No presentation date set for this officer');
      return;
    }
    title = `Clinical Presentation - ${officer.fullName}`;
    date = officer.clinicalPresentationDate;
    details = `House Officer: ${officer.fullName}%0AUnit: ${officer.unitAssigned}%0ATopic: ${officer.clinicalPresentationTopic || 'Not specified'}%0AGender: ${officer.gender}`;
  } else {
    title = `Sign Out - ${officer.fullName}`;
    date = officer.expectedSignOutDate;
    details = `House Officer: ${officer.fullName}%0AUnit: ${officer.unitAssigned}%0AExpected Sign Out Date (12 weeks from sign-in)%0AGender: ${officer.gender}`;
  }
  
  const startDate = date.replace(/-/g, '');
  const endDate = startDate;
  
  const calendarUrl = `${baseUrl}&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${details}&location=FMC%20Umuahia,%20Department%20of%20Internal%20Medicine`;
  
  window.open(calendarUrl, '_blank');
};

export const createBulkCalendarEvents = (officers: HouseOfficer[]): void => {
  officers.forEach((officer, index) => {
    if (officer.clinicalPresentationDate) {
      setTimeout(() => createGoogleCalendarEvent(officer, 'presentation'), index * 100);
    }
    setTimeout(() => createGoogleCalendarEvent(officer, 'signout'), (index * 100) + 50);
  });
};