import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useRole } from '../hooks/useRole';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isLoggedIn, user } = useCart();
  const { isAdmin, loading } = useRole();

  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />; // Unauthorized
  }

  return children;
}
