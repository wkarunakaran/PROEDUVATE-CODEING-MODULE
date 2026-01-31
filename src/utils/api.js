// API configuration that works with both local development and port forwarding
const getApiBase = () => {
  // Check if there's an environment variable set (for production)
  if (import.meta.env.VITE_API_URL) {
    console.log('📦 Using VITE_API_URL from environment');
    return import.meta.env.VITE_API_URL;
  }
  
  // For development with port forwarding
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If accessing via a forwarded port (not localhost), construct API URL
    // This handles VS Code port forwarding, ngrok, tunnels, etc.
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // For forwarded URLs, try to construct the backend URL
      // Most forwarding services replace port numbers in the hostname
      
      // Check if hostname contains a port number pattern (e.g., abc-5173.domain.com)
      const portInHostname = hostname.match(/-(\d{4,5})\./);
      
      if (portInHostname) {
        // Replace frontend port with backend port 8000
        const backendHostname = hostname.replace(/-\d{4,5}\./, '-8000.');
        const apiUrl = `${protocol}//${backendHostname}`;
        console.log('🌐 Detected forwarded port, using:', apiUrl);
        return apiUrl;
      } else {
        // Fallback: try same hostname with :8000
        const apiUrl = `${protocol}//${hostname}:8000`;
        console.log('🌐 Using forwarded hostname with port 8000:', apiUrl);
        return apiUrl;
      }
    }
  }
  
  // Default to localhost for local development
  console.log('🏠 Using localhost for development');
  return 'http://localhost:8000';
};

export const API_BASE = getApiBase();

console.log('🔗 API Base URL:', API_BASE);
