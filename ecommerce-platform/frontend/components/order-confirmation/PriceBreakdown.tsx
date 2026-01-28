'use client';

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

interface PriceBreakdownProps {
  items: OrderItem[];
  totals?: Totals;
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ items, totals }) => {
  // Calculate totals if not provided
  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculatedTax = calculatedSubtotal * 0.08; // 8% tax
  const calculatedShipping = calculatedSubtotal > 100 ? 0 : 9.99;
  const calculatedTotal = calculatedSubtotal + calculatedTax + calculatedShipping;

  const finalTotals = totals || {
    subtotal: calculatedSubtotal,
    tax: calculatedTax,
    shipping: calculatedShipping,
    total: calculatedTotal
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${finalTotals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="font-medium">${finalTotals.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">
            {finalTotals.shipping === 0 ? 'FREE' : `$${finalTotals.shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>${finalTotals.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;
