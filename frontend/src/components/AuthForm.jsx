import React, { useState } from 'react';
import { loginUser, signupUser } from '../services/apiService';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setMessage(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (isLogin) {
        const response = await loginUser(formData.username, formData.password);
        setMessage(`✅ Welcome back, ${response.username || 'user'}!`);
      } else {
        const response = await signupUser(formData);
        setMessage('✅ Signup successful! You can now log in.');
        setIsLogin(true);
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-lg dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">
        {isLogin ? 'Login to Your Account' : 'Create an Account'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <input
              name="name"
              onChange={handleChange}
              value={formData.name}
              placeholder="Full Name"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
              required
            />
            <input
              name="email"
              type="email"
              onChange={handleChange}
              value={formData.email}
              placeholder="Email"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
              required
            />
          </>
        )}
        <input
          name="username"
          onChange={handleChange}
          value={formData.username}
          placeholder="Username"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
          required
        />
        <input
          name="password"
          type="password"
          onChange={handleChange}
          value={formData.password}
          placeholder="Password"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
          required
        />
        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>

      {message && <p className="mt-4 text-center text-sm text-gray-700 dark:text-gray-200">{message}</p>}

      <div className="mt-6 text-center">
        <button onClick={toggleMode} className="text-indigo-600 hover:underline text-sm">
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
