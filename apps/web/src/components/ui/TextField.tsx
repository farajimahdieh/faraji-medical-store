"use client";

import { useId, type InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({
  label,
  hint,
  error,
  id,
  className = "",
  required,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm text-secondary-text">
        {label}
        {required && (
          <span className="text-accent-red" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`h-11 rounded-xl border px-3 text-navy outline-none transition-colors focus:ring-2 ${
          error
            ? "border-accent-red focus:border-accent-red focus:ring-accent-red/15"
            : "border-border focus:border-primary focus:ring-primary/15"
        } ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-secondary-text">{hint}</p>}
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  );
}
