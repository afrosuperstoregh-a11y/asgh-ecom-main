import React, { useState } from 'react';

const Accordion = ({ items, className = '' }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg">
          <button
            className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
            onClick={() => toggleItem(index)}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {openIndex === index && (
            <div className="px-4 py-3 bg-white">
              <div className="text-sm text-gray-600">{item.content}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export { Accordion };
