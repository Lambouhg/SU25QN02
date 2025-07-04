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
      description: '25% off for immediate payment'
    },
    {
      id: 'student',
      name: 'STUDENT50', 
      discount: '50%',
      description: '50% off for students'
    },
    {
      id: 'year',
      name: 'YEAR20',
      discount: '20%', 
      description: '20% off for annual payment'
    }
  ];
  const paymentMethods = [
    {
      id: 'qr',
      name: 'QR Code',
      description: 'Scan QR code to pay',
      icon: <Smartphone className="w-5 h-5" />,
      recommended: true
    },
    {
      id: 'banking',
      name: 'Internet Banking',
      description: 'Online bank transfer',
      icon: <Building className="w-5 h-5" />
    },
    {
      id: 'wallet',
      name: 'E-Wallet',
      description: 'MoMo, ZaloPay, ViettelPay',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'atm',
      name: 'ATM Card',
      description: 'Local bank cards',
      icon: <CreditCard className="w-5 h-5" />
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade to Pro</h1>
          <p className="text-gray-600">Experience full features with Pro plan</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Plan Selection */}
          <div className="lg:col-span-2 space-y-6">            {/* Pro Plan Card */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <h2 className="text-xl font-bold text-gray-900">Pro Plan</h2>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  Monthly billing
                </span>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">$29.99</span>
                  <span className="text-lg text-gray-500 line-through">$39.99</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Auto-renews monthly, cancel anytime
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">256-bit SSL encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">30-day money back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">24/7 instant support</span>
                </div>
              </div>
            </div>            {/* Discount Codes */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount Codes</h3>
              <p className="text-sm text-gray-600 mb-4">Enter discount code</p>
              
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div>
                      <span className="font-medium text-gray-900">{plan.name}</span>
                      <p className="text-xs text-gray-500">{plan.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600">{plan.discount} off</span>
                      <button className="text-xs text-blue-600 hover:text-blue-700">
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Enter discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>            {/* Payment Methods */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
              
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
                          <div className="flex items-center gap-2">                            <span className="font-medium text-gray-900">{method.name}</span>
                            {method.recommended && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="agreement" className="mt-1" />
                  <label htmlFor="agreement" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                      Terms of Service and Privacy Policy of AI Interview
                    </a>
                    . I understand that I can cancel my paid subscription at any time.
                  </label>
                </div>
              </div>
            </div>
          </div>          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pro Plan</span>
                  <span className="font-medium">$29.99</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly billing</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>$29.99</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4">
                Pay $29.99
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  Payment secured by
                </p>
                <p className="text-xs text-gray-500">PayOS</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">256-bit SSL encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">30-day money back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">24/7 instant support</span>
                </div>
              </div>
            </div>            {/* Help Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Need help?</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Contact: support@interview.com
              </p>
              <p className="text-sm text-gray-600">
                Hotline: +1-800-123-456
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
