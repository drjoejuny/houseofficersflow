export interface HouseOfficer {
  id: string;
  fullName: string;
  gender: 'Male' | 'Female';
  dateSignedIn: string;
  unitAssigned: string;
  clinicalPresentationTopic: string;
  clinicalPresentationDate: string;
  expectedSignOutDate: string;
  createdAt: string;
}

export interface DashboardStats {
  totalOfficers: number;
  unitDistribution: Record<string, number>;
  genderDistribution: Record<string, number>;
  upcomingPresentations: HouseOfficer[];
  upcomingSignOuts: HouseOfficer[];
}

export interface FilterOptions {
  unit: string;
  gender: string;
  searchTerm: string;
  sortBy: 'fullName' | 'dateSignedIn' | 'clinicalPresentationDate' | 'expectedSignOutDate';
  sortOrder: 'asc' | 'desc';
}