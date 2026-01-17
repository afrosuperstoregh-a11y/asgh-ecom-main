import React from 'react';

const Form = ({ children, className = '', onSubmit, ...props }) => {
  return (
    <form 
      className={`space-y-6 ${className}`}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </form>
  );
};

const FormField = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

const Label = ({ children, className = '', htmlFor }) => {
  return (
    <label 
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-2 ${className}`}
    >
      {children}
    </label>
  );
};

const Input = ({ className = '', type = 'text', ...props }) => {
  return (
    <input
      type={type}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
      {...props}
    />
  );
};

const Textarea = ({ className = '', rows = 4, ...props }) => {
  return (
    <textarea
      rows={rows}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
      {...props}
    />
  );
};

const Select = ({ children, className = '', ...props }) => {
  return (
    <select
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

const Checkbox = ({ className = '', ...props }) => {
  return (
    <input
      type="checkbox"
      className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${className}`}
      {...props}
    />
  );
};

const Radio = ({ className = '', ...props }) => {
  return (
    <input
      type="radio"
      className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${className}`}
      {...props}
    />
  );
};

export { Form, FormField, Label, Input, Textarea, Select, Checkbox, Radio };
