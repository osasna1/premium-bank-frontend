import { Outlet } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNavbar />
      <Outlet />
    </div>
  );
}
