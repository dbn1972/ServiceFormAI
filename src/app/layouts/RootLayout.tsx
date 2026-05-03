import { Outlet } from 'react-router-dom';
import { Toaster } from '../components/ui/sonner';
import AccessibilityToolbox from '../components/AccessibilityToolbox';
import AccessibilityTrigger from '../components/AccessibilityTrigger';
import SkipLinks from '../components/accessible/SkipLinks';

export default function RootLayout() {
  return (
    <>
      <SkipLinks />
      <main id="main-content" role="main" tabIndex={-1}>
        <Outlet />
      </main>
      <AccessibilityToolbox />
      <AccessibilityTrigger />
      <Toaster />
    </>
  );
}
