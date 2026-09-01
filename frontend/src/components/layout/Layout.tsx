import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  LogOut,
  UserCircle,
} from "lucide-react";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfile, setShowProfile] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}

      <header className="bg-white border-b border-slate-200">
        <div className="flex justify-between items-start px-10 py-7">

          {/* Left Section */}

          <div className="flex flex-col items-start gap-5">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-800">
              Project Tracker
            </h1>

            <div className="flex items-center gap-4">

              {/* Dashboard */}

              <button
                onClick={() => navigate("/dashboard")}
                className={`flex items-center justify-center gap-2 w-44 h-12 rounded-xl text-base font-semibold transition-all duration-200 ${
                  location.pathname === "/dashboard"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>

              {/* Employees - Manager/Admin Only */}

              {isManager && (
                <button
                  onClick={() => navigate("/admin")}
                  className={`flex items-center justify-center gap-2 w-44 h-12 rounded-xl text-base font-semibold transition-all duration-200 ${
                    location.pathname === "/admin"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Users size={18} />
                  Employees
                </button>
              )}

              {/* Weekly Planner - All Roles */}

              <button
                onClick={() => navigate("/weekly-planner")}
                className={`flex items-center justify-center gap-2 w-44 h-12 rounded-xl text-base font-semibold transition-all duration-200 ${
                  location.pathname === "/weekly-planner"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <CalendarDays size={18} />
                Weekly Planner
              </button>

            </div>
          </div>

          {/* Right Section */}

          <div className="relative">
            <button
              onClick={() =>
                setShowProfile(!showProfile)
              }
              className="flex items-center justify-center gap-2 w-44 h-12 rounded-xl border border-slate-300 bg-white text-slate-700 text-base font-semibold hover:bg-slate-100 transition-all duration-200"
            >
              <UserCircle size={20} />
              Profile
            </button>

            {showProfile && (
              <div className="absolute right-0 top-14 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-5">

                <div className="border-b border-slate-200 pb-4 mb-4">
                  <h2 className="text-lg font-bold text-slate-800">
                    Profile
                  </h2>
                </div>

                <div className="space-y-4">

                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Name
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
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

                <div className="border-t border-slate-200 mt-5 pt-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white py-2.5 font-semibold hover:bg-red-700 transition"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main */}

      <main className="max-w-[1500px] mx-auto p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;