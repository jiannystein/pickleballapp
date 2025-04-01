'use client';

import React, { useState } from 'react';
import axios from 'axios';

const SimpleTestPage = () => {
  const [message, setMessage] = useState('Simple test bug report');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    
    try {
      // Use the simplified API endpoint
      const response = await axios.post('/api/bug-reports/simple', {
        message,
        screenshot: 'https://via.placeholder.com/150'
      });
      
      setResults({
        success: true,
        data: response.data
      });
    } catch (error: any) {
      console.error('Error submitting bug report:', error);
      setResults({
        error: true,
        message: 'Failed to submit bug report',
        details: error?.toString(),
        response: error?.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Simple Bug Report Test</h1>
      
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              className="w-full p-2 border rounded"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Simple Bug Report'}
          </button>
        </form>
        
        {results && (
          <div className={`mt-6 p-4 rounded ${results.error ? 'bg-red-100' : 'bg-green-100'}`}>
            <h3 className="font-semibold mb-2">
              {results.error ? 'Error' : 'Success'}
            </h3>
            {results.error && (
              <>
                <p className="mb-2">
                  <strong>Message:</strong> {results.message}
                </p>
                {results.details && (
                  <p className="mb-2 text-sm text-red-700 overflow-auto max-h-32">
                    <strong>Details:</strong> {results.details}
                  </p>
                )}
                {results.response && (
                  <div className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-64">
                    <pre className="text-xs">{JSON.stringify(results.response, null, 2)}</pre>
                  </div>
                )}
              </>
            )}
            {!results.error && (
              <div className="overflow-auto max-h-96">
                <pre className="text-sm">{JSON.stringify(results.data, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleTestPage; 