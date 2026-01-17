'use client';

import { useState } from 'react';
import { Button } from './ui/Button';

interface CheckoutFormProps {
  onSuccess?: (sessionId: string) => void;
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Mock checkout process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock session ID
      const sessionId = 'cs_test_' + Math.random().toString(36).substring(2);
      
      if (onSuccess) {
        onSuccess(sessionId);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Complete your purchase securely with our encrypted checkout process.
        </p>
      </div>
      
      <Button
        type="submit"
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : 'Proceed to Payment'}
      </Button>
    </form>
  );
}
