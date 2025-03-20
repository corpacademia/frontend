import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  id,
  ...props
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-2 bg-dark-400/50 border ${
          error ? 'border-red-500/50' : 'border-primary-500/20'
        } rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none 
        focus:ring-2 focus:ring-primary-500/20 transition-colors`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};