import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL =  "http://localhost:8000";

export const AuthProvider = ({ children }) => {
  // We'll store a minimal user object (e.g., { username: 'testuser', email: 'a@b.com' })
  // This state will be reset on page refresh.
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  // isLoadingAuth can be simplified as we're not waiting for localStorage
  const [isLoadingAuth, setIsLoadingAuth] = useState(false); // Set to false initially

  // Function to log in a user
  const login = async (username, password) => {
    setIsLoadingAuth(true); // Indicate loading for the login process
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      
      // Directly set the user state from the login response
      // The FastAPI /auth/login currently returns { username, email }
      const loggedInUser = {
        username: response.data.username,
        email: response.data.email,
        // Add 'name' if your /auth/login endpoint starts returning it directly
        name: response.data.username // For display, fallback to username if no 'name' from login
      };
      
      setUser(loggedInUser); // Set the user state
      // No localStorage.setItem('currentUser') here
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Login failed in AuthContext:", error);
      const errorMessage = error.response?.data?.detail || "Login failed. Please check your credentials.";
      return { success: false, message: errorMessage };
    } finally {
      setIsLoadingAuth(false); // End loading
    }
  };

  // Function to log out a user
  const logout = () => {
    setUser(null); // Clear user state
    // No localStorage.removeItem('currentUser') here
    setCartCount(0); // Reset cart count on logout
  };

  const updateCartCount = (count) => {
    setCartCount(count);
  };

  const contextValue = {
    user,
    cartCount,
    login,
    logout,
    updateCartCount,
    isLoadingAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};