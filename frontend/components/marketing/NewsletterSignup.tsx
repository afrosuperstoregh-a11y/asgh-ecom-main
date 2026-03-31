'use client';

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface NewsletterSignupProps {
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
  showPhone?: boolean;
  placeholder?: string;
  buttonText?: string;
}

export default function NewsletterSignup({
  className = '',
  variant = 'default',
  showPhone = false,
  placeholder = 'Enter your email address',
  buttonText = 'Subscribe'
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [emailSubscribed, setEmailSubscribed] = useState(true);
  const [smsSubscribed, setSmsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email && !phone) {
      setStatus('error');
      setMessage('Please enter an email address or phone number');
      return;
    }

    if (email && !isValidEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    if (phone && !isValidPhone(phone)) {
      setStatus('error');
      setMessage('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/marketing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          emailSubscribed,
          smsSubscribed,
          source: 'newsletter_signup'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Successfully subscribed! Check your email for confirmation.');
        setEmail('');
        setPhone('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Subscription failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  if (variant === 'compact') {
    return (
      <div className={`newsletter-signup-compact ${className}`}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            variant="primary"
            size="md"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Subscribing...' : buttonText}
          </Button>
        </form>
        {status !== 'idle' && (
          <div className={`mt-2 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {status === 'success' && <CheckCircle className="inline w-4 h-4 mr-1" />}
            {status === 'error' && <AlertCircle className="inline w-4 h-4 mr-1" />}
            {message}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`newsletter-signup-inline ${className}`}>
        <div className="flex items-center gap-4">
          <Mail className="w-5 h-5 text-gray-600" />
          <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-1 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? '...' : buttonText}
            </Button>
          </form>
        </div>
        {status !== 'idle' && (
          <div className={`mt-1 text-xs ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`newsletter-signup ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Mail className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold mb-2">
            Stay in the Loop
          </h3>
          <p className="mb-6 text-blue-100">
            Get exclusive offers, new product updates, and insider tips delivered straight to your inbox.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                disabled={isLoading}
              />
              
              {showPhone && (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                  disabled={isLoading}
                />
              )}
              
              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                variant="secondary"
                size="md"
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Subscribing...' : buttonText}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailSubscribed}
                  onChange={(e) => setEmailSubscribed(e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-white focus:ring-white"
                />
                <span>Email updates</span>
              </label>
              
              {showPhone && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsSubscribed}
                    onChange={(e) => setSmsSubscribed(e.target.checked)}
                    className="rounded border-white/20 bg-white/10 text-white focus:ring-white"
                  />
                  <span>SMS updates</span>
                </label>
              )}
            </div>
          </form>

          {status !== 'idle' && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              status === 'success' ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
            }`}>
              {status === 'success' && <CheckCircle className="w-5 h-5" />}
              {status === 'error' && <AlertCircle className="w-5 h-5" />}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <p className="mt-4 text-xs text-blue-100">
            By subscribing, you agree to our Privacy Policy and Terms of Service. 
            You can unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
