// API Proxy for Admin Routes in Production
// This proxies admin API requests to the backend server

export default async function handler(req, res) {
  const { method, query, body, headers } = req;
  const { path } = query;
  
  // Backend API URL for production
  const backendUrl = process.env.BACKEND_URL || 'https://asca-backend-production.up.railway.app';
  
  try {
    // Construct the full backend URL
    const apiUrl = `${backendUrl}/api/admin/${Array.isArray(path) ? path.join('/') : path}`;
    
    console.log('Proxying admin request to:', apiUrl);
    
    // Prepare request headers
    const proxyHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': headers['user-agent'] || 'AfroSuperstore-Frontend/1.0',
    };
    
    // Forward authorization header if present
    if (headers.authorization) {
      proxyHeaders.Authorization = headers.authorization;
    }
    
    // Make the request to the backend
    const response = await fetch(apiUrl, {
      method,
      headers: proxyHeaders,
      body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    
    // Get response data
    const responseData = await response.json();
    
    // Return the response with same status and headers
    res.status(response.status).json(responseData);
    
  } catch (error) {
    console.error('Admin API proxy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Configure the route to handle all HTTP methods
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    externalResolver: true,
  },
};
