/**
 * Email Templates Component
 * CRM email template management and testing
 */

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Eye, 
  Copy, 
  Filter,
  Search,
  FileText,
  Zap,
  Megaphone
} from 'lucide-react';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testVariables, setTestVariables] = useState({});

  // Fetch email templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        type: selectedType,
        category: selectedCategory
      });

      const response = await fetch(`/api/crm/email/templates?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedType, selectedCategory]);

  const getTemplateTypeIcon = (type) => {
    const icons = {
      transactional: FileText,
      marketing: Megaphone,
      notification: Zap
    };
    return icons[type] || FileText;
  };

  const getTemplateTypeColor = (type) => {
    const colors = {
      transactional: 'bg-blue-100 text-blue-800',
      marketing: 'bg-green-100 text-green-800',
      notification: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleTestTemplate = async () => {
    if (!selectedTemplate || !testEmail) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/crm/email/send-test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: testEmail,
          templateIdOrName: selectedTemplate.name,
          variables: testVariables
        })
      });

      if (response.ok) {
        alert('Test email sent successfully!');
        setShowTestModal(false);
        setTestEmail('');
        setTestVariables({});
      } else {
        alert('Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Error sending test email');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/crm/email/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600">Manage email templates for transactional and marketing emails</p>
        </div>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Transactional</p>
              <p className="text-2xl font-bold text-gray-900">
                {templates.filter(t => t.template_type === 'transactional').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Megaphone className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Marketing</p>
              <p className="text-2xl font-bold text-gray-900">
                {templates.filter(t => t.template_type === 'marketing').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-2xl font-bold text-gray-900">
                {templates.filter(t => t.template_type === 'notification').length}
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
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="transactional">Transactional</option>
            <option value="marketing">Marketing</option>
            <option value="notification">Notification</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="order_confirmation">Order Confirmation</option>
            <option value="shipping_update">Shipping Update</option>
            <option value="welcome">Welcome</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates
          .filter(template => 
            template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.subject.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((template) => {
            const Icon = getTemplateTypeIcon(template.template_type);
            return (
              <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTemplateTypeColor(template.template_type)}`}>
                        {template.template_type}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTestModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Send Test"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTemplateModal(true);
                        }}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{template.subject}</p>
                  
                  {template.category && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Version {template.version}</span>
                    <span>{template.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowTemplateModal(false);
            setSelectedTemplate(null);
          }}
          onSave={fetchTemplates}
        />
      )}

      {/* Test Email Modal */}
      {showTestModal && selectedTemplate && (
        <TestEmailModal
          template={selectedTemplate}
          onClose={() => {
            setShowTestModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};

// Template Modal Component
const TemplateModal = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    html_content: template?.html_content || '',
    text_content: template?.text_content || '',
    template_type: template?.template_type || 'transactional',
    category: template?.category || '',
    variables: template?.variables || []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const method = template ? 'PUT' : 'POST';
      const url = template 
        ? `/api/crm/email/templates/${template.id}`
        : '/api/crm/email/templates';

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
      console.error('Error saving template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
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
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., order_confirmation, welcome"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Your Order #{{order_number}} is Confirmed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Type
              </label>
              <select
                value={formData.template_type}
                onChange={(e) => setFormData({...formData, template_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="transactional">Transactional</option>
                <option value="marketing">Marketing</option>
                <option value="notification">Notification</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTML Content
            </label>
            <textarea
              required
              value={formData.html_content}
              onChange={(e) => setFormData({...formData, html_content: e.target.value})}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="<h1>Hello {{customer_name}}</h1><p>Thank you for your order!</p>"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Content (optional)
            </label>
            <textarea
              value={formData.text_content}
              onChange={(e) => setFormData({...formData, text_content: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Hello {{customer_name}}, Thank you for your order!"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Available Variables</h4>
            <p className="text-sm text-gray-600 mb-2">
              Use these variables in your subject and content:
            </p>
            <div className="flex flex-wrap gap-2">
              {['{{customer_name}}', '{{customer_email}}', '{{order_number}}', '{{order_total}}', '{{tracking_number}}'].map(variable => (
                <code key={variable} className="bg-white px-2 py-1 rounded text-sm">
                  {variable}
                </code>
              ))}
            </div>
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
              {loading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Test Email Modal Component
const TestEmailModal = ({ template, onClose }) => {
  const [testEmail, setTestEmail] = useState('');
  const [testVariables, setTestVariables] = useState({
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    order_number: 'TEST-123',
    order_total: '99.99',
    tracking_number: '1Z999AA1234567890'
  });
  const [loading, setLoading] = useState(false);

  const handleSendTest = async () => {
    if (!testEmail) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/crm/email/send-test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: testEmail,
          templateIdOrName: template.name,
          variables: testVariables
        })
      });

      if (response.ok) {
        alert('Test email sent successfully!');
        onClose();
      } else {
        alert('Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Error sending test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Send Test Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Template: {template.name}</h3>
            <p className="text-sm text-gray-600">Subject: {template.subject}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Email Address
            </label>
            <input
              type="email"
              required
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="test@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Variables
            </label>
            <div className="space-y-3">
              {Object.entries(testVariables).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-1">
                    {key}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setTestVariables({...testVariables, [key]: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
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
              onClick={handleSendTest}
              disabled={loading || !testEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;
