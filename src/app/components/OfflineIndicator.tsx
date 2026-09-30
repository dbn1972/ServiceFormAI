import { useEffect, useState } from 'react';
import { connectivityMonitor } from '../services/connectivityMonitor';
import toast from '../utils/toast';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(connectivityMonitor.isOnline);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You are now offline — you can continue working', { duration: 5000 });
    };

    const handleOnline = () => {
      setIsOnline(true);
      toast.info('You are back online — syncing your submissions', { duration: 5000 });
    };

    connectivityMonitor.addEventListener('offline', handleOffline);
    connectivityMonitor.addEventListener('online', handleOnline);

    return () => {
      connectivityMonitor.removeEventListener('offline', handleOffline);
      connectivityMonitor.removeEventListener('online', handleOnline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium"
    >
      You are offline — your work is saved locally
    </div>
  );
}
