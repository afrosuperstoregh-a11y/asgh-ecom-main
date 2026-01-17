import { CheckCircle, Circle, Package, Truck, Home } from 'lucide-react';

const OrderStatusTimeline = () => {
  const orderStatuses = [
    {
      id: 1,
      title: 'Order Placed',
      description: 'Your order has been successfully placed',
      date: 'January 10, 2026',
      time: '5:45 PM',
      status: 'completed',
      icon: CheckCircle
    },
    {
      id: 2,
      title: 'Processing',
      description: 'Your order is being prepared for shipment',
      date: 'January 11, 2026',
      time: '9:00 AM',
      status: 'completed',
      icon: Package
    },
    {
      id: 3,
      title: 'Shipped',
      description: 'Your order has been shipped and is on its way',
      date: 'January 12, 2026',
      time: '2:30 PM',
      status: 'current',
      icon: Truck
    },
    {
      id: 4,
      title: 'Delivered',
      description: 'Your order will be delivered to your address',
      date: 'January 15, 2026',
      time: 'Expected by 6:00 PM',
      status: 'upcoming',
      icon: Home
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'current':
        return 'text-blue-600 bg-blue-100';
      case 'upcoming':
        return 'text-gray-400 bg-gray-100';
      default:
        return 'text-gray-400 bg-gray-100';
    }
  };

  const getLineColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'current':
        return 'bg-blue-600';
      case 'upcoming':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300">
          <div className="absolute top-0 left-0 w-0.5 bg-green-600" style={{ height: '66%' }}></div>
          <div className="absolute top-0 left-0 w-0.5 bg-blue-600" style={{ height: '33%', top: '66%' }}></div>
        </div>

        {/* Status Items */}
        <div className="space-y-6">
          {orderStatuses.map((status, index) => {
            const Icon = status.icon;
            const isLast = index === orderStatuses.length - 1;
            
            return (
              <div key={status.id} className="relative flex items-start space-x-4">
                {/* Status Icon */}
                <div className={`relative flex-shrink-0 rounded-full p-2 ${getStatusColor(status.status)}`}>
                  <Icon className="h-4 w-4" />
                  {status.status === 'current' && (
                    <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping"></div>
                  )}
                </div>

                {/* Status Content */}
                <div className={`flex-1 min-w-0 pb-6 ${isLast ? 'pb-0' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium ${
                        status.status === 'upcoming' ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {status.title}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        status.status === 'upcoming' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {status.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4 text-right">
                      <p className={`text-xs font-medium ${
                        status.status === 'upcoming' ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {status.date}
                      </p>
                      <p className={`text-xs ${
                        status.status === 'upcoming' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {status.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracking Information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Truck className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-800">
            <span className="font-medium">Tracking Number:</span> 1Z999AA10123456784
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusTimeline;
