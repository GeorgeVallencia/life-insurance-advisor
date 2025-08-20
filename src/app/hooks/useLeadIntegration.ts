// hooks/useLeadIntegration.ts
import { useCallback } from 'react';
import { useLeadCapture } from './useLeadCapture';

interface ChatProfile {
  age?: number;
  income?: number;
  state?: string;
  gender?: string;
  smoker?: boolean;
  maritalStatus?: string;
  dependents?: number;
}

export const useLeadIntegration = () => {
  const { createLead } = useLeadCapture();
  
  const captureLeadFromChat = useCallback(async (
    userInfo: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
    profile: ChatProfile,
    quoteAmount?: number,
    premium?: number
  ) => {
    if (!userInfo.email || !userInfo.firstName || !userInfo.lastName) {
      return null; // Not enough info to create lead
    }
    
    try {
      const lead = await createLead({
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        phone: userInfo.phone,
        source: 'chat',
        profile,
        quoteAmount,
        premium,
      });
      
      return lead;
    } catch (error) {
      console.error('Failed to capture lead from chat:', error);
      return null;
    }
  }, [createLead]);
  
  const updateLeadFromQuote = useCallback
}