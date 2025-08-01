"use client";

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw, Package, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

const PaymentCancelContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode');

  const handleTryAgain = () => {
    router.push('/Pricing');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black py-16 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
      
      <div className="max-w-4xl mx-auto relative">
        {/* Cancel Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6 shadow-2xl shadow-orange-500/50">
            <XCircle className="h-12 w-12 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-6">
            Thanh toán bị hủy
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Không sao đâu! Bạn có thể thử lại bất cứ lúc nào. Giao dịch của bạn chưa được hoàn tất.
          </p>
          
          {orderCode && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400 text-sm">Mã đơn hàng: {orderCode}</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Why Cancel */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Tại sao thanh toán bị hủy?
              </CardTitle>
              <p className="text-gray-400">Có thể do một trong những lý do sau</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Bảo mật</h4>
                  <p className="text-gray-400 text-sm">
                    Bạn có thể đã hủy để kiểm tra lại thông tin thanh toán hoặc vì lý do bảo mật.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Thời gian</h4>
                  <p className="text-gray-400 text-sm">
                    Phiên thanh toán có thể đã hết hạn hoặc bạn cần thêm thời gian để quyết định.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Gói dịch vụ</h4>
                  <p className="text-gray-400 text-sm">
                    Bạn có thể muốn xem xét lại các gói dịch vụ khác hoặc thay đổi lựa chọn.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Bước tiếp theo
              </CardTitle>
              <p className="text-gray-400">Bạn có thể làm gì bây giờ?</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-400" />
                  Thử lại thanh toán
                </h4>
                <p className="text-gray-400 text-sm mb-4">
                  Quay lại trang gói dịch vụ và thử thanh toán lại. Quá trình này chỉ mất vài phút.
                </p>
                <Button
                  onClick={handleTryAgain}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  Thử lại ngay
                </Button>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-400" />
                  Xem lại gói dịch vụ
                </h4>
                <p className="text-gray-400 text-sm mb-4">
                  So sánh các gói dịch vụ khác nhau để tìm lựa chọn phù hợp nhất với nhu cầu của bạn.
                </p>
                <Button
                  onClick={handleTryAgain}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl font-semibold transition-all duration-300"
                >
                  Xem gói dịch vụ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              Bạn muốn làm gì tiếp theo?
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleTryAgain}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/50 text-lg"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Thử lại thanh toán
                </span>
              </Button>
              
              <Button
                onClick={handleGoToDashboard}
                variant="outline"
                className="px-8 py-4 border-white/20 text-white hover:bg-white/10 rounded-2xl font-semibold transition-all duration-300 text-lg"
              >
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Đi đến Dashboard
                </span>
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="px-8 py-4 border-white/20 text-white hover:bg-white/10 rounded-2xl font-semibold transition-all duration-300 text-lg"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeft className="h-5 w-5" />
                  Về trang chủ
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-sm border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Gặp vấn đề với thanh toán?
            </h3>
            <p className="text-gray-300 mb-6">
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn giải quyết mọi vấn đề
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Hỗ trợ 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Bảo mật 100%</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Hoàn tiền nếu cần</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                Câu hỏi thường gặp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">
                  Tôi có bị mất tiền không?
                </h4>
                <p className="text-gray-400 text-sm">
                  Không, bạn không bị mất tiền. Giao dịch đã bị hủy và không có khoản phí nào được thu.
                </p>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">
                  Tôi có thể thử lại bao nhiêu lần?
                </h4>
                <p className="text-gray-400 text-sm">
                  Bạn có thể thử lại thanh toán không giới hạn số lần. Mỗi lần thử đều an toàn và miễn phí.
                </p>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">
                  Làm sao để thanh toán thành công?
                </h4>
                <p className="text-gray-400 text-sm">
                  Đảm bảo thông tin thẻ chính xác, kết nối internet ổn định và hoàn tất quá trình thanh toán trong thời gian quy định.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const PaymentCancelPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Đang tải...</p>
        </div>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
};

export default PaymentCancelPage; 