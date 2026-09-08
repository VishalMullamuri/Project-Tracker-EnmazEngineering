import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  LogOut,
  UserCircle,
  Menu,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isManager =
    user.role === "MANAGER" ||
    user.role === "ADMIN";

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: "Employees",
      path: "/admin",
      icon: Users,
      visible: isManager,
    },
    {
      label: "Weekly Planner",
      path: "/weekly-planner",
      icon: CalendarDays,
      visible: isManager,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Brand accent bar — intentional, not a stray line */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-blue-600 z-[60]" />

      {/* Sidebar */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full pt-[3px]">

          {/* Logo */}

          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">

            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2.5 group"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-sm shrink-0">
                PT
              </span>

              <span className="text-[17px] font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Project Tracker
              </span>
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} strokeWidth={2} />
            </button>

          </div>

          {/* Navigation */}

          <nav className="flex-1 px-3 py-5 space-y-0.5">

            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Overview
            </p>

            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() =>
                      handleNavigation(item.path)
                    }
                    className={`w-full flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-lg border-l-[3px] text-sm font-medium transition-all duration-150 ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.25 : 1.75}
                      className={
                        active
                          ? "text-blue-600"
                          : "text-slate-400"
                      }
                    />

                    <span>{item.label}</span>
                  </button>
                );
              })}

          </nav>

          {/* Employee Profile */}

          <div className="border-t border-slate-200 p-3">

            <div className="relative">

              <button
                onClick={() =>
                  setShowProfile(!showProfile)
                }
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                  showProfile
                    ? "bg-slate-50 border-slate-300"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >

                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <UserCircle
                    size={20}
                    strokeWidth={1.75}
                    className="text-blue-600"
                  />
                </div>

                <div className="min-w-0 flex-1 text-left">

                  <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                    {user.name || "User"}
                  </p>

                  <p className="text-[12px] text-slate-500 truncate leading-tight mt-0.5">
                    {user.role || "-"}
                  </p>

                </div>

              </button>

              {/* Profile Popup */}

              {showProfile && (
                <div className="absolute left-0 bottom-full mb-2 w-full bg-white border border-slate-200 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-50 p-4">

                  {/* Profile Header */}

                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">

                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <UserCircle
                        size={22}
                        strokeWidth={1.75}
                        className="text-blue-600"
                      />
                    </div>

                    <div className="min-w-0">

                      <h2 className="text-sm font-bold text-slate-800 truncate leading-tight">
                        {user.name || "-"}
                      </h2>

                      <p className="text-[12px] text-slate-500 truncate leading-tight mt-0.5">
                        {user.role || "-"}
                      </p>

                    </div>

                  </div>

                  {/* Profile Information */}

                  <div className="py-4 space-y-3">

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Name
                      </p>

                      <p className="text-sm font-medium text-slate-800 break-words mt-0.5">
                        {user.name || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Role
                      </p>

                      <p className="text-sm font-medium text-slate-800 mt-0.5">
                        {user.role || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Email
                      </p>

                      <p className="text-sm font-medium text-slate-800 break-all mt-0.5">
                        {user.email || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Phone Number
                      </p>

                      <p className="text-sm font-medium text-slate-800 mt-0.5">
                        {user.phone || "-"}
                      </p>
                    </div>

                  </div>

                  {/* Logout */}

                  <div className="border-t border-slate-100 pt-3">

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white py-2.5 text-sm font-semibold hover:bg-red-700 active:bg-red-800 transition-colors"
                    >
                      <LogOut size={16} strokeWidth={2} />
                      Logout
                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      </aside>

      {/* Mobile Overlay */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}

      <div className="lg:ml-64 min-h-screen pt-[3px]">

        {/* Mobile Menu */}

        <div className="lg:hidden h-14 bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center px-4">

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>

        </div>

        <main className="max-w-[1500px] mx-auto p-5 lg:p-6">
          {children}
        </main>

      </div>

    </div>
  );
};

export default Layout;