import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "@/hooks/use-admin-auth";

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute = (s) => {
  const { session, loading } = useAdminAuth();
  console.log("sesson", session)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return !session ? < Navigate to="/admin/login" replace /> : <Outlet />;
};

export default ProtectedRoute;
