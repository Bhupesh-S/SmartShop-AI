import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../data/mock.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ReviewCard from '../components/ReviewCard.jsx';

// --- Utility functions for analytics (ensure these are present and correctly placed) ---
const API_URL = "http://localhost:8000"; // Make sure this is defined

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

const sendAnalyticsEvent = async (eventName, payload) => {
  try {
    const response = await fetch(`${API_URL}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        timestamp: new Date().toISOString(),
        userId: getUserId(),
        ...payload,
      }),
    });
    if (!response.ok) {
      console.error(`Failed to send analytics event ${eventName}:`, response.statusText);
      const errorText = await response.text();
      console.error(`Backend Error for ${eventName}:`, errorText);
    }
  } catch (error) {
    console.error(`Error sending analytics event ${eventName}:`, error);
  }
};
// --- Utility functions for analytics (ensure these are also updated with eventName) ---
// ... (your analytics utility functions here) ...

const ProductDetailPage = () => {
  const [product, setProduct] = useState(null);
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth(); 
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const viewStartTimeRef = useRef(null);

  // Effect to load product and send initial view event
  useEffect(() => {
    const numericId = parseInt(id, 10);
    const foundProduct = getProductById(numericId); // This is where the product data comes from
    setProduct(foundProduct || null); // Make sure this correctly sets null if not found

    if (foundProduct) {
      sendAnalyticsEvent('product_viewed', {
        productId: foundProduct.id,
        productName: foundProduct.name,
        productCategory: foundProduct.category,
        productSubcategory: foundProduct.subcategory,
      });
      viewStartTimeRef.current = Date.now();
    }

    return () => {
      if (viewStartTimeRef.current && foundProduct) {
        const timeSpent = Math.round((Date.now() - viewStartTimeRef.current) / 1000);
        if (timeSpent > 0) {
          sendAnalyticsEvent('time_on_page', {
            productId: foundProduct.id,
            timeSpent: timeSpent,
          });
        }
      }
    };
  }, [id]);

  // Effect to manage userId based on auth state
  useEffect(() => {
    if (user && user.username) {
      localStorage.setItem('userId', user.username);
      localStorage.removeItem('sessionId');
    } else if (!localStorage.getItem('userId')) {
      getUserId();
    }
  }, [user]);

  const handleAddToCart = async () => {
    if (product && user && user.username) {
      

      // Convert product.id to a string here
      const productIdAsString = String(product.id); // Or product.id.toString()

      try {
        await addToCart(productIdAsString, quantity, user.username); // Pass the string version

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);

        sendAnalyticsEvent('product_added_to_cart', {
          productId: productIdAsString, // Use the string version for analytics too
          productName: product.name,
          quantity: quantity,
          price: product.price,
        });
      } catch (error) {
        console.error("Failed to add product to cart:", error);
        // You might want to display an error message to the user here
      }
    } else {
      console.warn("Cannot add to cart: Product data or user not available.");
    }
  };

  if (!product) {
    // If product is null, render a "Product not found" message or a loading spinner
    return (
      <div className="container mx-auto px-4 py-8 text-center pt-24 dark:text-white">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">Go back to Home</Link>
      </div>
    );
  }
  // --- END CRITICAL BLOCK ---

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen pt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery - THIS IS WHERE LINE 128 IS */}
          <div className="aspect-square rounded-lg overflow-hidden">
            {/* Now it's safe to access product.image because of the check above */}
            <img src={product.image} alt={product.name} className="w-full h-full object-center object-cover" />
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{product.name}</h1>

            <div className="mt-3">
              <p className="text-3xl text-gray-900 dark:text-white">₹{product.price.toFixed(2)}</p>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 dark:text-gray-300 space-y-6">
                <p>{product.description}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center">
                   <label htmlFor="quantity" className="mr-4 text-sm font-medium text-gray-900 dark:text-white">Quantity</label>
                   <input
                     type="number"
                     id="quantity"
                     name="quantity"
                     min="1"
                     value={quantity}
                     onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                     className="w-20 rounded-md border border-gray-300 dark:border-gray-600 py-1.5 px-3 text-base font-medium leading-5 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                   />
              </div>

              <div className="mt-10 flex">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full py-3 px-8 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${added ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                >
                  {added ? 'Added to Cart!' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews</h2>
            <div className="mt-6">
                {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map(review => <ReviewCard key={review.id} review={review} />)
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No reviews yet for this product.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;