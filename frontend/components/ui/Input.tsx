"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, type, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (isVisible ? "text" : "password") : type}
            className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-500 ${
              isPassword ? "pr-10" : ""
            } ${error ? "border-red-400" : "border-gray-300"} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setIsVisible((v) => !v)}
              aria-label={isVisible ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
            >
              {isVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a17.5 17.5 0 0 1-3.19 4.32M6.61 6.61A17.6 17.6 0 0 0 1 12s4 8 11 8a9.26 9.26 0 0 0 5.39-1.61M9.88 9.88a3 3 0 1 0 4.24 4.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
