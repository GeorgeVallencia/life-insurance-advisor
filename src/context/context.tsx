import React, { useState, createContext, useContext, ReactNode } from 'react';

// Types
export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST';
export type Gender = 'MALE' | 'FEMALE';

export interface Lead {
  id: number;
  sessionId: string;
  userId?: string;
  conversationId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  age?: number;
  income?: number;
  dependents?: number;
  coverageAmount?: number;
  mortgage?: number;
  studentLoans?: number;
  maritalStatus?: string;
  gender?: Gender;
  smoker?: boolean;
  state?: string;
  concerns?: string[];
  status: LeadStatus;
  source: string;
  notes?: string;
  assignedTo?: string;
  priority: number;
  lastContacted?: string;
  followUpDate?: string;
  conversionDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface LeadActivity {
  id: number;
  leadId: number;
  activityType: 'call' | 'email' | 'note' | 'status_change';
  description: string;
  performedBy?: string;
  createdAt: string;
}

export interface UserType {
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
  createdAt: string;
}


interface DataProviderProps {
  children: ReactNode;
}

// Data Context
interface DataContextType {
  leads: Lead[];
  activities: LeadActivity[];
  users: UserType[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLead: (id: number, updates: Partial<Lead>) => void;
  addActivity: (activity: Omit<LeadActivity, 'id' | 'createdAt'>) => void;
  addUser: (user: Omit<UserType, 'id' | 'createdAt'>) => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: DataProviderProps): JSX.Element => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLeads(prev => [...prev, newLead]);
  };

  const updateLead = (id: number, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id 
        ? { ...lead, ...updates, updatedAt: new Date().toISOString() }
        : lead
    ));
  };

  const addActivity = (activityData: Omit<LeadActivity, 'id' | 'createdAt'>) => {
    const newActivity: LeadActivity = {
      ...activityData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    setActivities(prev => [...prev, newActivity]);
  };

  const addUser = (userData: Omit<UserType, 'id' | 'createdAt'>) => {
    const newUser: UserType = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);

    // Automatically create a lead from the registered user
    const sessionId = `session_${Date.now()}`;
    addLead({
      sessionId,
      userId: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone || '',
      age: newUser.age,
      income: newUser.income,
      gender: newUser.gender?.toUpperCase() as Gender,
      smoker: newUser.smoker,
      state: newUser.state,
      status: 'NEW',
      source: 'registration',
      priority: 2,
      concerns: ['general inquiry']
    });
  };

  return (
    <DataContext.Provider 
      value={{
        leads,
        activities,
        users,
        addLead,
        updateLead,
        addActivity,
        addUser
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};