
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { TrashIcon } from '../components/Icons.jsx';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, totalPrice, cartCount } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    // In a real app, this would go to a payment processor.
    // Here, we'll just navigate to a receipt page.
    navigate('/receipt');
  };

  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity)) {
      updateQuantity(productId, quantity);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Shopping Cart</h1>
        
        {cartCount === 0 ? (
          <div className="mt-12">
            <p className="text-lg text-gray-500 dark:text-gray-400">Your cart is empty.</p>
            <Link to="/" className="mt-4 inline-block text-base font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Continue Shopping <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        ) : (
          <form className="mt-12" onSubmit={(e) => e.preventDefault()}>
            <section aria-labelledby="cart-heading">
              <h2 id="cart-heading" className="sr-only">
                Items in your shopping cart
              </h2>

              <ul role="list" className="border-t border-b border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {cartItems.map((product) => (
                  <li key={product.id} className="flex py-6">
                    <div className="flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-24 h-24 rounded-md object-center object-cover sm:w-32 sm:h-32"
                      />
                    </div>

                    <div className="ml-4 flex-1 flex flex-col sm:ml-6">
                      <div>
                        <div className="flex justify-between">
                          <h4 className="text-sm">
                            <Link to={`/product/${product.id}`} className="font-medium text-gray-700 hover:text-gray-800 dark:text-gray-200 dark:hover:text-white">
                              {product.name}
                            </Link>
                          </h4>
                          <p className="ml-4 text-sm font-medium text-gray-900 dark:text-white">₹{(product.price * product.quantity).toFixed(2)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                      </div>

                      <div className="mt-4 flex-1 flex items-end justify-between">
                        <div className="flex items-center">
                          <label htmlFor={`quantity-${product.id}`} className="sr-only">
                            Quantity, {product.name}
                          </label>
                          <input
                            id={`quantity-${product.id}`}
                            name={`quantity-${product.id}`}
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            className="w-20 rounded-md border border-gray-300 dark:border-gray-600 py-1.5 px-3 text-base font-medium leading-5 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="ml-4">
                          <button type="button" onClick={() => removeFromCart(product.id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                            <TrashIcon className="h-5 w-5"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Order summary */}
            <section aria-labelledby="summary-heading" className="mt-10">
              <h2 id="summary-heading" className="sr-only">
                Order summary
              </h2>

              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <dl className="space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-base font-medium text-gray-900 dark:text-white">Subtotal</dt>
                    <dd className="ml-4 text-base font-medium text-gray-900 dark:text-white">₹{totalPrice.toFixed(2)}</dd>
                  </div>
                </dl>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Shipping and taxes will be calculated at checkout.</p>
              </div>

              <div className="mt-10">
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-indigo-500"
                >
                  Checkout
                </button>
              </div>

              <div className="mt-6 text-sm text-center">
                <p>
                  or{' '}
                  <Link to="/" className="text-indigo-600 font-medium hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Continue Shopping<span aria-hidden="true"> &rarr;</span>
                  </Link>
                </p>
              </div>
            </section>
          </form>
        )}
      </div>
    </div>
  );
};

export default CartPage;