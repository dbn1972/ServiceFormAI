import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function PWAInstallBanner() {
  const { canInstall, install, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg p-4">
      <div className="max-w-2xl mx-auto flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium">
            Add ServiceFormAI to your home screen for offline access
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={install}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            Install
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
          >
            <X className="w-4 h-4" />
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
