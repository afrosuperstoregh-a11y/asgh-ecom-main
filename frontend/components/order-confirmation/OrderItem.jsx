const OrderItem = ({ item }) => {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-medium text-gray-900 truncate">
          {item.name}
        </h4>
        <p className="text-sm text-gray-500 mt-1">
          Quantity: {item.quantity}
        </p>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p className="text-lg font-semibold text-gray-900">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
        <p className="text-sm text-gray-500">
          ${item.price.toFixed(2)} each
        </p>
      </div>
    </div>
  );
};

export default OrderItem;
