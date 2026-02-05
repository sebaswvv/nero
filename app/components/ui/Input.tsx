import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export default function Input({
  label,
  error,
  fullWidth = false,
  className = "",
  ...props
}: InputProps) {
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <div className={widthClass}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      )}
      <input
        className={`px-4 py-2.5 bg-slate-800/50 border ${
          error ? "border-red-500" : "border-slate-700"
        } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${widthClass} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
