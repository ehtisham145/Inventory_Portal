"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-500 bg-white ${
            error ? "border-red-400" : "border-gray-300"
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
