
import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <Link to={`/product/${product.id}`} className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <span aria-hidden="true" className="absolute inset-0" />
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex-1">{product.description.substring(0, 60)}...</p>
        <p className="mt-4 text-xl font-bold text-indigo-600 dark:text-indigo-400">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
};

export default ProductCard;