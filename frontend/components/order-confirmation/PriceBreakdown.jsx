const PriceBreakdown = ({ items }) => {
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 15.99;
  const tax = subtotal * 0.08; // 8% tax
  const discount = 50.00; // Applied discount
  const total = subtotal + shipping + tax - discount;

  return (
    <div className="border-t border-gray-200 pt-4 space-y-3">
      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
      </div>

      {/* Shipping */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Shipping</span>
        <span className="font-medium text-gray-900">${shipping.toFixed(2)}</span>
      </div>

      {/* Tax */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Tax</span>
        <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
      </div>

      {/* Discount */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Discount</span>
        <span className="font-medium text-green-600">-${discount.toFixed(2)}</span>
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex justify-between">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;
