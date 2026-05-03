import { CheckCircle, Circle, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface JourneyStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
  route?: string;
  optional?: boolean;
  estimatedMinutes?: number;
  substeps?: Array<{
    id: string;
    label: string;
    status: 'completed' | 'active' | 'pending';
  }>;
}

interface TenantJourneyChecklistProps {
  steps: JourneyStep[];
  currentStep: string;
  estimatedTimeRemaining?: number; // in minutes
  onStepClick?: (stepId: string) => void;
  collapsed?: boolean;
}

export default function TenantJourneyChecklist({
  steps,
  currentStep,
  estimatedTimeRemaining,
  onStepClick,
  collapsed = false
}: TenantJourneyChecklistProps) {
  const navigate = useNavigate();

  const handleStepClick = (step: JourneyStep) => {
    if (step.status === 'pending' && !step.optional) return; // Can't click pending required steps

    if (onStepClick) {
      onStepClick(step.id);
    } else if (step.route) {
      navigate(step.route);
    }
  };

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  if (collapsed) {
    return (
      <div className="p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-xs text-muted-foreground">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>~{estimatedTimeRemaining} min remaining</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto flex-shrink-0">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Tenant Journey</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Overall Progress</span>
          <span className="text-sm font-medium">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Est. time remaining: ~{estimatedTimeRemaining} min</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep || step.status === 'active';
          const isClickable = step.status === 'completed' || step.status === 'active' || step.optional;

          return (
            <div key={step.id}>
              <button
                onClick={() => handleStepClick(step)}
                disabled={!isClickable}
                className={`w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 ${
                  isActive
                    ? 'bg-primary/10 border border-primary/30'
                    : step.status === 'completed'
                    ? 'hover:bg-muted'
                    : 'opacity-60'
                } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : isActive ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 text-primary" />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                      {step.label}
                    </span>
                    {step.optional && (
                      <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                        Optional
                      </span>
                    )}
                  </div>
                  {step.estimatedMinutes && step.status === 'pending' && (
                    <span className="text-xs text-muted-foreground">~{step.estimatedMinutes} min</span>
                  )}
                </div>
              </button>

              {/* Substeps */}
              {step.substeps && step.substeps.length > 0 && (isActive || step.status === 'completed') && (
                <div className="ml-11 mt-1 space-y-1">
                  {step.substeps.map((substep) => (
                    <div
                      key={substep.id}
                      className="flex items-center gap-2 text-xs text-muted-foreground py-1"
                    >
                      {substep.status === 'completed' ? (
                        <CheckCircle className="w-3 h-3 text-success" />
                      ) : substep.status === 'active' ? (
                        <div className="w-3 h-3 rounded-full border border-primary" />
                      ) : (
                        <Circle className="w-3 h-3" />
                      )}
                      <span className={substep.status === 'active' ? 'text-foreground' : ''}>
                        {substep.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="ml-[18px] h-4 w-0.5 bg-border" />
              )}
            </div>
          );
        })}
      </div>

      {estimatedTimeRemaining !== undefined && estimatedTimeRemaining === 0 && (
        <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center gap-2 text-success mb-1">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Setup Complete!</span>
          </div>
          <p className="text-xs text-muted-foreground">
            You're ready to start accepting citizen applications.
          </p>
        </div>
      )}
    </div>
  );
}
