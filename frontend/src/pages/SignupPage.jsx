import React, { useState } from "react";
import axios from "axios";

// Get API URL from environment variable
// In your React project root, create a .env file:
// REACT_APP_API_URL=http://localhost:8000
const API_URL = "http://localhost:8000";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // New loading state

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear messages on input change
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true); // Set loading to true when submitting

    try {
      const res = await axios.post(`${API_URL}/api/signup`, formData);
      setMessage(res.data.message);
      // Clear form on successful signup
      setFormData({ name: "", email: "", username: "", password: "" });
    } catch (err) {
      console.error("Signup error:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(`Network or API error: ${err.message}`);
      } else {
        setError("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false); // Set loading to false after response
    }
  };

  return (
    <div style={styles.container}>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          style={styles.input}
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>Error: {error}</p>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "40px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    marginBottom: "10px",
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "4px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    borderRadius: "4px",
    transition: "background-color 0.3s ease",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
    cursor: "not-allowed",
  },
  success: {
    color: "green",
    marginTop: "10px",
    textAlign: "center",
  },
  error: {
    color: "red",
    marginTop: "10px",
    textAlign: "center",
  },
};

export default SignupPage;