import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
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
      visible: true,
    },
    {
      label: "Daily Worksheet",
      path: "/daily-worksheet",
      icon: ClipboardCheck,
      visible: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Sidebar */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">

          {/* Logo */}

          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200">

            <button
              onClick={() => navigate("/dashboard")}
              className="text-2xl font-extrabold tracking-tight text-slate-800"
            >
              Project Tracker
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-800"
            >
              <X size={22} />
            </button>

          </div>

          {/* Navigation */}

          <nav className="flex-1 px-4 py-6 space-y-2">

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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

          </nav>

          {/* Employee Profile */}

          <div className="border-t border-slate-200 p-4">

            <div className="relative">

              <button
                onClick={() =>
                  setShowProfile(!showProfile)
                }
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                  showProfile
                    ? "bg-slate-100 border-slate-300"
                    : "bg-white border-slate-200 hover:bg-slate-100"
                }`}
              >

                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <UserCircle
                    size={22}
                    className="text-blue-600"
                  />
                </div>

                <div className="min-w-0 flex-1 text-left">

                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {user.name || "User"}
                  </p>

                  <p className="text-xs text-slate-500 truncate">
                    {user.role || "-"}
                  </p>

                </div>

              </button>

              {/* Profile Popup */}

              {showProfile && (
                <div className="absolute left-0 bottom-full mb-3 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4">

                  {/* Profile Header */}

                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200">

                    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <UserCircle
                        size={24}
                        className="text-blue-600"
                      />
                    </div>

                    <div className="min-w-0">

                      <h2 className="text-sm font-bold text-slate-800 truncate">
                        {user.name || "-"}
                      </h2>

                      <p className="text-xs text-slate-500 truncate">
                        {user.role || "-"}
                      </p>

                    </div>

                  </div>

                  {/* Profile Information */}

                  <div className="py-4 space-y-3">

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Name
                      </p>

                      <p className="text-sm font-semibold text-slate-800 break-words">
                        {user.name || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Role
                      </p>

                      <p className="text-sm font-semibold text-slate-800">
                        {user.role || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Email
                      </p>

                      <p className="text-sm font-semibold text-slate-800 break-all">
                        {user.email || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Phone Number
                      </p>

                      <p className="text-sm font-semibold text-slate-800">
                        {user.phone || "-"}
                      </p>
                    </div>

                  </div>

                  {/* Logout */}

                  <div className="border-t border-slate-200 pt-3">

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white py-2.5 text-sm font-semibold hover:bg-red-700 transition"
                    >
                      <LogOut size={18} />
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

      <div className="lg:ml-64 min-h-screen">

        {/* Mobile Menu */}

        <div className="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4">

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu size={22} />
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