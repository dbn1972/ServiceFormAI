import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  illustration?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  illustration,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon or Illustration */}
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : Icon ? (
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      ) : null}

      {/* Title & Description */}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                action.variant === 'secondary'
                  ? 'border border-border hover:bg-muted'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {/* Custom Content */}
      {children}
    </div>
  );
}

// Predefined empty states for common scenarios
export function NoTemplatesFound({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      title="No templates found"
      description="Try adjusting your search or filters to find what you're looking for."
      action={{
        label: 'Clear Filters',
        onClick: onClearFilters,
        variant: 'secondary',
      }}
    />
  );
}

export function NoServicesYet({ onCreateService }: { onCreateService: () => void }) {
  return (
    <EmptyState
      title="No services yet"
      description="Get started by creating your first service or using one of our pre-built templates."
      action={{
        label: 'Create Service',
        onClick: onCreateService,
      }}
    />
  );
}

export function NoDataAvailable() {
  return (
    <EmptyState
      title="No data available"
      description="There's no data to display at the moment. Check back later or try a different filter."
    />
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      title="Something went wrong"
      description="We couldn't load this data. Please try again or contact support if the problem persists."
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry,
      } : undefined}
    />
  );
}
