import React from 'react';
import { useLocation } from 'react-router-dom';
import { isMaintenanceMode } from '../utils/maintenanceConfig';
import MaintenancePage from '../pages/MaintenancePage';

const MaintenanceWrapper = ({ children }) => {
  const location = useLocation();
  
  // Allow access to waitlist page even during maintenance
  const allowedPaths = ['/waiting'];
  const isAllowedPath = allowedPaths.includes(location.pathname);
  
  // Show maintenance page if maintenance mode is enabled and not on allowed paths
  if (isMaintenanceMode() && !isAllowedPath) {
    return <MaintenancePage />;
  }
  
  // Show normal content
  return children;
};

export default MaintenanceWrapper;