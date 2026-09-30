import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from './app/utils/toast';

function PWARegistration() {
  useRegisterSW({
    onRegisteredSW(_swUrl, _registration) {
      // Service worker registered successfully
    },
    onRegisterError(error) {
      console.warn('[PWA] Service worker registration failed:', error);
    },
    onOfflineReady() {
      toast.info('App ready to work offline');
    },
    onNeedRefresh() {
      toast.info('New version available — click to update', {
        duration: Infinity,
        action: {
          label: 'Update',
          onClick: () => {
            window.location.reload();
          },
        },
      });
    },
  });
  return null;
}

try {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <>
      <PWARegistration />
      <App />
    </>,
  );
} catch (error) {
  console.warn('[PWA] Service worker registration failed:', error);
  createRoot(document.getElementById('root')!).render(<App />);
}
