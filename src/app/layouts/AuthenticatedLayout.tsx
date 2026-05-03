import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';

export default function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
