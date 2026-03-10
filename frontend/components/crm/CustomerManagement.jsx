/**
 * Customer Management Component
 * CRM customer profiles, notes, and tags management
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Tag, 
  MessageSquare,
  Users,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedLifecycle, setSelectedLifecycle] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);

  // Fetch customers from CRM API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: 1,
        limit: 50,
        search: searchTerm,
        lifecycleStage: selectedLifecycle,
        segmentId: selectedSegment
      });

      const response = await fetch(`/api/crm/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, selectedSegment, selectedLifecycle]);

  const getLifecycleStageColor = (stage) => {
    const colors = {
      lead: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      vip: 'bg-purple-100 text-purple-800',
      churned: 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage customer profiles, notes, and tags</p>
        </div>
        <button
          onClick={() => setShowCustomerModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.lifecycle_stage === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg. Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(customers.reduce((sum, c) => sum + (c.average_order_value || 0), 0) / customers.length || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => {
                  const createdAt = new Date(c.created_at);
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return createdAt > monthAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={selectedLifecycle}
            onChange={(e) => setSelectedLifecycle(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Lifecycle Stages</option>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="vip">VIP</option>
            <option value="churned">Churned</option>
          </select>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lifecycle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.users?.first_name} {customer.users?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{customer.users?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLifecycleStageColor(customer.lifecycle_stage)}`}>
                      {customer.lifecycle_stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.order_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(customer.total_spend)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.last_order_date 
                      ? new Date(customer.last_order_date).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowNotesModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Add Note"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowTagsModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Manage Tags"
                      >
                        <Tag className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          // Handle edit
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showCustomerModal && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => {
            setShowCustomerModal(false);
            setSelectedCustomer(null);
          }}
          onUpdate={fetchCustomers}
        />
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedCustomer && (
        <CustomerNotesModal
          customer={selectedCustomer}
          onClose={() => {
            setShowNotesModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Tags Modal */}
      {showTagsModal && selectedCustomer && (
        <CustomerTagsModal
          customer={selectedCustomer}
          onClose={() => {
            setShowTagsModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};

// Customer Details Modal Component
const CustomerDetailsModal = ({ customer, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    lifecycle_stage: customer.lifecycle_stage,
    marketing_consent: customer.marketing_consent,
    sms_consent: customer.sms_consent,
    preferred_language: customer.preferred_language || 'en',
    timezone: customer.timezone || 'UTC'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/crm/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Customer Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Contact Information</h3>
            <div className="space-y-1">
              <p><strong>Name:</strong> {customer.users?.first_name} {customer.users?.last_name}</p>
              <p><strong>Email:</strong> {customer.users?.email}</p>
              <p><strong>Phone:</strong> {customer.users?.phone || 'Not provided'}</p>
            </div>
          </div>

          {/* Customer Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Customer Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="font-medium">{customer.order_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Spend</p>
                <p className="font-medium">${customer.total_spend || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Order Value</p>
                <p className="font-medium">${customer.average_order_value || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lifetime Value</p>
                <p className="font-medium">${customer.lifetime_value || 0}</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lifecycle Stage
              </label>
              <select
                value={formData.lifecycle_stage}
                onChange={(e) => setFormData({...formData, lifecycle_stage: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="vip">VIP</option>
                <option value="churned">Churned</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.marketing_consent}
                    onChange={(e) => setFormData({...formData, marketing_consent: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Marketing Consent</span>
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sms_consent}
                    onChange={(e) => setFormData({...formData, sms_consent: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">SMS Consent</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Customer Notes Modal Component
const CustomerNotesModal = ({ customer, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/crm/customers/${customer.id}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [customer.id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/crm/customers/${customer.id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          note: newNote,
          note_type: noteType
        })
      });

      if (response.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Customer Notes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note Type
              </label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">General</option>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
                <option value="risk">Risk</option>
                <option value="complaint">Complaint</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a note about this customer..."
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newNote.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Note'}
            </button>
          </form>

          {/* Notes List */}
          <div className="space-y-3">
            <h3 className="font-medium">Recent Notes</h3>
            {notes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notes yet</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {note.note_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{note.note}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Customer Tags Modal Component
const CustomerTagsModal = ({ customer, onClose }) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [customerTags, setCustomerTags] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [customer.id]);

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Get all available tags
      const tagsResponse = await fetch('/api/crm/tags', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Get customer's current tags
      const customerResponse = await fetch(`/api/crm/customers/${customer.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (tagsResponse.ok && customerResponse.ok) {
        const tagsData = await tagsResponse.json();
        const customerData = await customerResponse.json();
        
        setAvailableTags(tagsData.data || []);
        setCustomerTags(customerData.data?.tags || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleToggleTag = async (tag) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const hasTag = customerTags.some(customerTag => customerTag.id === tag.id);
      
      const method = hasTag ? 'DELETE' : 'POST';
      const url = hasTag 
        ? `/api/crm/customers/${customer.id}/tags/${tag.id}`
        : `/api/crm/customers/${customer.id}/tags`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        ...(method === 'POST' && { body: JSON.stringify({ tagId: tag.id }) })
      });

      if (response.ok) {
        if (hasTag) {
          setCustomerTags(customerTags.filter(t => t.id !== tag.id));
        } else {
          setCustomerTags([...customerTags, tag]);
        }
      }
    } catch (error) {
      console.error('Error toggling tag:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Manage Customer Tags</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Tags */}
          <div>
            <h3 className="font-medium mb-3">Current Tags</h3>
            {customerTags.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tags assigned</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {customerTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Available Tags */}
          <div>
            <h3 className="font-medium mb-3">Available Tags</h3>
            <div className="space-y-2">
              {availableTags.map((tag) => {
                const hasTag = customerTags.some(customerTag => customerTag.id === tag.id);
                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <p className="font-medium">{tag.name}</p>
                        {tag.description && (
                          <p className="text-sm text-gray-500">{tag.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleTag(tag)}
                      disabled={loading}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        hasTag
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {hasTag ? 'Remove' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
