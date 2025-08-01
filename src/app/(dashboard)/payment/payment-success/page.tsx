"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Package, Clock, Users, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';
interface PaymentSuccessData {
  orderCode: string;
  amount: number;
  packageName: string;
  duration: number;
  avatarInterviewLimit: number;
  testQuizEQLimit: number;
  jdUploadLimit: number;
  startDate: string;
  endDate: string;
}

const PaymentSuccessContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderCode = searchParams.get('orderCode');
    if (orderCode) {
      // Fetch payment details
      fetchPaymentDetails(orderCode);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchPaymentDetails = async (orderCode: string) => {
    try {
      const response = await fetch(`/api/payment/verify?orderCode=${orderCode}`);
      const data = await response.json();
      if (data.success) {
        setPaymentData(data.data);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleStartUsing = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Đang xác thực thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black py-16 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
      
      <div className="max-w-4xl mx-auto relative">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6 shadow-2xl shadow-green-500/50 animate-pulse">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-6">
            Thanh toán thành công!
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Cảm ơn bạn đã tin tưởng chúng tôi. Gói dịch vụ của bạn đã được kích hoạt thành công.
          </p>
        </div>

        {/* Payment Details */}
        {paymentData && (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl mb-8 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Chi tiết giao dịch
              </CardTitle>
              <p className="text-gray-400">Mã đơn hàng: {paymentData.orderCode}</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Package Info */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="h-6 w-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">{paymentData.packageName}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {paymentData.avatarInterviewLimit}
                    </div>
                    <div className="text-sm text-gray-400">Avatar Interview</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {paymentData.testQuizEQLimit}
                    </div>
                    <div className="text-sm text-gray-400">EQ/Quiz Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                      {paymentData.jdUploadLimit}
                    </div>
                    <div className="text-sm text-gray-400">JD Upload</div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Thời gian sử dụng
                  </h4>
                  <div className="space-y-2 text-gray-300">
                    <div className="flex justify-between">
                      <span>Ngày bắt đầu:</span>
                      <span className="text-white font-medium">
                        {new Date(paymentData.startDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ngày kết thúc:</span>
                      <span className="text-white font-medium">
                        {new Date(paymentData.endDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời hạn:</span>
                      <span className="text-green-400 font-medium">{paymentData.duration} ngày</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-400" />
                    Thông tin thanh toán
                  </h4>
                  <div className="space-y-2 text-gray-300">
                    <div className="flex justify-between">
                      <span>Mã đơn hàng:</span>
                      <span className="text-white font-mono">{paymentData.orderCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tiền:</span>
                      <span className="text-green-400 font-bold text-lg">
                        {paymentData.amount.toLocaleString()}đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className="text-green-400 font-medium">Đã thanh toán</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-3xl mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Bạn có thể bắt đầu sử dụng ngay!
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Avatar Interview</h4>
                <p className="text-gray-400 text-sm">Luyện tập phỏng vấn với AI</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">EQ/Quiz Tests</h4>
                <p className="text-gray-400 text-sm">Kiểm tra kỹ năng và EQ</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">JD Upload</h4>
                <p className="text-gray-400 text-sm">Tải lên JD và nhận câu hỏi</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleStartUsing}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-500/50 text-lg"
              >
                <span className="flex items-center gap-2">
                  Bắt đầu sử dụng ngay
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
              
              <Button
                onClick={handleGoToDashboard}
                variant="outline"
                className="px-8 py-4 border-white/20 text-white hover:bg-white/10 rounded-2xl font-semibold transition-all duration-300 text-lg"
              >
                Đi đến Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Info */}
        <div className="text-center">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Cần hỗ trợ?
            </h3>
            <p className="text-gray-400 mb-6">
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Hỗ trợ 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Phản hồi trong 2h</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Bảo hành 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentSuccessPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Đang tải...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
};

export default PaymentSuccessPage; 