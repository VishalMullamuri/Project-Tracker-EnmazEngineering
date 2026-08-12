import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/axios";
import { apiErrorMessage } from "../../utils/apiErrorMessage";
const Login = () => {
    const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const newErrors = {
    email: "",
    password: "",
  };

  if (!email.trim()) {
    newErrors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    newErrors.email = "Enter a valid email";
  }

  if (!password.trim()) {
    newErrors.password = "Password is required";
  } else if (password.length < 6) {
    newErrors.password = "Password must be at least 6 characters";
  }

  setErrors(newErrors);

  if (newErrors.email || newErrors.password) {
    return;
  }

  try {
    setLoading(true);

   const response = await api.post("/auth/login", {
  email,
  password,
});

localStorage.setItem(
  "token",
  response.data.access_token
);

const userResponse = await api.get("/auth/me", {
  headers: {
    Authorization: `Bearer ${response.data.access_token}`,
  },
});

localStorage.setItem(
  "user",
  JSON.stringify(userResponse.data)
);

const user = userResponse.data;

// Force password change for any new account
if (user.first_login) {
  navigate("/change-password");
  return;
}

// Existing users
if (
  user.role === "ADMIN" ||
  user.role === "MANAGER"
) {
  navigate("/dashboard");
} else {
  sessionStorage.setItem("showConsolidated", "false");
  navigate("/dashboard");
}
  } catch (error) {
    if (axios.isAxiosError(error)) {
      alert(
  apiErrorMessage(
    error.response?.data?.detail
  )
);
    } else {
      alert("Something went wrong.");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-100 to-blue-100">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-10">

        {/* Brand */}
        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-blue-600">
            Project Tracker
          </h1>

          <p className="text-gray-500 mt-2">
            Sign in to continue
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Email */}
          <div>

            <label className="block mb-2 font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full
                border
                border-gray-300
                rounded-lg
                px-4
                py-3
                outline-none
                transition
                duration-200
                focus:border-blue-600
                focus:ring-2
                focus:ring-blue-200
              "
            />

            {errors.email && (
              <p className="text-red-500 text-sm mt-2">
                {errors.email}
              </p>
            )}

          </div>

          {/* Password */}
          <div>

            <label className="block mb-2 font-medium text-gray-700">
              Password
            </label>

            <div className="relative">

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full
                  border
                  border-gray-300
                  rounded-lg
                  px-4
                  py-3
                  pr-12
                  outline-none
                  transition
                  duration-200
                  focus:border-blue-600
                  focus:ring-2
                  focus:ring-blue-200
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-500 hover:text-blue-600 transition"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

            {errors.password && (
              <p className="text-red-500 text-sm mt-2">
                {errors.password}
              </p>
            )}

          </div>

          {/* Remember Me */}
          <div className="flex justify-between items-center text-sm">

            <label className="flex items-center gap-2 cursor-pointer">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              Remember Me

            </label>

<span className="text-gray-400 text-sm">
  Company Managed Account
</span>

          </div>

          {/* Login Button */}
         <button
  type="submit"
  disabled={loading}
  className="
    w-full
    bg-blue-600
    text-white
    py-3
    rounded-lg
    font-semibold
    transition-all
    duration-300
    hover:bg-blue-700
    hover:shadow-lg
    active:scale-95
    disabled:bg-gray-400
    disabled:cursor-not-allowed
  "
>
  {loading ? "Signing In..." : "Sign In"}
</button>

        </form>

<p className="text-center mt-6 text-sm text-gray-500">
  Please sign in using your company credentials.
</p>

      </div>

    </div>
  );
};

export default Login;