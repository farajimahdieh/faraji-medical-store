"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
  error?: string;
}

// Same visual contract as TextField, plus a show/hide toggle -- defaults
// hidden. A sibling of TextField rather than an addition to it, since
// TextField's API has no trailing-icon slot and no other caller needs one.
export function PasswordField({
  label,
  hint,
  error,
  id,
  className = "",
  required,
  ...props
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

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
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          required={required}
          aria-invalid={error ? true : undefined}
          className={`h-11 w-full rounded-xl border px-3 pl-10 text-navy outline-none transition-colors focus:ring-2 ${
            error
              ? "border-accent-red focus:border-accent-red focus:ring-accent-red/15"
              : "border-border focus:border-primary focus:ring-primary/15"
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-navy"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && !error && <p className="text-xs text-secondary-text">{hint}</p>}
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  );
}
