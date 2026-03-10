'use client';

import React, { useState } from 'react';

const FaqPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const faqCategories = [
    {
      title: 'Orders & Shipping',
      items: [
        {
          question: 'How can I track my order?',
          answer: 'You can track your order by visiting the order tracking page and entering your order number and email address. You will also receive tracking updates via email once your order ships. Additionally, you can check your order status in your account dashboard.'
        },
        {
          question: 'How long does shipping take?',
          answer: 'Standard shipping typically takes 5-7 business days. Express shipping takes 2-3 business days. Same-day delivery is available in select cities. International shipping times vary by destination, typically 10-15 business days.'
        },
        {
          question: 'Do you offer international shipping?',
          answer: 'Yes, we ship to over 100 countries worldwide. International shipping rates and delivery times vary depending on the destination. You can check if we ship to your country during checkout.'
        },
        {
          question: 'Can I change my shipping address after placing an order?',
          answer: 'You can change your shipping address within 2 hours of placing an order. After that, please contact our customer support team as soon as possible, and we will do our best to accommodate your request.'
        },
        {
          question: 'What shipping carriers do you use?',
          answer: 'We work with multiple shipping carriers including UPS, FedEx, USPS, and DHL for international shipments. The carrier is selected based on the destination and shipping method chosen.'
        }
      ]
    },
    {
      title: 'Returns & Refunds',
      items: [
        {
          question: 'What is your return policy?',
          answer: 'We offer a 30-day return policy for most items. Products must be unused, in original packaging, and in the same condition you received them. Some items like final sale items, perishables, and personalized products cannot be returned.'
        },
        {
          question: 'How do I initiate a return?',
          answer: 'To initiate a return, go to your account dashboard, select the order you want to return, and click "Return Items". Follow the instructions to print a return label and package your items. You can also contact customer support for assistance.'
        },
        {
          question: 'Who pays for return shipping?',
          answer: 'For defective items or items sent in error, we provide a prepaid return label. For other returns, you are responsible for return shipping costs. However, if you are a ShopHub Premium member, you get free return shipping on all orders.'
        },
        {
          question: 'How long does it take to process a refund?',
          answer: 'Once we receive your returned items, it typically takes 3-5 business days to process the refund. The refund will be credited to your original payment method and may take an additional 5-10 business days to appear in your account, depending on your bank.'
        },
        {
          question: 'Can I exchange items instead of returning them?',
          answer: 'Yes, you can exchange items for a different size or color. Go to your order details and select "Exchange Items" instead of returning. You will receive the new item once we receive the original item back.'
        }
      ]
    },
    {
      title: 'Payments & Billing',
      items: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), debit cards, PayPal, Apple Pay, Google Pay, and ShopHub gift cards. We also offer buy now, pay later options through Affirm and Klarna.'
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Yes, we take payment security very seriously. All payment transactions are encrypted using SSL technology and we are PCI DSS compliant. We never store your credit card information on our servers.'
        },
        {
          question: 'Can I pay in installments?',
          answer: 'Yes, we offer installment payment options through Affirm and Klarna for qualifying purchases over $50. You can choose this option at checkout and see your payment terms before completing your purchase.'
        },
        {
          question: 'Why was my payment declined?',
          answer: 'Payments can be declined for various reasons including insufficient funds, incorrect billing information, or security flags from your bank. Please double-check your payment information or contact your bank. You can also try a different payment method.'
        },
        {
          question: 'Do you charge sales tax?',
          answer: 'Sales tax is charged based on your shipping address and applicable state and local laws. The exact tax amount will be calculated and displayed during checkout before you complete your purchase.'
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const toggleItem = (categoryIndex: number) => {
    setExpandedCategory(expandedCategory === categoryIndex ? null : categoryIndex);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <p className="text-gray-600 mt-2">Find answers to common questions about ShopHub</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Quick Help Links */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="font-medium">Track Order</h3>
            <p className="text-sm text-gray-600 mt-1">Check your order status</p>
            <a href="/track" className="text-indigo-600 hover:text-indigo-500 text-sm">Track →</a>
          </div>

          <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-medium">Returns</h3>
            <p className="text-sm text-gray-600 mt-1">Start a return</p>
            <a href="/returns" className="text-indigo-600 hover:text-indigo-500 text-sm">Return →</a>
          </div>

          <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-medium">Contact Us</h3>
            <p className="text-sm text-gray-600 mt-1">Get help from our team</p>
            <a href="/contact" className="text-indigo-600 hover:text-indigo-500 text-sm">Contact →</a>
          </div>

          <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-medium">Shipping Info</h3>
            <p className="text-sm text-gray-600 mt-1">Delivery details</p>
            <a href="/shipping" className="text-indigo-600 hover:text-indigo-500 text-sm">Learn More →</a>
          </div>
        </div>

        {/* FAQ Categories */}
        {searchTerm && filteredCategories.length === 0 && (
          <div className="bg-white p-8 rounded-lg text-center">
            <p className="text-gray-600">No FAQs found matching your search.</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Clear Search
            </button>
          </div>
        )}

        {filteredCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-white shadow-lg rounded-lg mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="border-b border-gray-200">
                  <button
                    className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={() => toggleItem(categoryIndex)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-900">{item.question}</h3>
                      <svg
                        className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedCategory === categoryIndex ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedCategory === categoryIndex && (
                    <div className="px-6 py-3 bg-gray-50">
                      <div className="text-sm text-gray-600">{item.answer}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Still Need Help */}
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-6">
            Cannot find what you are looking for? Our customer support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700">
              Contact Support
            </a>
            <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50">
              Live Chat
            </button>
            <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50">
              Call 1-800-SHOP-HUB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
