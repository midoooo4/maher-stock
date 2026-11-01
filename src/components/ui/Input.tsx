import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-gray-700 tracking-wide">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-white border ${
              error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:border-brand-orange focus:ring-brand-orange'
            } rounded-xl py-2.5 px-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all ${
              leftIcon ? 'pl-10' : ''
            } disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-gray-700 tracking-wide">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full bg-white border ${
            error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:border-brand-orange focus:ring-brand-orange'
          } rounded-xl py-2.5 px-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all ${className}`}
          rows={3}
          {...props}
        />
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
