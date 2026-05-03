import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface FormInputProps {
  label: string;
  icon?: LucideIcon;
  error?: string;
  touched?: boolean;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}

export function FormInput({ label, icon: Icon, error, touched, required, children, hint }: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />}
        {children}
      </div>
      {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {touched && error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
