'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaFilter, FaExclamationCircle, FaBug, FaEye, FaTrash } from 'react-icons/fa';
import BugReportDetailModal from '@/components/BugReportDetailModal';

type BugReport = {
  id: string;
  message: string;
  screenshot: string | null;
  status: 'new' | 'completed' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

const BugReportsPage = () => {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const reportsPerPage = 10;
  const [updating, setUpdating] = useState<string | null>(null);
  const [stats, setStats] = useState({ new: 0, completed: 0, dismissed: 0 });
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [clearingReports, setClearingReports] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [isFixingSchema, setIsFixingSchema] = useState(false);
  const [schemaFixResult, setSchemaFixResult] = useState<any>(null);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate pagination offset
      const offset = (currentPage - 1) * reportsPerPage;
      
      // Build query params
      let params = new URLSearchParams();
      params.append('limit', reportsPerPage.toString());
      params.append('offset', offset.toString());
      
      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await axios.get(`/api/bug-reports?${params.toString()}`);
      
      console.log('API Response:', response.data); // Add this line for debugging
      
      // Check if the response has the expected data
      if (response.data) {
        // Handle reports array - ensure we're accessing the right property
        const reportsList = response.data.bugReports || response.data.reports || [];
        setReports(reportsList);
        
        // Handle total count
        let totalCount = 0;
        if (typeof response.data.total === 'number') {
          totalCount = response.data.total;
        } else if (response.data.pagination && typeof response.data.pagination.total === 'number') {
          totalCount = response.data.pagination.total;
        }
        
        setTotalReports(totalCount);
        setTotalPages(Math.max(1, Math.ceil(totalCount / reportsPerPage)));
      } else {
        setReports([]);
        setTotalReports(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching bug reports:', err);
      setReports([]);
      setTotalReports(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/bug-reports/stats');
      if (response.data && response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Error fetching bug report stats:', err);
      // Default to zeros if there's an error
      setStats({ new: 0, completed: 0, dismissed: 0 });
    }
  };
  
  useEffect(() => {
    fetchBugReports();
    fetchStats();
  }, [currentPage, statusFilter]);
  
  useEffect(() => {
    // Refresh stats when a report status is updated
    if (updating === null) {
      fetchStats();
    }
  }, [updating]);
  
  const updateStatus = async (reportId: string, newStatus: 'new' | 'completed' | 'dismissed') => {
    try {
      setUpdating(reportId);
      await axios.patch(`/api/bug-reports/${reportId}`, { status: newStatus });
      
      // Update local state
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus } 
          : report
      ));
    } catch (err) {
      console.error('Error updating bug report status:', err);
      setError('Failed to update report status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-900 bg-opacity-30 text-yellow-300 border border-yellow-700">
          <FaExclamationCircle className="mr-1" /> New
        </span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-900 bg-opacity-30 text-green-300 border border-green-700">
          <FaCheckCircle className="mr-1" /> Completed
        </span>;
      case 'dismissed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 bg-opacity-30 text-gray-300 border border-gray-700">
          <FaTimesCircle className="mr-1" /> Dismissed
        </span>;
      default:
        return null;
    }
  };
  
  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between mt-6">
        <div>
          <p className="text-sm text-gray-400">
            Showing <span className="font-medium text-gray-300">{reports.length ? (currentPage - 1) * reportsPerPage + 1 : 0}</span> to{' '}
            <span className="font-medium text-gray-300">{Math.min(currentPage * reportsPerPage, totalReports)}</span> of{' '}
            <span className="font-medium text-gray-300">{totalReports}</span> results
          </p>
        </div>
        <div className="flex">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    // Show different UI if stats show reports exist but list is empty
    const hasReportsInStats = stats.new > 0 || stats.completed > 0 || stats.dismissed > 0 || totalReports > 0;
    
    return (
      <div className="px-4 py-16 text-center">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-indigo-900 bg-opacity-20 flex items-center justify-center">
            <FaBug className="h-10 w-10 text-indigo-400" />
          </div>
        </div>
        
        {hasReportsInStats ? (
          // Schema issue likely - show Fix button
          <>
            <h3 className="mt-5 text-xl font-medium text-gray-300">Schema Issue Detected</h3>
            <p className="mt-3 text-gray-400 max-w-md mx-auto">
              There appear to be {totalReports} bug reports in the database, but they cannot be displayed
              due to a schema issue. This is likely because the <code className="bg-gray-700 px-1 rounded">reportNumber</code> field
              is missing in the database.
            </p>
            <div className="mt-6">
              <button
                onClick={fixSchema}
                disabled={isFixingSchema}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 flex items-center mx-auto"
              >
                {isFixingSchema ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Fixing Schema...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Fix Database Schema
                  </>
                )}
              </button>
              
              {schemaFixResult && (
                <div className={`mt-4 p-3 rounded text-sm max-w-md mx-auto ${schemaFixResult.error ? 'bg-red-900 bg-opacity-30 text-red-300' : 'bg-green-900 bg-opacity-30 text-green-300'}`}>
                  {schemaFixResult.error ? (
                    <div className="flex items-center">
                      <FaExclamationCircle className="flex-shrink-0 mr-2" />
                      <span>{schemaFixResult.error}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium mb-1">Schema fix attempted:</div>
                      <ul className="list-disc list-inside">
                        {schemaFixResult.actions?.map((action: string, i: number) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                      {schemaFixResult.errors?.length > 0 && (
                        <>
                          <div className="font-medium mt-2 mb-1 text-red-300">Errors:</div>
                          <ul className="list-disc list-inside text-red-300">
                            {schemaFixResult.errors?.map((err: string, i: number) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      <div className="mt-2">
                        <button
                          onClick={() => window.location.reload()}
                          className="text-indigo-300 underline hover:text-indigo-200"
                        >
                          Reload the page to see if it worked
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          // Normal empty state
          <>
            <h3 className="mt-5 text-xl font-medium text-gray-300">No bug reports yet</h3>
            <p className="mt-3 text-gray-400 max-w-md mx-auto">
              When users report bugs through the footer's "Report a Bug" button, they will appear here for you to review.
            </p>
          </>
        )}
      </div>
    );
  };
  
  const openDetailModal = (report: BugReport) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    // Keep the selected report for a moment to avoid UI flicker during close animation
    setTimeout(() => {
      setSelectedReport(null);
    }, 200);
  };
  
  const clearAllReports = async () => {
    try {
      setClearingReports(true);
      setClearError(null);
      
      // Call the API to clear all reports
      const response = await axios.delete('/api/bug-reports/clear');
      
      // Refresh the data
      fetchBugReports();
      fetchStats();
      
      // Close the confirmation modal
      setShowClearConfirmation(false);
      
      // Show success message or handle response
      console.log('Successfully cleared reports:', response.data);
    } catch (err) {
      console.error('Error clearing bug reports:', err);
      setClearError('Failed to clear bug reports. Please try again.');
    } finally {
      setClearingReports(false);
    }
  };
  
  // Function to fix the database schema
  const fixSchema = async () => {
    try {
      setIsFixingSchema(true);
      setSchemaFixResult(null);
      
      // Call the API to fix the schema
      const response = await axios.get('/api/bug-reports/fix-schema');
      setSchemaFixResult(response.data);
    } catch (err: any) {
      console.error('Error fixing schema:', err);
      setSchemaFixResult({
        error: 'Failed to fix schema. See console for details.',
        details: err.response?.data || String(err)
      });
    } finally {
      setIsFixingSchema(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Bug Reports</h1>
          <p className="mt-2 text-gray-400">
            View and manage user-submitted bug reports
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowClearConfirmation(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            <FaTrash className="mr-2" />
            Clear All Reports
          </button>
          
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-lg p-4 flex items-center">
            <div className="text-gray-100 mr-4">
              <div className="text-sm font-medium text-gray-300">Total Reports</div>
              <div className="text-2xl font-bold">{totalReports}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-500 bg-opacity-30 flex items-center justify-center">
              <FaBug className="h-5 w-5 text-indigo-300" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-300 font-medium flex items-center">
                <FaExclamationCircle className="mr-1.5" /> New Reports
              </p>
              <p className="text-3xl font-bold text-white mt-1">{stats.new}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-900 bg-opacity-20 border border-yellow-700 flex items-center justify-center">
              <FaExclamationCircle className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <div className="mt-3">
            <button 
              onClick={() => setStatusFilter('new')}
              className="text-xs font-medium text-yellow-300 hover:text-yellow-200 flex items-center"
            >
              View All New Reports
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300 font-medium flex items-center">
                <FaCheckCircle className="mr-1.5" /> Completed
              </p>
              <p className="text-3xl font-bold text-white mt-1">{stats.completed}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-900 bg-opacity-20 border border-green-700 flex items-center justify-center">
              <FaCheckCircle className="h-5 w-5 text-green-400" />
            </div>
          </div>
          <div className="mt-3">
            <button 
              onClick={() => setStatusFilter('completed')}
              className="text-xs font-medium text-green-300 hover:text-green-200 flex items-center"
            >
              View Completed Reports
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 font-medium flex items-center">
                <FaTimesCircle className="mr-1.5" /> Dismissed
              </p>
              <p className="text-3xl font-bold text-white mt-1">{stats.dismissed}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-gray-700 bg-opacity-30 border border-gray-600 flex items-center justify-center">
              <FaTimesCircle className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="mt-3">
            <button 
              onClick={() => setStatusFilter('dismissed')}
              className="text-xs font-medium text-gray-300 hover:text-gray-200 flex items-center"
            >
              View Dismissed Reports
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border-l-4 border-red-500 text-red-300 rounded-r">
          <div className="flex">
            <FaExclamationCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <div className="bg-gray-800 shadow-lg border border-gray-700 overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-lg leading-6 font-medium text-gray-200 flex items-center">
            <FaBug className="mr-2 text-indigo-400" />
            Bug Reports
          </h2>
          <div className="flex items-center space-x-2 bg-gray-700 rounded-lg pl-3 pr-1 py-1">
            <FaFilter className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="bg-gray-700 text-gray-200 border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md py-1 pl-1 pr-8 text-sm"
            >
              <option value="all">All Reports</option>
              <option value="new">New</option>
              <option value="completed">Completed</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <FaSpinner className="animate-spin h-8 w-8 text-indigo-500 mr-2" />
            <span className="text-gray-400">Loading reports...</span>
          </div>
        ) : reports.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700 bg-opacity-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Report #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider text-center">
                    Status Actions
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-400">
                      #{report.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {report.user?.avatarUrl ? (
                          <div className="flex-shrink-0 h-8 w-8">
                            <Image
                              className="h-8 w-8 rounded-full ring-2 ring-gray-600"
                              src={report.user.avatarUrl}
                              alt={report.user.name}
                              width={32}
                              height={32}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-900 bg-opacity-50 flex items-center justify-center ring-2 ring-gray-600">
                            <span className="text-indigo-300 font-medium text-sm">
                              {report.user?.name ? report.user.name.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-200">
                            {report.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {report.user?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-3">
                        {report.status !== 'completed' && (
                          <button
                            onClick={() => updateStatus(report.id, 'completed')}
                            disabled={updating === report.id}
                            className="text-green-400 hover:text-green-300 transition-colors focus:outline-none"
                            title="Mark as Completed"
                          >
                            {updating === report.id ? (
                              <FaSpinner className="animate-spin h-5 w-5" />
                            ) : (
                              <FaCheckCircle className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        {report.status !== 'dismissed' && (
                          <button
                            onClick={() => updateStatus(report.id, 'dismissed')}
                            disabled={updating === report.id}
                            className="text-red-400 hover:text-red-300 transition-colors focus:outline-none"
                            title="Dismiss"
                          >
                            {updating === report.id ? (
                              <FaSpinner className="animate-spin h-5 w-5" />
                            ) : (
                              <FaTimesCircle className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        {report.status !== 'new' && (
                          <button
                            onClick={() => updateStatus(report.id, 'new')}
                            disabled={updating === report.id}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors focus:outline-none"
                            title="Mark as New"
                          >
                            {updating === report.id ? (
                              <FaSpinner className="animate-spin h-5 w-5" />
                            ) : (
                              <FaExclamationCircle className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => openDetailModal(report)}
                        className="inline-flex items-center px-3 py-1.5 border border-indigo-500 rounded-md text-indigo-400 bg-indigo-900 bg-opacity-30 hover:bg-opacity-50 transition-colors focus:outline-none"
                      >
                        <FaEye className="mr-1.5" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && reports.length > 0 && totalPages > 1 && (
          <div className="border-t border-gray-700 px-6 py-4">
            {renderPagination()}
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      <BugReportDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        report={selectedReport}
        onUpdateStatus={updateStatus}
        isUpdating={updating === selectedReport?.id}
      />
      
      {/* Clear Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            
            <div className="inline-block align-bottom bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FaExclamationCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-200">
                    Clear All Bug Reports
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">
                      Are you sure you want to clear all bug reports? This action cannot be undone.
                      All reports, including attachments, will be permanently deleted and the report number
                      counter will be reset to 1.
                    </p>
                  </div>
                </div>
              </div>
              
              {clearError && (
                <div className="mt-3 p-2 bg-red-900 bg-opacity-30 border-l-4 border-red-500 text-red-300 rounded-r">
                  {clearError}
                </div>
              )}
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={clearAllReports}
                  disabled={clearingReports}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                >
                  {clearingReports ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Clearing...
                    </>
                  ) : (
                    'Clear All Reports'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirmation(false)}
                  disabled={clearingReports}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BugReportsPage; 