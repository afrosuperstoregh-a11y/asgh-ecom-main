'use client';

import OrderItem from './OrderItem';
import PriceBreakdown from './PriceBreakdown';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface Totals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  totals: Totals;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items, totals }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
      
      {/* Order Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <OrderItem key={item.id} item={item} />
        ))}
      </div>

      {/* Price Breakdown */}
      <PriceBreakdown items={items} totals={totals} />
    </div>
  );
};

export default OrderSummary;
