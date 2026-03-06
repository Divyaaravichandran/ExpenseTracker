import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const publicPaths = ["/", "/login", "/signup"];

const Layout: React.FC = () => {
  const location = useLocation();
  const showSidebar = !publicPaths.includes(location.pathname);

  if (!showSidebar) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1100px_600px_at_20%_5%,rgba(37,99,235,0.22),transparent_42%),radial-gradient(900px_560px_at_70%_85%,rgba(34,211,238,0.14),transparent_45%),linear-gradient(135deg,#060d1f_0%,#04122b_45%,#05142d_100%)]">
      <Sidebar />
      <main className="min-h-screen lg:pl-[8.5rem]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
