'use client';

export default function SimpleTest() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900">Simple Test Page</h1>
      <p className="text-gray-600 mt-2">This is a simple test to verify routing works</p>
      
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-800">✅ If you can see this page, routing is working correctly</p>
      </div>
      
      <div className="mt-4">
        <a href="/admin/login" className="text-blue-600 hover:text-blue-800 underline">
          Go to Admin Login
        </a>
      </div>
      
      <div className="mt-4">
        <a href="/admin" className="text-blue-600 hover:text-blue-800 underline">
          Go to Admin Dashboard (with auth)
        </a>
      </div>
    </div>
  );
}
