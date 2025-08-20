// src/types/index.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  age?: number;
  income?: number;
  state?: string;
  gender?: 'male' | 'female';
  smoker?: boolean;
  maritalStatus?: string;
  dependents?: number;
  mortgage?: number;
  studentLoans?: number;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  status?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastActiveAt?: Date | string;
}

export interface InitialProfile {
  age?: number;
  income?: number;
  state?: string;
  gender?: 'male' | 'female';
  smoker?: boolean;
  maritalStatus?: string;
  dependents?: number;
  mortgage?: number;
  studentLoans?: number;
}

export interface UserRegistrationProps {
  onUserRegistered?: (user: User) => void;
  sessionId?: string;
  initialProfile?: InitialProfile;
}

export interface ApiResponse<T = any> {
  success: boolean;
  user?: User;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatInterfaceProps {
  user: User | null;
  sessionId: string;
  isGuestMode?: boolean;
}