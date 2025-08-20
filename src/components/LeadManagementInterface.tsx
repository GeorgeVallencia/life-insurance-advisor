import React, { useState, useEffect } from 'react';
import { Search, Filter, Phone, Mail, User, Calendar, DollarSign, Users, FileText, CheckCircle, XCircle, Clock, AlertCircle, Plus, Edit3 } from 'lucide-react';

// Match Prisma schema types
type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST';
type Gender = 'MALE' | 'FEMALE';

interface Lead {
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

interface LeadActivity {
  id: number;
  leadId: number;
  activityType: 'call' | 'email' | 'note' | 'status_change';
  description: string;
  performedBy?: string;
  createdAt: string;
}

const LeadsManagementSystem = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState<LeadStatus>('NEW');
  const [followUpDate, setFollowUpDate] = useState('');
  const [showActivities, setShowActivities] = useState(false);
  const [activities, setActivities] = useState<LeadActivity[]>([]);

  // Enhanced mock data matching Prisma schema
  const mockLeads: Lead[] = [
    {
      id: 1,
      sessionId: "session_123",
      email: "john.doe@email.com",
      firstName: "John",
      lastName: "Doe",
      phone: "(555) 123-4567",
      age: 29,
      income: 75000,
      dependents: 1,
      coverageAmount: 500000,
      mortgage: 250000,
      studentLoans: 15000,
      maritalStatus: "married",
      gender: "MALE",
      smoker: false,
      state: "CA",
      concerns: ["family protection", "mortgage coverage"],
      status: "NEW",
      source: "website",
      notes: "Interested in term life insurance",
      priority: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      sessionId: "session_124",
      email: "jane.smith@email.com",
      firstName: "Jane",
      lastName: "Smith",
      phone: "(555) 987-6543",
      age: 32,
      income: 68000,
      dependents: 2,
      coverageAmount: 750000,
      mortgage: 180000,
      maritalStatus: "married",
      gender: "FEMALE",
      smoker: false,
      state: "TX",
      concerns: ["children's future", "debt coverage"],
      status: "CONTACTED",
      source: "website",
      notes: "Follow up scheduled for next week",
      priority: 1,
      lastContacted: new Date(Date.now() - 86400000).toISOString(),
      followUpDate: new Date(Date.now() + 604800000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 3,
      sessionId: "session_125",
      email: "mike.johnson@email.com",
      firstName: "Mike",
      lastName: "Johnson",
      phone: "(555) 456-7890",
      age: 27,
      income: 82000,
      dependents: 0,
      coverageAmount: 400000,
      maritalStatus: "single",
      gender: "MALE",
      smoker: false,
      state: "NY",
      concerns: ["future planning"],
      status: "CONVERTED",
      source: "website",
      notes: "Purchased State Farm policy - $65/month",
      priority: 3,
      conversionDate: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 4,
      sessionId: "session_126",
      email: "sarah.wilson@email.com",
      firstName: "Sarah",
      lastName: "Wilson",
      phone: "(555) 789-0123",
      age: 34,
      income: 95000,
      dependents: 3,
      coverageAmount: 1000000,
      mortgage: 320000,
      maritalStatus: "married",
      gender: "FEMALE",
      smoker: false,
      state: "FL",
      concerns: ["family protection", "mortgage coverage", "education fund"],
      status: "NEW",
      source: "website",
      priority: 1,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      updatedAt: new Date(Date.now() - 10800000).toISOString()
    },
    {
      id: 5,
      sessionId: "session_127",
      email: "david.brown@email.com",
      firstName: "David",
      lastName: "Brown",
      phone: "(555) 234-5678",
      age: 30,
      income: 72000,
      dependents: 1,
      coverageAmount: 600000,
      mortgage: 200000,
      maritalStatus: "married",
      gender: "MALE",
      smoker: true,
      state: "OH",
      status: "LOST",
      source: "website",
      notes: "Not interested - budget constraints",
      priority: 4,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const mockActivities: LeadActivity[] = [
    {
      id: 1,
      leadId: 2,
      activityType: 'call',
      description: 'Initial contact call - discussed coverage needs',
      performedBy: 'agent@company.com',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 2,
      leadId: 2,
      activityType: 'email',
      description: 'Sent follow-up email with quote comparison',
      performedBy: 'agent@company.com',
      createdAt: new Date(Date.now() - 43200000).toISOString()
    }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLeads(mockLeads);
      setActivities(mockActivities);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusIcon = (status: LeadStatus) => {
    switch (status) {
      case 'NEW': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'CONTACTED': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'CONVERTED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'LOST': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'CONTACTED': return 'bg-yellow-100 text-yellow-800';
      case 'CONVERTED': return 'bg-green-100 text-green-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-blue-100 text-blue-800';
      case 4: return 'bg-gray-100 text-gray-800';
      case 5: return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Urgent';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      case 5: return 'Very Low';
      default: return 'Medium';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateLead = async (leadId: number, status: LeadStatus, notes: string, followUpDate?: string) => {
    const updateData: Partial<Lead> = {
      status,
      notes,
      updatedAt: new Date().toISOString(),
      ...(followUpDate && { followUpDate }),
      ...(status === 'CONTACTED' && !leads.find(l => l.id === leadId)?.lastContacted && {
        lastContacted: new Date().toISOString()
      }),
      ...(status === 'CONVERTED' && { conversionDate: new Date().toISOString() })
    };

    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, ...updateData } : lead
    ));

    // Add activity record
    const newActivity: LeadActivity = {
      id: Date.now(),
      leadId,
      activityType: 'status_change',
      description: `Status changed to ${status}${notes ? ` - ${notes}` : ''}`,
      performedBy: 'current_user@company.com',
      createdAt: new Date().toISOString()
    };
    
    setActivities(prev => [...prev, newActivity]);
    setShowModal(false);
    setSelectedLead(null);
  };

  const openModal = (lead: Lead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setNotes(lead.notes || '');
    setFollowUpDate(lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '');
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusCount = (status: LeadStatus) => {
    return leads.filter(lead => lead.status === status).length;
  };

  const getLeadActivities = (leadId: number) => {
    return activities.filter(activity => activity.leadId === leadId);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Management</h1>
        <p className="text-gray-600">Track and manage your insurance leads</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Leads</p>
              <p className="text-3xl font-bold text-blue-600">{getStatusCount('NEW')}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contacted</p>
              <p className="text-3xl font-bold text-yellow-600">{getStatusCount('CONTACTED')}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Converted</p>
              <p className="text-3xl font-bold text-green-600">{getStatusCount('CONVERTED')}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-600">
                {leads.length > 0 ? Math.round((getStatusCount('CONVERTED') / leads.length) * 100) : 0}%
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                          {lead.smoker && <span className="ml-2 text-xs text-red-600">Smoker</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{lead.sessionId.slice(-8)} • {lead.state || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.email}</div>
                    <div className="text-sm text-gray-500">{lead.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Age: {lead.age || 'N/A'} • {lead.gender || 'N/A'} • {lead.maritalStatus || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Income: {lead.income ? formatCurrency(lead.income) : 'N/A'} • Dependents: {lead.dependents ?? 'N/A'}
                    </div>
                    {lead.mortgage && (
                      <div className="text-xs text-gray-400">
                        Mortgage: {formatCurrency(lead.mortgage)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {lead.coverageAmount ? formatCurrency(lead.coverageAmount) : 'Not specified'}
                    </div>
                    {lead.concerns && lead.concerns.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {lead.concerns.slice(0, 2).join(', ')}
                        {lead.concerns.length > 2 && '...'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {getStatusIcon(lead.status)}
                      <span className="ml-1">{lead.status}</span>
                    </span>
                    {lead.followUpDate && new Date(lead.followUpDate) > new Date() && (
                      <div className="text-xs text-orange-600 mt-1">
                        Follow-up: {formatDate(lead.followUpDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(lead.priority)}`}>
                      {getPriorityLabel(lead.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(lead.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openModal(lead)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit lead"
                    >
                      <Edit3 className="w-4 h-4 inline" />
                    </button>
                    <a 
                      href={`tel:${lead.phone}`} 
                      className="text-green-600 hover:text-green-900 mr-3"
                      title="Call lead"
                    >
                      <Phone className="w-4 h-4 inline" />
                    </a>
                    <a 
                      href={`mailto:${lead.email}`} 
                      className="text-gray-600 hover:text-gray-900 mr-3"
                      title="Email lead"
                    >
                      <Mail className="w-4 h-4 inline" />
                    </a>
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowActivities(true);
                      }}
                      className="text-purple-600 hover:text-purple-900"
                      title="View activities"
                    >
                      <FileText className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Get started by generating some leads.'}
            </p>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Update Lead: {selectedLead.firstName} {selectedLead.lastName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              {(newStatus === 'CONTACTED' || newStatus === 'NEW') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes about this lead..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateLead(selectedLead.id, newStatus, notes, followUpDate || undefined)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
              >
                Update Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activities Modal */}
      {showActivities && selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Activity History: {selectedLead.firstName} {selectedLead.lastName}
            </h3>
            
            <div className="space-y-4">
              {getLeadActivities(selectedLead.id).length > 0 ? (
                getLeadActivities(selectedLead.id).map((activity) => (
                  <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {activity.activityType.replace('_', ' ')}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        {activity.performedBy && (
                          <p className="text-xs text-gray-500 mt-1">By: {activity.performedBy}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No activities recorded yet</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowActivities(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsManagementSystem;