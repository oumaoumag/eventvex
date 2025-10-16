// Maintenance Configuration
// To enable maintenance mode, set MAINTENANCE_MODE to true
// To disable maintenance mode, set MAINTENANCE_MODE to false

export const MAINTENANCE_CONFIG = {
  // Toggle maintenance mode on/off
  MAINTENANCE_MODE: true,
  
  // Maintenance end time (timestamp in milliseconds)
  // Default: 7 days from now
  // To change: new Date('2025-02-15T10:00:00Z').getTime()
  MAINTENANCE_END_TIME: new Date().getTime() + (7 * 24 * 60 * 60 * 1000),
  
  // Maintenance message
  MESSAGE: "Join our waitlist to be the first to experience the Future of Event Management and Ticketing - Featuring custom NFT, Badges and QR code"
};

// Helper functions
export const isMaintenanceMode = () => {
  return MAINTENANCE_CONFIG.MAINTENANCE_MODE;
};

export const getMaintenanceEndTime = () => {
  return MAINTENANCE_CONFIG.MAINTENANCE_END_TIME;
};

export const setMaintenanceMode = (enabled) => {
  MAINTENANCE_CONFIG.MAINTENANCE_MODE = enabled;
};

export const setMaintenanceEndTime = (timestamp) => {
  MAINTENANCE_CONFIG.MAINTENANCE_END_TIME = timestamp;
};

// Instructions for developers:
/*
HOW TO ENABLE/DISABLE MAINTENANCE MODE:

1. TO ENABLE MAINTENANCE MODE:
   - Set MAINTENANCE_MODE to true in this file
   - The site will show the maintenance page for all routes except /waiting

2. TO DISABLE MAINTENANCE MODE:
   - Set MAINTENANCE_MODE to false in this file
   - The site will function normally

3. TO CHANGE MAINTENANCE END TIME:
   - Update MAINTENANCE_END_TIME with a new timestamp
   - Example: new Date('2025-02-15T10:00:00Z').getTime()
   - Or add days: new Date().getTime() + (numberOfDays * 24 * 60 * 60 * 1000)

4. QUICK EXAMPLES:
   - 1 day: new Date().getTime() + (1 * 24 * 60 * 60 * 1000)
   - 3 days: new Date().getTime() + (3 * 24 * 60 * 60 * 1000)
   - 1 week: new Date().getTime() + (7 * 24 * 60 * 60 * 1000)
   - Specific date: new Date('2025-02-15T10:00:00Z').getTime()
*/