import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export default function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const hoverClass = hover ? "hover:bg-slate-800/50 transition-colors cursor-pointer" : "";

  return (
    <div
      className={`bg-slate-900/50 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm ${paddingClasses[padding]} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
}
