
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../data/mock.js';
import { useCart } from '../context/CartContext.jsx';
import ReviewCard from '../components/ReviewCard.jsx';

const ProductDetailPage = () => {
  const [product, setProduct] = useState(null);
  const { id } = useParams();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (id) {
      const numericId = parseInt(id, 10);
      const foundProduct = getProductById(numericId);
      setProduct(foundProduct || null);
    }
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">Go back to Home</Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="aspect-square rounded-lg overflow-hidden">
            <img src={product.image} alt={product.name} className="w-full h-full object-center object-cover" />
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{product.name}</h1>

            <div className="mt-3">
              <p className="text-3xl text-gray-900 dark:text-white">${product.price.toFixed(2)}</p>
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
                {product.reviews.length > 0 ? (
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