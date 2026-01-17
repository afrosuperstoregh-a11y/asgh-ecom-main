import React from 'react';

const Sidebar = ({ children, className = '' }) => {
  return (
    <div className={`w-64 bg-white shadow-lg h-full ${className}`}>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

const SidebarNav = ({ items, className = '' }) => {
  return (
    <nav className={`space-y-1 ${className}`}>
      {items.map((item, index) => (
        <a
          key={index}
          href={item.href}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
            item.active
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {item.icon && (
            <svg
              className="mr-3 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {item.icon}
            </svg>
          )}
          {item.label}
        </a>
      ))}
    </nav>
  );
};

const SidebarSection = ({ title, children, className = '' }) => {
  return (
    <div className={`mb-6 ${className}`}>
      <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="mt-3">
        {children}
      </div>
    </div>
  );
};

export { Sidebar, SidebarNav, SidebarSection };
