import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeDetails from "./pages/EmployeeDetails";
import ChangePassword from "./pages/ChangePassword";
import MyWork from "./pages/MyWork";
function App() {
  console.log("APP UPDATED");

  return (

    <BrowserRouter>

      <Routes>

        {/* Authentication */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
  path="/my-work"
  element={
    <ProtectedRoute>
      <MyWork />
    </ProtectedRoute>
  }
/>

        <Route
          path="/admin"
          element={
          <ProtectedRoute>
          <AdminDashboard />
         </ProtectedRoute>
         }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
  path="/change-password"
  element={
    <ProtectedRoute>
      <ChangePassword />
    </ProtectedRoute>
  }
/>

        <Route
  path="/employee/:id"
  element={
    <ProtectedRoute>
      <EmployeeDetails />
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