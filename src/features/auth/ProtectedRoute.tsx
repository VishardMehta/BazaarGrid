import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { UserRole } from "@/lib/supabase";

interface Props {
  children: React.ReactNode;
  /** If provided, only users with this role can access */
  role?: UserRole;
  /** Redirect path when unauthenticated (default: /login) */
  redirectTo?: string;
}

export function ProtectedRoute({ children, role, redirectTo = "/login" }: Props) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Producer / Village Admin pending approval
  if (profile?.status === "PENDING" && location.pathname !== "/pending-approval") {
    return <Navigate to="/pending-approval" replace />;
  }

  // Onboarding not done — profile has default role but hasn't gone through onboarding
  if (!profile?.role && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Role gate
  if (role && profile?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
