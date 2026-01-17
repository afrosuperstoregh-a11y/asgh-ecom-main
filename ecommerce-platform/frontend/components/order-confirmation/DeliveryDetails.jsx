import { Truck, Calendar, MapPin } from 'lucide-react';

const DeliveryDetails = () => {
  const deliveryData = {
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main Street, Apt 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States'
    },
    estimatedDelivery: 'January 15, 2026',
    shippingMethod: 'Express Shipping (2-3 business days)'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Truck className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Delivery Information</h3>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Address</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">{deliveryData.shippingAddress.name}</p>
                <p>{deliveryData.shippingAddress.street}</p>
                <p>
                  {deliveryData.shippingAddress.city}, {deliveryData.shippingAddress.state} {deliveryData.shippingAddress.zipCode}
                </p>
                <p>{deliveryData.shippingAddress.country}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estimated Delivery */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Estimated Delivery</h4>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  {deliveryData.estimatedDelivery}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {deliveryData.shippingMethod}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetails;
