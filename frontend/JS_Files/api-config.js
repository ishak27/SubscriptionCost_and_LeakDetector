/*
 * Cove API configuration.
 * Local development: leave the fallback as-is.
 * Deployment: replace the placeholder below with your deployed backend URL,
 * e.g. https://your-cove-api.example.com/api (no trailing slash).
 * Never put MongoDB credentials or JWT_SECRET in frontend files.
 */
window.COVE_API_BASE_URL = window.COVE_API_BASE_URL || 'http://localhost:5000/api';
