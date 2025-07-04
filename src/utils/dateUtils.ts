import { addWeeks, format, parseISO, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';

export const calculateSignOutDate = (signInDate: string): string => {
  const date = parseISO(signInDate);
  const signOutDate = addWeeks(date, 12); // 12 weeks = 84 days
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

export const getDaysUntilDate = (dateString: string): number => {
  const date = parseISO(dateString);
  const now = new Date();
  return differenceInDays(date, now);
};

export const getTimelineColor = (dateString: string): string => {
  const daysUntil = getDaysUntilDate(dateString);
  
  if (daysUntil <= 7 && daysUntil >= 0) {
    return 'bg-red-500'; // Within 1 week
  } else if (daysUntil <= 14 && daysUntil >= 0) {
    return 'bg-yellow-500'; // Within 2 weeks
  } else if (daysUntil >= 0) {
    return 'bg-green-500'; // Future
  } else {
    return 'bg-gray-400'; // Past
  }
};

export const getTimelineProgress = (signInDate: string, targetDate: string): number => {
  const signIn = parseISO(signInDate);
  const target = parseISO(targetDate);
  const now = new Date();
  
  const totalDuration = differenceInDays(target, signIn);
  const elapsed = differenceInDays(now, signIn);
  
  return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
};