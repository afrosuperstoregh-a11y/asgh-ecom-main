'use client';

import { useState, useEffect } from 'react';
import { tokenManager } from '../../lib/token-manager';

export default function AdminDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [tokenTest, setTokenTest] = useState<string>('');

  useEffect(() => {
    const collectDebugInfo = () => {
      const info = {
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
        token: tokenManager.getToken(),
        user: tokenManager.getUser(),
        tokenValidation: tokenManager.validateToken(tokenManager.getToken()),
        localStorage: typeof window !== 'undefined' ? {
          adminToken: localStorage.getItem('adminToken'),
          adminUser: localStorage.getItem('adminUser')
        } : 'N/A',
        timestamp: new Date().toISOString()
      };
      setDebugInfo(info);
      setTokenTest(info.token || 'No token');
    };

    collectDebugInfo();
    const interval = setInterval(collectDebugInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  const testToken = async () => {
    if (!debugInfo.token) {
      alert('No token to test');
      return;
    }

    try {
      const response = await fetch('/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${debugInfo.token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      alert(`Token test result: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert(`Token test error: ${error}`);
    }
  };

  const clearStorage = () => {
    tokenManager.removeToken();
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🔍 Admin Debug Panel</h3>
      <div className="space-y-1">
        <div><strong>URL:</strong> {debugInfo.currentUrl}</div>
        <div><strong>Token:</strong> {debugInfo.token ? `${debugInfo.token.substring(0, 20)}...` : 'None'}</div>
        <div><strong>Token Valid:</strong> {debugInfo.tokenValidation ? '✅' : '❌'}</div>
        <div><strong>User:</strong> {debugInfo.user?.name || 'None'}</div>
        <div><strong>Time:</strong> {debugInfo.timestamp}</div>
      </div>
      <div className="mt-3 space-x-2">
        <button 
          onClick={testToken}
          className="bg-blue-600 px-2 py-1 rounded text-xs"
        >
          Test Token
        </button>
        <button 
          onClick={clearStorage}
          className="bg-red-600 px-2 py-1 rounded text-xs"
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
}
