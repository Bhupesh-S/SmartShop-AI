import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { products as mockProducts } from '../data/mock.js';
import ProductCard from '../components/ProductCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// --- Utility functions for analytics (ensure this is consistent with ProductDetailPage) ---
const API_URL = "http://localhost:8000";

const getUserId = () => {
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId) return storedUserId;

  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};




// Helper function to group products by category for main display
const groupProductsByCategory = (productsList) => {
  const grouped = {};
  productsList.forEach(product => {
    const category = product.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(product);
  });
  return grouped;
};

const HomePage = () => {
  const [allStoreProducts, setAllStoreProducts] = useState(mockProducts);
  const [filteredDisplayProducts, setFilteredDisplayProducts] = useState(mockProducts);
  const [groupedFilteredProducts, setGroupedFilteredProducts] = useState(groupProductsByCategory(mockProducts));
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingPersonalizedRecs, setIsLoadingPersonalizedRecs] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [personalizedOrPopularRecommendations, setPersonalizedOrPopularRecommendations] = useState([]);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatbot, setShowChatbot] = useState(false); // State for Chatbot visibility
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  const chatMessagesEndRef = useRef(null); // Ref for auto-scrolling chat

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- Initial Load Effect (for all store products and categories) ---
  useEffect(() => {
    setAllStoreProducts(mockProducts);
    setCategories(['All', ...new Set(mockProducts.map(p => p.category))]);
  }, []);

  // --- Effect for handling userId and fetching personalized/popular recommendations ---
  useEffect(() => {
    if (user && user.username) {
      localStorage.setItem('userId', user.username);
      localStorage.removeItem('sessionId');
    } else if (!localStorage.getItem('userId')) {
      getUserId();
    }

    const currentUserId = getUserId();
 
  }, [user]);

  // --- Search and Filter Logic ---
  const applyFiltersAndSearch = useCallback((currentSearchTerm, currentSelectedCategory) => {
    let tempProducts = [...allStoreProducts];

    if (currentSelectedCategory !== 'All') {
      tempProducts = tempProducts.filter(p => p.category === currentSelectedCategory);
    }

    if (currentSearchTerm) {
      const lowerCaseSearchTerm = currentSearchTerm.toLowerCase();
      tempProducts = tempProducts.filter(p =>
        p.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        p.description.toLowerCase().includes(lowerCaseSearchTerm) ||
        (p.category && p.category.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    setFilteredDisplayProducts(tempProducts);
    setGroupedFilteredProducts(groupProductsByCategory(tempProducts));

    return tempProducts.length;
  }, [allStoreProducts]);

  // --- SearchBar Logic (formerly in SearchBar.jsx) ---
  const handleSearchSubmit = useCallback(async (e) => {
    e.preventDefault(); // Prevent page reload
    const query = e.target.elements.search.value; // Assuming input has name="search"
    if (!query.trim()) return;

    setSearchTerm(query);
    navigate(`/?q=${query}`); // Update URL query parameter
  }, [navigate]);

  // Effect for handling URL search query and performing search-based actions
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q') || '';

    setSearchTerm(query);

    if (query) {
      setIsLoadingSearch(true);
      setSearchError(null);

      const resultsCount = applyFiltersAndSearch(query, selectedCategory);

      sendAnalyticsEvent('search_performed', {
        query: query,
        resultsCount: resultsCount,
      });

      setIsLoadingSearch(false); // Set to false after regular search
    } else {
      setFilteredDisplayProducts(allStoreProducts);
      setGroupedFilteredProducts(groupProductsByCategory(allStoreProducts));
    }
  }, [location.search, applyFiltersAndSearch, allStoreProducts, selectedCategory]);

  // --- CategoryFilter Logic (formerly in CategoryFilter.jsx) ---
  const handleCategorySelect = useCallback((e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    applyFiltersAndSearch(searchTerm, category);
  }, [applyFiltersAndSearch, searchTerm]);

  // --- Chatbot Logic (formerly in Chatbot.jsx) ---
  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', message: userMessage }]);
    setChatInput('');
    setIsChatbotLoading(true);

    try {
      const response = await fetch(`${API_URL}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage }),
      });
      if (!response.ok) {
        throw new Error(`Chatbot API error: ${response.statusText}`);
      }
      const data = await response.json();
      setChatHistory(prev => [...prev, { sender: 'bot', message: data.response_html }]);
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      setChatHistory(prev => [...prev, { sender: 'bot', message: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
    } finally {
      setIsChatbotLoading(false);
    }
  };

  // --- ProductGrid Content (formerly in ProductGrid.jsx) ---
  // This will be a reusable JSX snippet
  const renderProductGrid = (productsToRender) => (
    <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
      {productsToRender.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );


  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-8">
          Welcome to SmartShop
        </h1>

        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* SearchBar content directly here */}
          <form onSubmit={handleSearchSubmit} className="flex-grow flex items-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm overflow-hidden bg-white dark:bg-gray-700">
            <input
              type="text"
              name="search"
              placeholder="Search products..."
              className="flex-grow px-4 py-2 text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none focus:ring-0"
              defaultValue={searchTerm} // Use defaultValue for uncontrolled input in form
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Search
            </button>
          </form>

          {/* CategoryFilter content directly here */}
          <div className="relative inline-block text-left">
            <select
              className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 py-2 px-4 pr-8 rounded-md shadow-sm leading-tight focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedCategory}
              onChange={handleCategorySelect}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* --- Personalized/Popular Recommendations Section --- */}
        {isLoadingPersonalizedRecs ? (
          <div className="text-center py-6">
            <Spinner />
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Loading recommendations for you...</p>
          </div>
        ) : (
          personalizedOrPopularRecommendations.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                {user ? `Recommendations for You, ${user.username}!` : 'Popular Products'}
              </h2>
              {renderProductGrid(personalizedOrPopularRecommendations)} {/* Use the helper */}
            </section>
          )
        )}

        {/* --- Main Product Display Section --- */}
        {!isLoadingSearch && !searchError && (
          <>
            {Object.keys(groupedFilteredProducts).length === 0 && (
              <p className="text-center text-lg text-gray-700 dark:text-gray-300">No products found matching your search or filters.</p>
            )}

            {Object.keys(groupedFilteredProducts).length > 0 && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                  {searchTerm ? "Matching Products In Our Store" : "All Products"}
                </h2>
                {Object.entries(groupedFilteredProducts).map(([category, productsInCategory]) => (
                  <div key={category} className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">{category}</h3>
                    {renderProductGrid(productsInCategory)} {/* Use the helper */}
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        {/* --- Chatbot Content directly here --- */}
        {showChatbot && (
          <div className="fixed bottom-24 right-6 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-indigo-600 text-white rounded-t-lg">
              <h3 className="text-lg font-semibold">SmartShop AI Assistant</h3>
              <button onClick={toggleChatbot} className="text-white hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ maxHeight: 'calc(100% - 100px)' }}> {/* Adjusted height for input */}
              {chatHistory.length === 0 && !isChatbotLoading && (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Ask me anything about products!</p>
              )}
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2 rounded-lg max-w-[75%] ${
                    msg.sender === 'user'
                      ? 'bg-indigo-500 text-white self-end'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start'
                  }`} dangerouslySetInnerHTML={{ __html: msg.message }}>
                  </div>
                </div>
              ))}
              {isChatbotLoading && (
                <div className="flex justify-start">
                  <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 animate-pulse">
                    ...
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} /> {/* For auto-scrolling */}
            </div>
            <form onSubmit={sendChatMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 flex">
              <input
                type="text"
                value={chatInput}
                onChange={handleChatInputChange}
                placeholder="Type your message..."
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                disabled={isChatbotLoading}
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-r-md disabled:opacity-50"
                disabled={isChatbotLoading}
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Toggle Chatbot Button */}
        <button
          onClick={toggleChatbot}
          className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg z-50 transition-colors"
          aria-label="Toggle Chatbot"
        >
          {showChatbot ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default HomePage;