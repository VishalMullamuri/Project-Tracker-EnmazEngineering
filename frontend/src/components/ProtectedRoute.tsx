import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
  roles?: string[];
};

const ProtectedRoute = ({
  children,
  roles,
}: Props) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles) {
    const user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    if (!roles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;