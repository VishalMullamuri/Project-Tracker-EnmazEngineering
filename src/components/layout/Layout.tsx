import {  LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isManager =
    user.role === "MANAGER" || user.role === "ADMIN";

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const navButton = (
    active: boolean,
    label: string,
    onClick: () => void
  ) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-blue-600 text-white shadow-md"
          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Header */}

      <header className="bg-white border-b border-slate-200">

        <div className="max-w-[1500px] mx-auto px-10 py-6">

          {/* Top Row */}

          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-800">
                Project Tracker
              </h1>

              <p className="text-slate-500 mt-1">
                Project Management Dashboard
              </p>
            </div>

            <div className="flex items-center gap-4">


              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium hover:bg-slate-100 transition"
              >
                Logout
                <LogOut size={17} />
              </button>

            </div>

          </div>

          {/* Navigation */}

          <div className="mt-8 flex items-center gap-3">

            {navButton(
              location.pathname === "/dashboard",
              "Dashboard",
              () => navigate("/dashboard")
            )}

            {isManager &&
              navButton(
                location.pathname === "/admin",
                "Employees",
                () => navigate("/admin")
              )}

          </div>

        </div>

      </header>

      {/* Page Content */}

      <main className="max-w-[1500px] mx-auto px-10 py-8">
        {children}
      </main>

    </div>
  );
};

export default Layout;