import { Eye } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityTrigger() {
  const { setToolboxVisible } = useAccessibility();

  return (
    <button
      onClick={() => setToolboxVisible(true)}
      className="fixed bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-4 shadow-2xl hover:scale-110 transition-transform z-40"
      aria-label="Open Accessibility Settings"
      title="Accessibility Settings"
    >
      <Eye className="w-6 h-6" />
    </button>
  );
}
