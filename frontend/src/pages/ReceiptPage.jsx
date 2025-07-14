
import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';

const ReceiptPage = () => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const orderDate = new Date().toLocaleDateString();
  const orderNumber = Math.floor(Math.random() * 1000000000);

  useEffect(() => {
    // Clear the cart when the component mounts
    // This assumes the user has "paid"
    if (cartItems.length === 0) {
        // if cart is empty (e.g. page refresh), redirect to home
        navigate('/');
    }
    return () => {
      clearCart();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = () => {
    // A simple way to "download" is to use the browser's print functionality
    window.print();
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-section, #receipt-section * {
            visibility: visible;
          }
          #receipt-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
      <div id="receipt-section" className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <div className="text-center border-b pb-6 border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thank You for Your Order!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Your receipt from SmartShop</p>
        </div>

        <div className="flex justify-between items-center mt-6">
            <div>
                <p className="font-semibold text-gray-700 dark:text-gray-200">Order Number</p>
                <p className="text-gray-500 dark:text-gray-400">{orderNumber}</p>
            </div>
            <div>
                <p className="font-semibold text-gray-700 dark:text-gray-200">Order Date</p>
                <p className="text-gray-500 dark:text-gray-400">{orderDate}</p>
            </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Order Summary</h2>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {cartItems.map(item => (
              <li key={item.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-8 border-t pt-6 border-gray-200 dark:border-gray-700">
           <div className="flex justify-between items-center text-lg font-bold">
               <span className="text-gray-900 dark:text-white">Total</span>
               <span className="text-indigo-600 dark:text-indigo-400">${totalPrice.toFixed(2)}</span>
           </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto mt-8 text-center no-print">
        <button
          onClick={handleDownload}
          className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Download Receipt
        </button>
        <button
          onClick={() => navigate('/')}
          className="ml-4 bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ReceiptPage;