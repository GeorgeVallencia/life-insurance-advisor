// src/components/Navigation.tsx
'use client';

import React from 'react';
import { Users, UserPlus } from 'lucide-react';

interface NavigationProps {
  currentView: 'registration' | 'leads';
  onViewChange: (view: 'registration' | 'leads') => void;
  leadsCount: number;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, leadsCount }) => {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-800">Leads System</h1>
      
      <div className="flex space-x-4">
        <button
          onClick={() => onViewChange('registration')}
          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
            currentView === 'registration'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Registration
        </button>

        <button
          onClick={() => onViewChange('leads')}
          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
            currentView === 'leads'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="h-4 w-4 mr-2" />
          Leads <span className="ml-2 bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded-full">{leadsCount}</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
