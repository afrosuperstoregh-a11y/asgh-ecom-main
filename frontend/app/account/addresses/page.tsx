'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase } from 'lucide-react';

interface Address {
  id: number;
  type: string;
  isDefault: boolean;
  name: string;
  street: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock addresses data
    const mockAddresses = [
      {
        id: 1,
        type: 'home',
        isDefault: true,
        name: 'John Doe',
        street: '123 Main Street',
        apartment: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
        phone: '(555) 123-4567'
      },
      {
        id: 2,
        type: 'work',
        isDefault: false,
        name: 'John Doe',
        street: '456 Business Ave',
        apartment: 'Suite 200',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'United States',
        phone: '(555) 987-6543'
      }
    ];
    
    setTimeout(() => {
      setAddresses(mockAddresses);
      setLoading(false);
    }, 1000);
  }, []);

  const setDefaultAddress = (id: number) => {
    setAddresses(addrs =>
      addrs.map(addr =>
        addr.id === id ? { ...addr, isDefault: true } : { ...addr, isDefault: false }
      )
    );
  };

  const deleteAddress = (id: number) => {
    setAddresses(addrs => addrs.filter(addr => addr.id !== id));
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="h-5 w-5" />;
      case 'work': return <Briefcase className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Shipping Addresses</h1>
            <p className="text-gray-600">Manage your delivery addresses</p>
          </div>
          <button className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
            <Plus className="h-5 w-5 mr-2" />
            Add Address
          </button>
        </div>

        {addresses.length > 0 ? (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full text-gray-600">
                      {getAddressIcon(address.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900 capitalize">{address.type} Address</h3>
                        {address.isDefault && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Default</span>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium">{address.name}</p>
                      <p className="text-gray-600">
                        {address.street}
                        {address.apartment && `, ${address.apartment}`}
                      </p>
                      <p className="text-gray-600">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-gray-600">{address.country}</p>
                      <p className="text-gray-600">{address.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => setDefaultAddress(address.id)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Set as Default
                      </button>
                    )}
                    <button className="p-2 text-gray-600 hover:text-primary-600">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteAddress(address.id)}
                      className="p-2 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No addresses saved</h2>
            <p className="text-gray-600 mb-6">Add a shipping address to make checkout faster</p>
            <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
              Add Address
            </button>
          </div>
        )}

        <div className="mt-12 bg-gray-100 rounded-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Delivery Areas</h3>
              <p className="text-gray-600 text-sm">
                We currently ship to all 50 states in the US. International shipping is coming soon.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Delivery Times</h3>
              <p className="text-gray-600 text-sm">
                Standard shipping: 5-7 business days<br />
                Express shipping: 2-3 business days<br />
                Overnight shipping: Next business day
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
