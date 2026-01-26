// Main entry point for Railway deployment
// Start the backend Express server

console.log('🚀 Starting Afro Superstore Backend API...');

try {
  require('./backend/src/server.js');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
