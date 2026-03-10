'use client';

import CartItem from './CartItem';

interface CartItemData {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant: string;
}

interface CartItemListProps {
  items: CartItemData[];
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
}

export default function CartItemList({
  items,
  updateQuantity,
  removeItem
}: CartItemListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CartItem
          key={item.id}
          id={item.id}
          name={item.name}
          image={item.image}
          price={item.price}
          quantity={item.quantity}
          variant={item.variant}
          updateQuantity={updateQuantity}
          removeItem={removeItem}
        />
      ))}
    </div>
  );
}
