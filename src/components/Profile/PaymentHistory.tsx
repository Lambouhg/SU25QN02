"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  servicePackage?: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
  };
  transactionId?: string;
  notes?: string;
}

interface PaymentHistoryProps {
  userId?: string;
}

export default function PaymentHistory({ }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/payment/history");
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }
      
      const result = await response.json();
      
      if (result.success) {
        setPayments(result.data || []);
      } else {
        throw new Error(result.error || "Failed to load payment history");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching payment history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
      case "cancelled":
      case "refunded":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
      case "paid":
        return "✅";
      case "pending":
      case "processing":
        return "⏳";
      case "failed":
      case "cancelled":
        return "❌";
      case "refunded":
        return "↩️";
      default:
        return "💳";
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading payment history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div>
              <h4 className="text-red-800 font-medium">Error loading payment history</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchPaymentHistory}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = payments.slice(startIndex, endIndex);

  const totalAmount = payments
    .filter(p => ["completed", "success", "paid"].includes(p.status.toLowerCase()))
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Payment History</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span>{payments.length} transactions</span>
          </div>
          {totalAmount > 0 && (
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              Total: {formatCurrency(totalAmount)}
            </div>
          )}
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h4>
          <p className="text-gray-600">You haven&apos;t made any payments yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {currentPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getStatusIcon(payment.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(payment.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {payment.servicePackage?.name || "Service Payment"}
                        </h4>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </span>
                      </div>
                      
                      {payment.servicePackage?.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {payment.servicePackage.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {payment.paymentMethod && (
                          <span>Payment: {payment.paymentMethod}</span>
                        )}
                        {payment.servicePackage?.duration && (
                          <span>Duration: {payment.servicePackage.duration} days</span>
                        )}
                        {payment.transactionId && (
                          <span>ID: {payment.transactionId}</span>
                        )}
                      </div>
                      
                      {payment.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Note: {payment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, payments.length)} of{" "}
                {payments.length} payments
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
