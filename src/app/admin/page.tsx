
'use client'

import React, { useState } from 'react';
import LeadsManagementInterface from '@/components/LeadManagementInterface';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  DollarSign, 
  FileText, 
  Settings, 
  Menu,
  X,
  Bell,
  Search,
  ChevronDown
} from 'lucide-react';

// Mock components - replace with your actual components
const MainDashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <MessageSquare className="w-8 h-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Total Conversations</p>
            <p className="text-2xl font-bold">1,247</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <Users className="w-8 h-8 text-green-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Total Leads</p>
            <p className="text-2xl font-bold">342</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <DollarSign className="w-8 h-8 text-purple-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Quotes Generated</p>
            <p className="text-2xl font-bold">186</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <FileText className="w-8 h-8 text-orange-500" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold">14.2%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LeadManagement = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Lead Management</h1>
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <LeadsManagementInterface />
      </div>
      <div className="p-8 text-center text-gray-400">
        <Users className="w-16 h-16 mx-auto mb-4" />
        <p>Lead Management Interface</p>
      </div>
    </div>
  </div>
);

const ConversationManagement = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Conversations</h1>
    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
      <MessageSquare className="w-16 h-16 mx-auto mb-4" />
      <p>Conversation Management Interface</p>
    </div>
  </div>
);

const QuoteManagement = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Quote Management</h1>
    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
      <DollarSign className="w-16 h-16 mx-auto mb-4" />
      <p>Quote Management Interface</p>
    </div>
  </div>
);

const Reports = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Reports & Analytics</h1>
    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
      <FileText className="w-16 h-16 mx-auto mb-4" />
      <p>Reports & Analytics Interface</p>
    </div>
  </div>
);

const SettingsPage = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Settings</h1>
    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
      <Settings className="w-16 h-16 mx-auto mb-4" />
      <p>Settings Interface</p>
    </div>
  </div>
);

const AdminDashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: MainDashboard },
    { id: 'leads', label: 'Lead Management', icon: Users, component: LeadManagement },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare, component: ConversationManagement },
    { id: 'quotes', label: 'Quotes', icon: DollarSign, component: QuoteManagement },
    { id: 'reports', label: 'Reports', icon: FileText, component: Reports },
    { id: 'settings', label: 'Settings', icon: Settings, component: SettingsPage },
  ];

  const ActiveComponent = navigationItems.find(item => item.id === activeTab)?.component || MainDashboard;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white shadow-lg`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className={`font-bold text-xl text-gray-800 ${!sidebarOpen && 'hidden'}`}>
            Insurance Admin
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="mt-6">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                activeTab === item.id ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700' : 'text-gray-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {navigationItems.find(item => item.id === activeTab)?.label}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* User Menu */}
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">A</span>
                </div>
                {sidebarOpen && (
                  <>
                    <span className="text-sm text-gray-700">Admin User</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;