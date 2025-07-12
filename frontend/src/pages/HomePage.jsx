
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { products } from '../data/mock.js';
import ProductCard from '../components/ProductCard.jsx';
//import { generateProductRecommendations } from '../services/geminiService.js';
import Spinner from '../components/Spinner.jsx';

const HomePage = () => {
  const [displayProducts, setDisplayProducts] = useState(products);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q');
    
    if (query) {
      handleSearch(query);
    } else {
      setDisplayProducts(products);
      setRecommendations([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleSearch = async (query) => {
    setIsLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      // Filter existing products
      const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      );
      setDisplayProducts(filteredProducts);
      
      // Fetch AI recommendations
      const aiRecommendations = await generateProductRecommendations(query);
      // Filter out recommendations that might already be in our static product list
      const newRecommendations = aiRecommendations.filter((rec) => 
        !products.some(p => p.name.toLowerCase() === rec.name.toLowerCase())
      );
      setRecommendations(newRecommendations.map((rec, index) => ({ ...rec, id: products.length + index + 1 })));

    } catch (e) {
      console.error("Search failed:", e);
      setError("Failed to fetch search results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="text-center py-10">
            <Spinner />
            <p className="mt-4 text-lg">Searching for products and AI recommendations...</p>
          </div>
        )}
        
        {error && <p className="text-center text-red-500">{error}</p>}
        
        {!isLoading && !error && (
          <>
            {recommendations.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">AI Recommendations</h2>
                <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                  {recommendations.map((product) => (
                    // This is a simplified ProductCard for AI results
                    <div key={product.id} className="group relative flex flex-col overflow-hidden rounded-lg border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-gray-800 shadow-lg">
                      <div className="aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover object-center"/>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex-1">{product.description}</p>
                        <p className="mt-4 text-xl font-bold text-indigo-600 dark:text-indigo-400">${product.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              {displayProducts.length > 0 ? (recommendations.length > 0 ? "Matching Products In Our Store" : "Featured Products") : "No Products Found"}
            </h2>
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;