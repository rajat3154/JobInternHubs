// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => {
      const storedToken = localStorage.getItem("token");
      console.log("[AuthContext] Token fetched from localStorage:", storedToken);
      return storedToken || null;
    }
  );
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("[AuthContext] Token fetched for checkAuth:", token);
        const response = await axios.get(
          `${apiUrl}/api/v1/check-auth`,
          {
            headers: { 
              "Content-Type": "application/json",
              ...(token && (console.log("[AuthContext] Sending token in Authorization header (checkAuth):", token), { "Authorization": `Bearer ${token}` }))
            },
          }
        );

        if (response.data.success) {
          setUser(response.data.data);

          // Store token from response if available
          if (response.data.token) {
            setToken(response.data.token);
            localStorage.setItem("token", response.data.token);
            console.log("[AuthContext] Token stored in localStorage:", response.data.token);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await axios.post(
        `${apiUrl}/api/v1/login`,
        { email, password, role },
        {
          headers: { 
            "Content-Type": "application/json",
            ...(token && (console.log("[AuthContext] Sending token in Authorization header (login):", token), { "Authorization": `Bearer ${token}` }))
          },
        }
      );

      if (response.data.success) {
        setUser(response.data.user);

        if (response.data.token) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          console.log("[AuthContext] Token stored in localStorage (login):", response.data.token);
        }

        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = async () => {
    try {
      await axios.get(`${apiUrl}/api/v1/logout`, {
        headers: { 
          "Content-Type": "application/json",
          ...(token && (console.log("[AuthContext] Sending token in Authorization header (logout):", token), { "Authorization": `Bearer ${token}` }))
        },
      });

      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      console.log("[AuthContext] Token removed from localStorage (logout)");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Logout failed",
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    setUser,
    setToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
