'use client';

import { MapPin, Phone, Mail } from 'lucide-react';

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface DeliveryDetailsProps {
  shipping: ShippingInfo;
}

const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({ shipping }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Delivery Details</h3>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">
              {shipping.firstName} {shipping.lastName}
            </p>
            <p className="text-gray-600">{shipping.address}</p>
            <p className="text-gray-600">
              {shipping.city}, {shipping.state} {shipping.zipCode}
            </p>
            <p className="text-gray-600">{shipping.country}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Phone className="h-5 w-5 text-gray-400" />
          <p className="text-gray-600">{shipping.phone}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Mail className="h-5 w-5 text-gray-400" />
          <p className="text-gray-600">{shipping.email}</p>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Estimated Delivery:</strong> 3-5 business days
        </p>
      </div>
    </div>
  );
};

export default DeliveryDetails;
