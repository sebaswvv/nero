import React from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-slate-400 mb-6 max-w-md">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
