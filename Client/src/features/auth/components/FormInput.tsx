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
      <label htmlFor={id} className="block text-sm font-medium text-gray mb-2" style={{ color: '#ffffff !important' }}>
        {label}
      </label>
      <div className="mt-1">
        <input
          id={id}
          className={`w-full px-4 py-3 bg-dark-400/80 border ${
            error ? 'border-red-500/60' : 'border-primary-500/40'
          } rounded-lg shadow-sm placeholder-gray-400 
          text-white focus:outline-none focus:ring-2 focus:ring-primary-500/60 
          focus:border-primary-500/80 transition-colors`}
          style={{ color: '#ffffff !important' }}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-300">{error}</p>
      )}
    </div>
  );
};