import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useAuthStore from "../store/auth";

export function useConditionalCSS() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const isDashboard = location.pathname !== "/auth/login";

    if (isDashboard) {
      // Load dashboard CSS
      import("../styles/dashboard-index.css");
      import("../styles/dashboard.css");
    } else {
      // Load login CSS
      import("../styles/login.css");
      import("../styles/login-index.css");
    }
  }, [location.pathname]);
}
