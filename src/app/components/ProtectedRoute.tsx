import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireOfficer?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireOfficer = false
}: ProtectedRouteProps) {
  const { user } = useApp();
  const location = useLocation();

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin required but user is not admin
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Officer required but user is not officer or admin
  if (requireOfficer && user.role !== 'officer' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
