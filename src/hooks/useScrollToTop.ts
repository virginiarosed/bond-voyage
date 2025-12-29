import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });

      const mainElement = document.querySelector("main");
      if (mainElement) {
        mainElement.scrollTo({ top: 0, behavior: "instant" });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);
}
