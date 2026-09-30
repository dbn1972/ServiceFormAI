import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isOnboardingCompletedForUser } from '../utils/onboarding';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireOfficer?: boolean;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireOfficer = false,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user } = useApp();
  const location = useLocation();
  const allowOnboardingRoutes = location.pathname === '/onboarding/citizen' || location.pathname === '/consent';

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const needsOnboarding = user.role === 'citizen' && !isOnboardingCompletedForUser(user);
  if (needsOnboarding && !allowOnboardingRoutes) {
    return <Navigate to="/onboarding/citizen" state={{ from: location }} replace />;
  }

  // Admin required but user is not admin
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Officer required but user is not officer or admin
  if (requireOfficer && !['officer', 'admin', 'approver'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
