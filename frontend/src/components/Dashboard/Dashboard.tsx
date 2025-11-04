import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (user.role === 'teamlead') {
    return <Navigate to="/teamlead" replace />;
  } else if (user.role === 'employee') {
    return <Navigate to="/employee" replace />;
  }

  return null;
};

export default Dashboard;
