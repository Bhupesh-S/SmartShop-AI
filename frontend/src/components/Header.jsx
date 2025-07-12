
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
//import { visualSearch } from '../services/geminiService.js';
import { CartIcon, LogoIcon, SearchIcon, VisualSearchIcon } from './Icons.jsx';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisualSearchLoading, setIsVisualSearchLoading] = useState(false);
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const fileInputRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleVisualSearchClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsVisualSearchLoading(true);
      try {
        const description = await visualSearch(file);
        setSearchQuery(description);
        navigate(`/?q=${encodeURIComponent(description.trim())}`);
      } catch (error) {
        console.error("Visual search failed:", error);
        alert("Visual search failed. Please try again.");
      } finally {
        setIsVisualSearchLoading(false);
        // Reset file input value to allow selecting the same file again
        if(fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };


  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <LogoIcon className="h-8 w-auto text-indigo-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">SmartShop</span>
            </Link>
          </div>

          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <form onSubmit={handleSearch} className="relative">
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search products..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={handleVisualSearchClick}
                    className="text-gray-400 hover:text-indigo-500"
                    aria-label="Visual Search"
                    disabled={isVisualSearchLoading}
                  >
                    {isVisualSearchLoading ? (
                       <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <VisualSearchIcon className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </form>
            </div>
          </div>
          
          <div className="flex items-center">
             <Link to="/cart" className="ml-4 flow-root lg:ml-6 relative">
                <span className="flex items-center p-2 -m-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
                  <CartIcon className="h-6 w-6 flex-shrink-0" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex items-center justify-center h-5 w-5 text-xs font-medium text-white bg-indigo-500 rounded-full">
                      {cartCount}
                    </span>
                  )}
                  <span className="sr-only">items in cart, view bag</span>
                </span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;