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
      <label htmlFor={id} className="block text-sm font-medium text-gray-100 mb-1">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-2 bg-dark-400/70 border ${
          error ? 'border-red-500/60' : 'border-primary-500/30'
        } rounded-lg text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none 
        focus:ring-2 focus:ring-primary-500/40 transition-colors`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-300">{error}</p>
      )}
    </div>
  );
};