/**
 * Database Clear Utility
 * Use this to reset the database during development
 */

export const clearDatabase = () => {
  localStorage.removeItem('eventvex_db_version');
  localStorage.removeItem('eventvex_db_seeded');
  localStorage.removeItem('eventvex_db');
  console.log('🗑️ Database cleared - refresh page to reseed');
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.clearEventVexDB = clearDatabase;
}