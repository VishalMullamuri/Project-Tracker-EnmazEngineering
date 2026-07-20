import { Bell, LogOut } from "lucide-react";
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

      {/* Navbar */}

      <header className="bg-white h-20 shadow-sm flex items-center justify-between px-10">

        <div className="flex items-center gap-8">

  <h1 className="text-4xl font-bold text-slate-800">
    Project Tracker
  </h1>

  <button
    onClick={() => navigate("/dashboard")}
    className={`text-sm font-semibold transition ${
      location.pathname === "/dashboard"
        ? "text-blue-600"
        : "text-gray-600 hover:text-blue-600"
    }`}
  >
    Dashboard
  </button>

  {isManager && (

    <button
      onClick={() => navigate("/admin")}
      className={`text-sm font-semibold transition ${
        location.pathname === "/admin"
          ? "text-blue-600"
          : "text-gray-600 hover:text-blue-600"
      }`}
    >
      Employees
    </button>

  )}

</div>

        <div className="flex items-center gap-6">

          <button className="relative">

            <Bell size={24} />

            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center">
              3
            </span>

          </button>



          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border rounded-xl px-5 py-3 hover:bg-gray-100 transition"
          >

            Logout

            <LogOut size={18} />

          </button>

        </div>

      </header>

      {/* Main */}

      <main className="p-8 max-w-[1500px] mx-auto">

        {children}

      </main>

    </div>
  );
};

export default Layout;