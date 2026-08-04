import {
  LayoutDashboard,
  Users,
  LogOut,
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
            </div>
          </div>

          {/* Right Section */}

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-44 h-12 rounded-xl border border-slate-300 bg-white text-slate-700 text-base font-semibold hover:bg-slate-100 transition-all duration-200"
          >
            Logout
            <LogOut size={18} />
          </button>
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