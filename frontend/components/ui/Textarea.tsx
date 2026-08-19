"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, rows = 4, ...props }, ref) => {
    const areaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={areaId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          rows={rows}
          dir="auto"
          className={`rounded-md border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-500 ${
            error ? "border-red-400" : "border-gray-300"
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
