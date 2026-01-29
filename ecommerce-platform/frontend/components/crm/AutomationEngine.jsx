/**
 * Automation Engine Component
 * CRM automation workflows and triggers
 */

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Settings, 
  Clock,
  Mail,
  Tag,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AutomationEngine = () => {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch automations
  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        isActive: filterStatus === '' ? null : filterStatus === 'active'
      });

      const response = await fetch(`/api/crm/automations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAutomations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, [filterStatus]);

  const getTriggerIcon = (triggerType) => {
    const icons = {
      order_placed: Mail,
      order_shipped: Mail,
      customer_inactive: Clock,
      customer_signup: Users,
      segment_changed: Tag,
      custom: Settings
    };
    return icons[triggerType] || Settings;
  };

  const getTriggerColor = (triggerType) => {
    const colors = {
      order_placed: 'bg-blue-100 text-blue-800',
      order_shipped: 'bg-green-100 text-green-800',
      customer_inactive: 'bg-yellow-100 text-yellow-800',
      customer_signup: 'bg-purple-100 text-purple-800',
      segment_changed: 'bg-indigo-100 text-indigo-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[triggerType] || 'bg-gray-100 text-gray-800';
  };

  const handleToggleAutomation = async (automationId, isActive) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/crm/automations/${automationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: isActive })
      });

      if (response.ok) {
        fetchAutomations();
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const handleTriggerAutomation = async (automationId) => {
    if (!confirm('Are you sure you want to manually trigger this automation?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/crm/automations/${automationId}/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          triggerData: { manual_trigger: true },
          customerId: null
        })
      });

      if (response.ok) {
        alert('Automation triggered successfully!');
        fetchAutomations();
      }
    } catch (error) {
      console.error('Error triggering automation:', error);
      alert('Error triggering automation');
    }
  };

  const handleDeleteAutomation = async (automationId) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/crm/automations/${automationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchAutomations();
      }
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Automation Engine</h1>
          <p className="text-gray-600">Create and manage automated workflows for customer engagement</p>
        </div>
        <button
          onClick={() => setShowAutomationModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Automations</p>
              <p className="text-2xl font-bold text-gray-900">{automations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Play className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {automations.filter(a => a.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Runs</p>
              <p className="text-2xl font-bold text-gray-900">
                {automations.reduce((sum, a) => sum + (a.run_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">98%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Automations</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {automations.map((automation) => {
          const TriggerIcon = getTriggerIcon(automation.trigger_type);
          return (
            <div key={automation.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <TriggerIcon className="h-6 w-6 text-gray-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                      <p className="text-sm text-gray-600">{automation.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTriggerColor(automation.trigger_type)}`}>
                      {automation.trigger_type.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => handleToggleAutomation(automation.id, !automation.is_active)}
                      className={`p-2 rounded-lg ${
                        automation.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={automation.is_active ? 'Pause' : 'Activate'}
                    >
                      {automation.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleTriggerAutomation(automation.id)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      title="Manual Trigger"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAutomation(automation);
                        setShowLogsModal(true);
                      }}
                      className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                      title="View Logs"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAutomation(automation);
                        setShowAutomationModal(true);
                      }}
                      className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAutomation(automation.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Actions:</span>
                    <div className="mt-1">
                      {automation.actions?.map((action, index) => (
                        <span key={index} className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-1 mb-1">
                          {action.type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Runs:</span>
                    <div className="mt-1 font-medium">{automation.run_count || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Run:</span>
                    <div className="mt-1">
                      {automation.last_run_at 
                        ? new Date(automation.last_run_at).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Automation Modal */}
      {showAutomationModal && (
        <AutomationModal
          automation={selectedAutomation}
          onClose={() => {
            setShowAutomationModal(false);
            setSelectedAutomation(null);
          }}
          onSave={fetchAutomations}
        />
      )}

      {/* Logs Modal */}
      {showLogsModal && selectedAutomation && (
        <AutomationLogsModal
          automation={selectedAutomation}
          onClose={() => {
            setShowLogsModal(false);
            setSelectedAutomation(null);
          }}
        />
      )}
    </div>
  );
};

// Automation Modal Component
const AutomationModal = ({ automation, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: automation?.name || '',
    description: automation?.description || '',
    trigger_type: automation?.trigger_type || 'order_placed',
    trigger_config: automation?.trigger_config || {},
    actions: automation?.actions || [],
    is_active: automation?.is_active ?? true
  });
  const [loading, setLoading] = useState(false);

  const triggerTypes = [
    { value: 'order_placed', label: 'Order Placed' },
    { value: 'order_shipped', label: 'Order Shipped' },
    { value: 'customer_inactive', label: 'Customer Inactive' },
    { value: 'customer_signup', label: 'Customer Signup' },
    { value: 'segment_changed', label: 'Segment Changed' },
    { value: 'custom', label: 'Custom Trigger' }
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'add_tag', label: 'Add Tag' },
    { value: 'remove_tag', label: 'Remove Tag' },
    { value: 'update_lifecycle_stage', label: 'Update Lifecycle Stage' },
    { value: 'add_to_segment', label: 'Add to Segment' },
    { value: 'remove_from_segment', label: 'Remove from Segment' },
    { value: 'create_note', label: 'Create Note' },
    { value: 'webhook', label: 'Call Webhook' }
  ];

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, {
        type: 'send_email',
        config: {
          template_name: '',
          recipient: 'customer'
        }
      }]
    });
  };

  const updateAction = (index, action) => {
    const newActions = [...formData.actions];
    newActions[index] = action;
    setFormData({ ...formData, actions: newActions });
  };

  const removeAction = (index) => {
    const newActions = formData.actions.filter((_, i) => i !== index);
    setFormData({ ...formData, actions: newActions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const method = automation ? 'PUT' : 'POST';
      const url = automation 
        ? `/api/crm/automations/${automation.id}`
        : '/api/crm/automations';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving automation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {automation ? 'Edit Automation' : 'Create Automation'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Automation Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={formData.trigger_type}
                onChange={(e) => setFormData({...formData, trigger_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {triggerTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what this automation does..."
            />
          </div>

          {/* Trigger Configuration */}
          {formData.trigger_type === 'customer_inactive' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days Inactive
              </label>
              <input
                type="number"
                min="1"
                value={formData.trigger_config.days_inactive || 30}
                onChange={(e) => setFormData({
                  ...formData,
                  trigger_config: { ...formData.trigger_config, days_inactive: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Actions */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Actions
              </label>
              <button
                type="button"
                onClick={addAction}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
              >
                Add Action
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.actions.map((action, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <select
                      value={action.type}
                      onChange={(e) => updateAction(index, { ...action, type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {actionTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Action Configuration */}
                  {action.type === 'send_email' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Template name"
                        value={action.config.template_name || ''}
                        onChange={(e) => updateAction(index, {
                          ...action,
                          config: { ...action.config, template_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={action.config.recipient || 'customer'}
                        onChange={(e) => updateAction(index, {
                          ...action,
                          config: { ...action.config, recipient: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  )}

                  {action.type === 'add_tag' && (
                    <input
                      type="text"
                      placeholder="Tag name"
                      value={action.config.tag_name || ''}
                      onChange={(e) => updateAction(index, {
                        ...action,
                        config: { ...action.config, tag_name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {action.type === 'update_lifecycle_stage' && (
                    <select
                      value={action.config.stage || ''}
                      onChange={(e) => updateAction(index, {
                        ...action,
                        config: { ...action.config, stage: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Stage</option>
                      <option value="lead">Lead</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="vip">VIP</option>
                      <option value="churned">Churned</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active (automation will run when triggered)
            </label>
          </div>

          <div className="flex justify-end space-x-3">
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
              {loading ? 'Saving...' : 'Save Automation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Automation Logs Modal Component
const AutomationLogsModal = ({ automation, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [automation.id]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/crm/automations/logs?automationId=${automation.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      success: CheckCircle,
      failed: XCircle,
      partial: AlertCircle
    };
    return icons[status] || AlertCircle;
  };

  const getStatusColor = (status) => {
    const colors = {
      success: 'text-green-600',
      failed: 'text-red-600',
      partial: 'text-yellow-600'
    };
    return colors[status] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Automation Logs: {automation.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No execution logs found</p>
            ) : (
              logs.map((log) => {
                const StatusIcon = getStatusIcon(log.status);
                return (
                  <div key={log.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`h-4 w-4 ${getStatusColor(log.status)}`} />
                        <span className={`font-medium capitalize ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      {log.execution_time_ms && (
                        <span className="text-sm text-gray-500">
                          {log.execution_time_ms}ms
                        </span>
                      )}
                    </div>
                    
                    {log.trigger_data && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">Trigger Data:</span>
                        <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(log.trigger_data, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {log.error_message && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {log.error_message}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationEngine;
