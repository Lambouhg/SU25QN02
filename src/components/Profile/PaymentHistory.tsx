"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock, Download } from "lucide-react";

interface PaymentData {
  id: string;
  userId: string;
  servicePackageId: string;
  orderCode: string;
  amount: number;
  refundAmount: number;
  description: string;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
  checkoutUrl: string;
  qrCode: string;
  returnUrl: string;
  cancelUrl: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  servicePackage?: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
  };
}

interface PaymentHistoryProps {
  userId?: string;
}

function PaymentHistory({ }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPaymentHistory = useCallback(async () => {
    console.log('🔄 PaymentHistory: Fetching payment history...');
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/payment/history");
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔄 PaymentHistory: API response:', result);
      
      if (result.success) {
        setPayments(result.data || []);
      } else {
        throw new Error(result.error || "Failed to load payment history");
      }
    } catch (err) {
      console.error("🔄 PaymentHistory: Error fetching payment history:", err);
      setError(err instanceof Error ? err.message : "Không thể tải lịch sử thanh toán");
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🔄 PaymentHistory: useEffect triggered');
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
      case "paid":
        return "text-green-600 bg-green-100";
      case "pending":
      case "processing":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
      case "cancelled":
      case "refunded":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
      case "paid":
        return CheckCircle;
      case "pending":
      case "processing":
        return Clock;
      case "failed":
      case "cancelled":
        return XCircle;
      case "refunded":
        return XCircle;
      default:
        return CreditCard;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch {
      return "Unknown date";
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Lịch sử thanh toán
          </CardTitle>
          <CardDescription>Quản lý và theo dõi các giao dịch của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Lịch sử thanh toán
          </CardTitle>
          <CardDescription>Quản lý và theo dõi các giao dịch của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchPaymentHistory} variant="outline">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const paginatedPayments = payments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Lịch sử thanh toán
        </CardTitle>
        <CardDescription>Quản lý và theo dõi các giao dịch của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Chưa có giao dịch nào</p>
            <p className="text-sm text-gray-500">Lịch sử thanh toán sẽ hiển thị ở đây khi bạn có giao dịch</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedPayments.map((payment, index) => {
                const StatusIcon = getStatusIcon(payment.status);
                const statusColorClasses = getStatusColor(payment.status);
                
                return (
                  <div key={payment.id}>
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-blue-100">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.servicePackage?.name || payment.description || `Giao dịch ${payment.orderCode}`}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-600">{formatDate(payment.createdAt)}</span>
                            <span className="text-sm text-blue-600 font-medium">#{payment.orderCode}</span>
                            {payment.paymentMethod && (
                              <span className="text-sm text-gray-600">{payment.paymentMethod}</span>
                            )}
                          </div>
                          {payment.paidAt && (
                            <div className="text-xs text-green-600 mt-1">
                              Đã thanh toán: {formatDate(payment.paidAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          {formatAmount(payment.amount)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <StatusIcon className="w-4 h-4" />
                          <span className={`text-sm px-2 py-1 rounded-full ${statusColorClasses}`}>
                            {payment.status === "success" ? "Thành công" : 
                             payment.status === "failed" ? "Thất bại" : 
                             payment.status === "pending" ? "Đang xử lý" : payment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    {index < paginatedPayments.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {payments.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, payments.length)} của {payments.length} giao dịch
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage * itemsPerPage >= payments.length}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}

            {/* Export Button */}
            <div className="mt-6 pt-4 border-t">
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Xuất lịch sử thanh toán
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(PaymentHistory, (prevProps, nextProps) => {
  // Only re-render if userId changes
  return prevProps.userId === nextProps.userId;
});
