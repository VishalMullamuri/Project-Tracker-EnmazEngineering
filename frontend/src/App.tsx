
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
import DailyWorksheet from "./pages/DailyWorksheet/DailyWorksheet";
import SupportTickets from "./pages/SupportTickets";
import Layout from "./components/layout/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* My Work */}
        <Route
          path="/my-work"
          element={
            <ProtectedRoute>
              <MyWork />
            </ProtectedRoute>
          }
        />

        {/* Daily Worksheet */}
        <Route
          path="/daily-worksheet"
          element={
            <ProtectedRoute>
              <DailyWorksheet />
            </ProtectedRoute>
          }
        />

        {/* Employee Daily Worksheet — Admin / Manager only */}
        <Route
          path="/employee/:employeeId/worksheet"
          element={
            <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
              <DailyWorksheet />
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

        {/* Employee Details — Admin / Manager only */}
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

        {/* Support Tickets */}
        
<Route
  path="/support-tickets"
  element={
    <ProtectedRoute>
      <SupportTickets />
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
