import { ReactNode } from "react";

interface ContentCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function ContentCard({ title, action, children, footer }: ContentCardProps) {
  return (
    <div className="bg-card rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Card Header - Only show if title or action exists */}
      {(title || action) && (
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {title && <h2 className="text-base sm:text-lg text-card-foreground font-semibold">{title}</h2>}
          {action && (
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {action}
            </div>
          )}
        </div>
      )}
      
      {/* Card Content */}
      <div className="p-4 sm:p-6">
        {children}
      </div>
      
      {/* Card Footer (Optional) */}
      {footer && (
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {footer}
        </div>
      )}
    </div>
  );
}
