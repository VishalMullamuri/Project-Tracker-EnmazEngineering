import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeDetails from "./pages/EmployeeDetails";
import ChangePassword from "./pages/ChangePassword";
import MyWork from "./pages/MyWork";
import WeeklyPlanner from "./pages/WeeklyPlanner";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* My Work */}

        <Route
          path="/my-work"
          element={
            <ProtectedRoute>
              <MyWork />
            </ProtectedRoute>
          }
        />

        {/* Admin / Manager Dashboard */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Change Password */}

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Employee Details */}

        <Route
          path="/employee/:id"
          element={
            <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
              <EmployeeDetails />
            </ProtectedRoute>
          }
        />

        {/* Weekly Planner — Admin / Manager only */}

        <Route
          path="/weekly-planner"
          element={
            <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
              <WeeklyPlanner />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Project Details */}

        <Route
          path="/project/:id"
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;