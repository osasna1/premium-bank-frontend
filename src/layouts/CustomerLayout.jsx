import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";

export default function CustomerLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const TIMEOUT = 3 * 60 * 1000; // ✅ 3 minutes
    let timer;

    const logoutUser = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logoutUser, TIMEOUT);
    };

    // ✅ Any of these counts as activity
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];

    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // ✅ start timer immediately on page load

    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNavbar />
      <Outlet />
    </div>
  );
}