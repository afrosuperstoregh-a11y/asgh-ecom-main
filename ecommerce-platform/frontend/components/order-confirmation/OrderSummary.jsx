import OrderItem from './OrderItem';
import PriceBreakdown from './PriceBreakdown';

const OrderSummary = () => {
  const orderItems = [
    {
      id: 1,
      name: 'Premium Wireless Headphones',
      quantity: 1,
      price: 299.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop&crop=center'
    },
    {
      id: 2,
      name: 'Smart Watch Series 6',
      quantity: 2,
      price: 399.99,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop&crop=center'
    },
    {
      id: 3,
      name: 'Laptop Stand Aluminum',
      quantity: 1,
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&h=100&fit=crop&crop=center'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
      
      {/* Order Items */}
      <div className="space-y-4 mb-6">
        {orderItems.map((item) => (
          <OrderItem key={item.id} item={item} />
        ))}
      </div>

      {/* Price Breakdown */}
      <PriceBreakdown items={orderItems} />
    </div>
  );
};

export default OrderSummary;
