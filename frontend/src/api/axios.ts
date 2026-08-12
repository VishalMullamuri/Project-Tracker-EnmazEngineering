import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error(
    "VITE_API_URL is not set. Please configure it in your .env file."
  );
}

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";
    const currentPath = window.location.pathname;

    if (
      status === 401 &&
      requestUrl !== "/auth/login" &&
      currentPath !== "/" &&
      currentPath !== "/login"
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    if (status === 403) {
      return Promise.reject(error);
    }

    if (status === 429) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;