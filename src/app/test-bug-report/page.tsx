'use client';

import React, { useState } from 'react';
import axios from 'axios';

const TestBugReportPage = () => {
  const [message, setMessage] = useState('This is a test bug report');
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [directTestResults, setDirectTestResults] = useState<any>(null);
  const [directTestLoading, setDirectTestLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    
    try {
      let attachmentUrl = null;
      
      // Upload file if exists
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const uploadRes = await axios.post('/api/bug-reports/upload', formData);
          attachmentUrl = uploadRes.data.filePath;
          console.log('File upload response:', uploadRes.data);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          setResults({
            error: true,
            phase: 'upload',
            message: 'File upload failed',
            details: uploadError?.toString()
          });
          setLoading(false);
          return;
        }
      }
      
      // Submit bug report
      try {
        const payload = {
          message,
          screenshot: attachmentUrl,
          attachmentUrl: attachmentUrl
        };
        console.log('Submitting payload:', payload);
        
        const response = await axios.post('/api/bug-reports', payload);
        setResults({
          success: true,
          data: response.data
        });
      } catch (submitError: any) {
        console.error('Submit error:', submitError);
        setResults({
          error: true,
          phase: 'submit',
          message: 'Bug report submission failed',
          details: submitError?.toString(),
          response: submitError?.response?.data
        });
      }
    } catch (error) {
      console.error('General error:', error);
      setResults({
        error: true,
        phase: 'general',
        message: 'An unexpected error occurred',
        details: error?.toString()
      });
    } finally {
      setLoading(false);
    }
  };

  const runApiTest = async () => {
    setTestLoading(true);
    setTestResults(null);
    
    try {
      const response = await axios.get('/api/bug-reports/test');
      setTestResults(response.data);
    } catch (error: any) {
      setTestResults({
        error: true,
        message: 'API test failed',
        details: error?.toString(),
        response: error?.response?.data
      });
    } finally {
      setTestLoading(false);
    }
  };

  const runDirectTest = async () => {
    setDirectTestLoading(true);
    setDirectTestResults(null);
    
    try {
      const response = await axios.post('/api/bug-reports/test', { message });
      setDirectTestResults(response.data);
    } catch (error: any) {
      setDirectTestResults({
        error: true,
        message: 'Direct database test failed',
        details: error?.toString(),
        response: error?.response?.data
      });
    } finally {
      setDirectTestLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Bug Report API Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Test Schema & Connection</h2>
          <button
            onClick={runApiTest}
            disabled={testLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 mb-4"
          >
            {testLoading ? 'Testing...' : 'Run API Test'}
          </button>
          
          {testResults && (
            <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96">
              <pre className="text-sm">{JSON.stringify(testResults, null, 2)}</pre>
            </div>
          )}
          
          <h2 className="text-xl font-semibold mb-4 mt-8">Direct Database Test</h2>
          <button
            onClick={runDirectTest}
            disabled={directTestLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50 mb-4"
          >
            {directTestLoading ? 'Testing...' : 'Run Direct DB Test'}
          </button>
          
          {directTestResults && (
            <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96">
              <pre className="text-sm">{JSON.stringify(directTestResults, null, 2)}</pre>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Full Bug Report Submission Test</h2>
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
            
            <div>
              <label htmlFor="file" className="block text-sm font-medium mb-1">
                Attachment (optional)
              </label>
              <input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 border rounded"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Test Bug Report'}
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
                    <strong>Phase:</strong> {results.phase}
                  </p>
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
    </div>
  );
};

export default TestBugReportPage; 