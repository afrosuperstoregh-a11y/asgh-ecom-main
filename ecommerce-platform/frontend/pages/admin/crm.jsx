/**
 * CRM Admin Page
 * Main CRM administration interface
 */

import React, { useState } from 'react';
import { 
  Users, 
  Mail, 
  Zap, 
  BarChart3, 
  Settings,
  Menu,
  X
} from 'lucide-react';

// Import CRM components
import CRMDashboard from '../../components/crm/CRMDashboard';
import CustomerManagement from '../../components/crm/CustomerManagement';
import EmailTemplates from '../../components/crm/EmailTemplates';
import AutomationEngine from '../../components/crm/AutomationEngine';

const CRMPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      component: CRMDashboard
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      component: CustomerManagement
    },
    {
      id: 'email',
      label: 'Email Templates',
      icon: Mail,
      component: EmailTemplates
    },
    {
      id: 'automation',
      label: 'Automation',
      icon: Zap,
      component: AutomationEngine
    }
  ];

  const ActiveComponent = menuItems.find(item => item.id === activeTab)?.component || CRMDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">CRM System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <Settings className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white shadow-sm border-r border-gray-200 min-h-screen`}>
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`${
                      activeTab === item.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group w-full flex items-center pl-2 pr-1 py-2 text-sm font-medium rounded-md border-l-4 transition-colors`}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* CRM Stats Sidebar */}
          {sidebarOpen && (
            <div className="mt-8 px-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                <h3 className="font-semibold mb-2">CRM Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Customers:</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Automations:</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email Templates:</span>
                    <span className="font-medium">12</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CRMPage;
