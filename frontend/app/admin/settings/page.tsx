'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Plus,
  Trash2,
  Edit,
  Globe,
  Truck,
  Calculator,
  CreditCard,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  isPublic: boolean;
}

interface TaxZone {
  id: string;
  name: string;
  code: string;
  countries: string[];
  provinces?: any[];
  postalCodes?: any[];
  isActive: boolean;
  rates: TaxRate[];
}

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: string;
  validFrom: string;
  validTo?: string;
  isValid: boolean;
}

interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  provinces?: any[];
  postalCodes?: any[];
  isActive: boolean;
  rates: ShippingRate[];
}

interface ShippingRate {
  id: string;
  name: string;
  code: string;
  price: number;
  freeOverAmount?: number;
  deliveryTime?: string;
  maxWeight?: number;
  sortOrder: number;
  isActive: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Record<string, SystemSetting[]>>({});
  const [taxZones, setTaxZones] = useState<TaxZone[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchTaxZones();
    fetchShippingZones();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Settings fetch error:', error);
    }
    }
  };

  const fetchTaxZones = async () => {
    try {
      const response = await fetch('/api/admin/settings/tax-zones', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTaxZones(data);
      }
    } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Tax zones fetch error:', error);
    }
    }
  };

  const fetchShippingZones = async () => {
    try {
      const response = await fetch('/api/admin/settings/shipping-zones', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setShippingZones(data);
      }
    } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Shipping zones fetch error:', error);
    }
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: string, value: any) => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/admin/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ value })
      });

      if (response.ok) {
        // Update local state
        setSettings(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(category => {
            updated[category] = updated[category].map(setting => 
              setting.key === key ? { ...setting, value } : setting
            );
          });
          return updated;
        });
      } else {
        setError('Failed to update setting');
      }
    } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Setting update error:', error);
    }
      setError('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralSettings = () => {
    const generalSettings = settings.general || [];
    
    return (
      <div className="space-y-6">
        {generalSettings.map((setting) => (
          <div key={setting.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                {setting.description && (
                  <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                )}
              </div>
              {setting.isPublic && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Public
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              {typeof setting.value === 'boolean' ? (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={setting.value}
                    onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {setting.value ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              ) : typeof setting.value === 'string' ? (
                <input
                  type="text"
                  value={setting.value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              ) : typeof setting.value === 'number' ? (
                <input
                  type="number"
                  value={setting.value}
                  onChange={(e) => handleSettingChange(setting.key, parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <textarea
                  value={JSON.stringify(setting.value, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsedValue = JSON.parse(e.target.value);
                      handleSettingChange(setting.key, parsedValue);
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTaxSettings = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Tax Zones</h2>
          <button className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Tax Zone
          </button>
        </div>

        {taxZones.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Calculator className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tax zones configured</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add tax zones to configure tax rates for different regions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {taxZones.map((zone) => (
              <div key={zone.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{zone.name}</h3>
                    <p className="text-sm text-gray-500">Code: {zone.code}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      zone.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button className="p-2 text-gray-600 hover:text-gray-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 mr-2" />
                    <span>Countries: {zone.countries.join(', ')}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tax Rates</h4>
                    {zone.rates.length === 0 ? (
                      <p className="text-sm text-gray-500">No tax rates configured</p>
                    ) : (
                      <div className="space-y-2">
                        {zone.rates.map((rate) => (
                          <div key={rate.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium">{rate.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {rate.rate}% ({rate.type})
                              </span>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rate.isValid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rate.isValid ? 'Valid' : 'Expired'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderShippingSettings = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Shipping Zones</h2>
          <button className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Shipping Zone
          </button>
        </div>

        {shippingZones.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No shipping zones configured</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add shipping zones to configure shipping rates for different regions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shippingZones.map((zone) => (
              <div key={zone.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{zone.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      zone.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button className="p-2 text-gray-600 hover:text-gray-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 mr-2" />
                    <span>Countries: {zone.countries.join(', ')}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Rates</h4>
                    {zone.rates.length === 0 ? (
                      <p className="text-sm text-gray-500">No shipping rates configured</p>
                    ) : (
                      <div className="space-y-2">
                        {zone.rates.map((rate) => (
                          <div key={rate.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium">{rate.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                ${rate.price.toFixed(2)}
                              </span>
                              {rate.freeOverAmount && (
                                <span className="text-xs text-green-600 ml-2">
                                  Free over ${rate.freeOverAmount.toFixed(2)}
                                </span>
                              )}
                              {rate.deliveryTime && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {rate.deliveryTime}
                                </span>
                              )}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rate.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'tax', label: 'Tax Settings', icon: Calculator },
    { id: 'shipping', label: 'Shipping Settings', icon: Truck }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your store settings, tax, and shipping options</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'tax' && renderTaxSettings()}
        {activeTab === 'shipping' && renderShippingSettings()}
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving...
        </div>
      )}
    </div>
  );
}
