import { addMonths, format, parseISO, isAfter, isBefore, addDays } from 'date-fns';

export const calculateSignOutDate = (signInDate: string): string => {
  const date = parseISO(signInDate);
  const signOutDate = addMonths(date, 3);
  return format(signOutDate, 'yyyy-MM-dd');
};

export const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM dd, yyyy');
};

export const isUpcoming = (dateString: string, daysAhead: number = 7): boolean => {
  const date = parseISO(dateString);
  const now = new Date();
  const futureDate = addDays(now, daysAhead);
  return isAfter(date, now) && isBefore(date, futureDate);
};

export const sortByDate = (a: string, b: string, order: 'asc' | 'desc' = 'asc'): number => {
  const dateA = parseISO(a);
  const dateB = parseISO(b);
  const comparison = dateA.getTime() - dateB.getTime();
  return order === 'asc' ? comparison : -comparison;
};