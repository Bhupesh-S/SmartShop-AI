import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';

import HomePage from './pages/HomePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import ReceiptPage from './pages/ReceiptPage.jsx';
import Header from './components/Header.jsx';
import Chatbot from './components/Chatbot.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; 
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx'; // ✅ Added import

function App() {
  return (
    <CartProvider>
      <HashRouter>
         <AuthProvider>
        <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
          <Header />
          <main className="pt-20">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/receipt" element={<ReceiptPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} /> {/* ✅ Signup route */}
            </Routes>
          </main>
          <Chatbot />
          </div>
          </AuthProvider>
      </HashRouter>
    </CartProvider>
  );
}

export default App;
