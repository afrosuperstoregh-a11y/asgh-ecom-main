'use client';

import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatPrice } from '../../lib/utils';
import { getProductImageUrl, PRODUCT_CARD_IMAGE_PROPS, getSafeImageUrl } from '../../lib/images';

interface CartItemProps {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant: string;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
}

export default function CartItem({
  id,
  name,
  image,
  price,
  quantity,
  variant,
  updateQuantity,
  removeItem
}: CartItemProps) {
  const lineTotal = price * quantity;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={getSafeImageUrl(getProductImageUrl(image), '/placeholder-product.svg')}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 128px"
              quality={85}
              loading="lazy"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {variant}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-2 sm:hidden">
                {formatPrice(lineTotal)}
              </p>
            </div>

            {/* Price and Actions */}
            <div className="flex flex-col sm:items-end gap-4">
              {/* Desktop Price */}
              <p className="hidden sm:block text-lg font-bold text-gray-900">
                {formatPrice(lineTotal)}
              </p>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <Button
                    onClick={() => updateQuantity(id, quantity - 1)}
                    disabled={quantity <= 1}
                    variant="ghost"
                    size="icon"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-gray-900 font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <Button
                    onClick={() => updateQuantity(id, quantity + 1)}
                    variant="ghost"
                    size="icon"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Remove Button */}
                <Button
                  onClick={() => removeItem(id)}
                  variant="ghost"
                  size="icon"
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove item"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Unit Price (Mobile) */}
              <div className="sm:hidden text-sm text-gray-500">
                {formatPrice(price)} each
              </div>
            </div>
          </div>

          {/* Unit Price (Desktop) */}
          <div className="hidden sm:block mt-2 text-sm text-gray-500">
            {formatPrice(price)} each
          </div>
        </div>
      </div>
    </div>
  );
}
