import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    const publicRoutes = ["/home"];
    const isPublicRoute = publicRoutes.includes(location.pathname);

    if (!token && !isPublicRoute) {
      navigate("/home", { replace: true });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
};
