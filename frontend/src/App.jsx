
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import ReceiptPage from './pages/ReceiptPage.jsx';
import Header from './components/Header.jsx';
import Chatbot from './components/Chatbot.jsx';

function App() {
  return (
    <CartProvider>
      <HashRouter>
        <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
          <Header />
          <main className="pt-20">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/receipt" element={<ReceiptPage />} />
            </Routes>
          </main>
          <Chatbot />
        </div>
      </HashRouter>
    </CartProvider>
  );
}

export default App;