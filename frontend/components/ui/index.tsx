import React from 'react';

export { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
export { Button } from './Button';
export { Input, Label } from './Input';

// Form components
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(({ className, children, ...props }, ref) => (
  React.createElement('form', {
    ref,
    className: `space-y-6 ${className || ''}`,
    ...props
  }, children)
));
Form.displayName = "Form";

const FormField = ({ children, className, ...props }: FormFieldProps) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export { Form, FormField };
