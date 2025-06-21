"use client";

import { useState } from 'react';
import { Check, Star, CreditCard, Smartphone, Building, HelpCircle } from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';

export default function BillingPage() {
  const [paymentMethod, setPaymentMethod] = useState('qr');
  const [discountCode, setDiscountCode] = useState('');

  const plans = [
    {
      id: 'welcome',
      name: 'WELCOME25',
      discount: '25%',
      description: 'Giảm 25% khi thanh toán ngay'
    },
    {
      id: 'student',
      name: 'STUDENT50', 
      discount: '50%',
      description: 'Giảm 50% cho sinh viên'
    },
    {
      id: 'year',
      name: 'YEAR20',
      discount: '20%', 
      description: 'Giảm 20% khi thanh toán năm'
    }
  ];

  const paymentMethods = [
    {
      id: 'qr',
      name: 'QR Code',
      description: 'Quét mã QR để thanh toán',
      icon: <Smartphone className="w-5 h-5" />,
      recommended: true
    },
    {
      id: 'banking',
      name: 'Internet Banking',
      description: 'Chuyển khoản trực tuyến ngân hàng',
      icon: <Building className="w-5 h-5" />
    },
    {
      id: 'wallet',
      name: 'Ví điện tử',
      description: 'MoMo, ZaloPay, ViettelPay',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'atm',
      name: 'Thẻ ATM',
      description: 'Thẻ nội địa các ngân hàng',
      icon: <CreditCard className="w-5 h-5" />
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nâng cấp gói Pro</h1>
          <p className="text-gray-600">Trải nghiệm đầy đủ các tính năng với gói Pro</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Plan Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pro Plan Card */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <h2 className="text-xl font-bold text-gray-900">Gói Pro</h2>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  Thành toán 1 tháng
                </span>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">299.000 đ</span>
                  <span className="text-lg text-gray-500 line-through">399.000 đ</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Tự động gia hạn hàng tháng, có thể hủy bất kỳ lúc nào
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Mã hóa SSL 256-bit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Hoàn tiền trong 30 ngày</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Hỗ trợ 24/7 tức thời</span>
                </div>
              </div>
            </div>

            {/* Discount Codes */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mã giảm giá</h3>
              <p className="text-sm text-gray-600 mb-4">Nhập mã giảm giá</p>
              
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div>
                      <span className="font-medium text-gray-900">{plan.name}</span>
                      <p className="text-xs text-gray-500">{plan.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600">Giảm {plan.discount}</span>
                      <button className="text-xs text-blue-600 hover:text-blue-700">
                        Áp dụng
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h3>
              
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="relative">
                    <input
                      type="radio"
                      id={method.id}
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <label
                      htmlFor={method.id}
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === method.id
                          ? 'border-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {paymentMethod === method.id && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 flex-1">
                        {method.icon}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{method.name}</span>
                            {method.recommended && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                Phổ biến
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="agreement" className="mt-1" />
                  <label htmlFor="agreement" className="text-sm text-gray-700">
                    Tôi đồng ý với{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                      Điều khoản sử dụng và Chính sách bảo mật của AI
                    </a>
                    . Interview. Tôi hiểu rằng tôi có thể hủy đăng ký với các tính năng có tính phí bất cứ lúc nào.
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gói Pro</span>
                  <span className="font-medium">299.000 đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thành toán 1 tháng</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Tổng cộng</span>
                    <span>299.000 đ</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4">
                Thanh toán 299.000 đ
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  Thanh toán được bảo mật bởi
                </p>
                <p className="text-xs text-gray-500">PayOS</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Mã hóa SSL 256-bit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Hoàn tiền trong 30 ngày</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Hỗ trợ 24/7 tức thời</span>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Cần hỗ trợ?</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Liên hệ: support@interview.vn
              </p>
              <p className="text-sm text-gray-600">
                Hotline: 1900-123-456
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
