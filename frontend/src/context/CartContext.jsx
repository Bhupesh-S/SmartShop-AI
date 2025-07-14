import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext(undefined);
const API_URL = "http://localhost:8000"; // Define your API URL

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0); // Add totalPrice state if not already present

  // Modify addToCart to be asynchronous and interact with the backend
  const addToCart = async (productId, quantity, username) => {
    try {
      const response = await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          productId: productId,
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to add to cart on backend:', errorData.detail || response.statusText);
        throw new Error(errorData.detail || 'Failed to add item to cart');
      }

      const data = await response.json();
      setCartItems(data.cart);
      setTotalPrice(data.totalPrice);
      console.log("Item added to cart successfully via backend!");
      return data.cart;
    } catch (error) {
      console.error('Error in addToCart (frontend):', error);
      throw error;
    }
  };

  // Modify removeFromCart to also interact with the backend
  const removeFromCart = async (productId, username) => {
    try {
      const response = await fetch(`${API_URL}/cart/remove`, {
        method: 'POST', // Assuming your remove endpoint is POST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          productId: productId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to remove from cart on backend:', errorData.detail || response.statusText);
        throw new Error(errorData.detail || 'Failed to remove item from cart');
      }

      const data = await response.json();
      setCartItems(data.cart);
      setTotalPrice(data.totalPrice);
      console.log("Item removed from cart successfully via backend!");
      return data.cart;
    } catch (error) {
      console.error('Error in removeFromCart (frontend):', error);
      throw error;
    }
  };

  // Modify updateQuantity to also interact with the backend
  const updateQuantity = async (productId, newQuantity, username) => {
    try {
      if (newQuantity <= 0) {
        return await removeFromCart(productId, username);
      }

      const response = await fetch(`${API_URL}/cart/update`, {
        method: 'POST', // Assuming your update endpoint is POST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          productId: productId,
          quantity: newQuantity, // Send the new quantity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update cart quantity on backend:', errorData.detail || response.statusText);
        throw new Error(errorData.detail || 'Failed to update item quantity');
      }

      const data = await response.json();
      setCartItems(data.cart);
      setTotalPrice(data.totalPrice);
      console.log("Cart quantity updated successfully via backend!");
      return data.cart;
    } catch (error) {
      console.error('Error in updateQuantity (frontend):', error);
      throw error;
    }
  };
  
  // You'll also need a way to load the user's cart when they log in or the component mounts
  // For example, an effect in CartProvider or a separate function:
  const fetchUserCart = async (username) => {
    if (!username) return;
    try {
      const response = await fetch(`${API_URL}/cart/${username}`);
      if (!response.ok) {
        console.error("Failed to fetch user cart:", response.statusText);
        return;
      }
      const data = await response.json();
      setCartItems(data.cart);
      setTotalPrice(data.totalPrice);
    } catch (error) {
      console.error("Error fetching user cart:", error);
    }
  };

  const clearCart = async (username) => {
    // You might want a backend endpoint for clear cart too
    // For now, it only clears local state
    setCartItems([]);
    setTotalPrice(0);
    // TODO: Implement backend call if you want to persist clear cart
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  // Total price is now directly from state updated by backend response

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, totalPrice, fetchUserCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};