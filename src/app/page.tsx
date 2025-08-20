// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { DataProvider, useData } from '@/context/context';
import UserRegistration from '@/components/UserRegistration';
import ChatInterface from '@/components/ChatInterface';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'registration' | 'chat'>('registration');
  const { addUser } = useData();
  const [activeUser, setActiveUser] = useState<any | null>(null);

  // const handleUserRegistered = (userData: any) => {
  //   const newUserId = addUser(userData);
  //   const fullUser = { ...userData, id: newUserId };

  //   setActiveUser(fullUser);
  //   setCurrentView('chat'); // ✅ redirect to chat
  // };

  const handleUserRegistered = async (userData: any) => {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!res.ok) throw new Error('Failed to create user');

    const savedUser = await res.json();

    setActiveUser(savedUser.user.id);
    setCurrentView('chat'); // redirect after signup
  } catch (err) {
    console.error(err);
    alert('Registration failed');
  }
};


  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8">
        {currentView === 'registration' && (
          <UserRegistration
            onComplete={() => setCurrentView('chat')}
            onUserRegistered={handleUserRegistered}
          />
        )}

        {currentView === 'chat' && activeUser && (
          <ChatInterface user={activeUser} />
        )}
      </main>
    </div>
  );
};

const IntegratedLeadsSystem: React.FC = () => {
  return (
    <DataProvider>
      <App />
    </DataProvider>
  );
};

export default IntegratedLeadsSystem;
