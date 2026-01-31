// API configuration that works with both local development and port forwarding
const getApiBase = () => {
  // 1. Check environment variable (Best Practice)
  if (import.meta.env.VITE_API_URL) {
    console.log('📦 Using VITE_API_URL from environment');
    return import.meta.env.VITE_API_URL;
  }

  // 2. Hardcoded Fallback for Vercel (Safety Net)
  // This saves you if the Env Var is missing in Vercel.
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('☁️ Detected Vercel, using Render Backend');
    return 'https://proeduvate-coding-module.onrender.com';
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
