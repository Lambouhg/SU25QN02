"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  ArrowRight, 
  Star, 
  CheckCircle, 
  Heart, 
  Users, 
  MessageCircle, 
  Trophy, 
  Sparkles,
  Zap,
  Crown,
  Check
} from "lucide-react";

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  avatarInterviewLimit: number;
  testQuizEQLimit: number;
  jdUploadLimit: number;
}

interface UserPackage {
  servicePackageId: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  servicePackage: ServicePackage;
}

const PricingContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [success, setSuccess] = useState('');
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null);

  useEffect(() => {
    fetch('/api/service-package')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.packages)) {
          setPackages(data.packages);
          setUserPackage(data.userPackage || null);
          
          // Kiểm tra xem có tham số package trong URL không
          const packageParam = searchParams.get('package');
          if (packageParam) {
            // Tìm gói có id trùng khớp
            const foundPackage = data.packages.find((pkg: ServicePackage) => pkg.id === packageParam);
            if (foundPackage) {
              setSelectedId(packageParam);
            }
          }
        } else {
          setPackages([]);
          setUserPackage(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Không thể tải danh sách gói dịch vụ.');
        setLoading(false);
      });
  }, [searchParams]);

  const handleBuy = async () => {
    if (!selectedId) return;
    setBuying(true);
    setBuyError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicePackageId: selectedId })
      });
      const result = await res.json();
      
      if (result && result.error === 0 && result.data) {
        window.location.href = result.data.checkoutUrl;
      } else {
        setBuyError(result.message || 'Có lỗi xảy ra khi tạo thanh toán.');
      }
    } catch {
      setBuyError('Không thể kết nối máy chủ.');
    }
    setBuying(false);
  };

  const handleSelect = (id: string) => {
    // Kiểm tra xem gói có phải là gói hiện tại không
    const isCurrentPackage = userPackage && 
      userPackage.servicePackageId === id && 
      userPackage.isActive && 
      new Date(userPackage.endDate) >= new Date();
    
    // Tìm gói được chọn
    const selectedPackage = packages.find(pkg => pkg.id === id);
    
    // Nếu là gói hiện tại hoặc gói free thì không cho phép chọn
    if (isCurrentPackage || (selectedPackage && selectedPackage.price === 0)) {
      return;
    }
    
    setSelectedId(id);
  };

  const getSelectedPackage = () => {
    return packages.find(pkg => pkg.id === selectedId);
  };

  const getPlanIcon = (pkg: ServicePackage) => {
    if (pkg.price === 0) return <Star className="h-8 w-8" />;
    if (pkg.price <= 100000) return <Zap className="h-8 w-8" />;
    if (pkg.price <= 300000) return <Crown className="h-8 w-8" />;
    return <Trophy className="h-8 w-8" />;
  };

  const getPlanStyle = (pkg: ServicePackage, index: number) => {
    const isPopular = index === 1;
    const isCurrent = userPackage && 
      userPackage.servicePackageId === pkg.id && 
      userPackage.isActive && 
      new Date(userPackage.endDate) >= new Date();
    
    // Gói free luôn được kích hoạt sẵn
    if (pkg.price === 0) {
      return {
        iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
        cardBg: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-300",
        priceColor: "text-green-700",
        popular: false,
        disabled: true // Disabled vì đã được kích hoạt sẵn
      };
    }
    
    if (isCurrent) {
      return {
        iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
        cardBg: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-300",
        priceColor: "text-green-700",
        popular: false,
        disabled: true
      };
    }
    
    if (pkg.price <= 100000) {
      return {
        iconBg: "bg-gradient-to-br from-gray-500 to-slate-600",
        cardBg: "bg-white",
        borderColor: "border-gray-200",
        priceColor: "text-gray-700",
        popular: false,
        disabled: false
      };
    }
    if (pkg.price <= 300000) {
      return {
        iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
        cardBg: isPopular ? "bg-gradient-to-br from-purple-50 to-pink-50" : "bg-white",
        borderColor: isPopular ? "border-purple-300" : "border-purple-200",
        priceColor: "text-purple-600",
        popular: isPopular,
        disabled: false
      };
    }
    return {
      iconBg: "bg-gradient-to-br from-purple-600 to-pink-600",
      cardBg: "bg-gradient-to-br from-purple-100 to-pink-100",
      borderColor: "border-purple-300",
      priceColor: "text-purple-700",
      popular: false,
      disabled: false
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  const selectedPackage = getSelectedPackage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="relative">
        {/* Hero Section */}
        <div className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 mb-8 shadow-2xl">
              <CreditCard className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              Gói Dịch Vụ
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Chọn gói dịch vụ phù hợp để nâng cao kỹ năng phỏng vấn của bạn với công nghệ AI tiên tiến
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          {/* Pricing Cards Section */}
          <div className="mb-16">
            <div className="grid md:grid-cols-3 gap-8">
              {packages.map((pkg, index) => {
                const planStyle = getPlanStyle(pkg, index);
                const isCurrent = userPackage && 
                  userPackage.servicePackageId === pkg.id && 
                  userPackage.isActive && 
                  new Date(userPackage.endDate) >= new Date();
                const isSelected = selectedId === pkg.id;

                return (
                  <Card
                    key={pkg.id}
                    className={`relative transition-all duration-300 h-full ${
                      planStyle.disabled 
                        ? 'cursor-not-allowed' 
                        : 'cursor-pointer hover:scale-105'
                    } ${
                      isSelected && !planStyle.disabled
                        ? 'ring-4 ring-purple-500 ring-opacity-50 shadow-2xl'
                        : planStyle.popular
                        ? "lg:scale-105 shadow-2xl shadow-purple-500/30 border-2 border-purple-300"
                        : `shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 ${planStyle.borderColor}`
                    }`}
                    style={{
                      background: planStyle.cardBg,
                    }}
                    onClick={() => handleSelect(pkg.id)}
                  >
                    {/* Popular Badge */}
                    {planStyle.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm font-bold shadow-xl border border-purple-400/50">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Phổ biến nhất
                        </Badge>
                      </div>
                    )}

                    {/* Current Package Badge */}
                    {isCurrent && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-sm font-bold shadow-xl border border-green-400/50">
                          <Check className="h-4 w-4 mr-2" />
                          Gói hiện tại
                        </Badge>
                      </div>
                    )}

                    {/* Free Package Badge */}
                    {pkg.price === 0 && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-sm font-bold shadow-xl border border-green-400/50">
                          <Check className="h-4 w-4 mr-2" />
                          Đã kích hoạt
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-6 pt-8">
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-6 ${planStyle.iconBg} text-white shadow-xl transition-transform duration-300`}>
                        {getPlanIcon(pkg)}
                      </div>
                      
                      {/* Title and Description */}
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-3">{pkg.name}</CardTitle>
                      <CardContent className="text-gray-600 text-base leading-relaxed mb-6 p-0">
                        {pkg.description}
                      </CardContent>
                      
                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline justify-center gap-2 mb-2">
                          <span className={`text-4xl font-bold ${planStyle.priceColor}`}>
                            {pkg.price === 0 ? 'Miễn phí' : `${pkg.price.toLocaleString()}đ`}
                          </span>
                          {pkg.price > 0 && <span className="text-gray-500 text-lg">/{pkg.duration} ngày</span>}
                        </div>
                        <p className="text-gray-500 text-sm">
                          {pkg.price === 0 ? 'Kích hoạt ngay lập tức' : 'Thanh toán một lần'}
                        </p>
                      </div>
                      
                      {/* Features Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-200">
                          <Heart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                          <div className="text-xl font-bold text-purple-600 mb-1">
                            {pkg.avatarInterviewLimit}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Avatar Interview</div>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-200">
                          <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                          <div className="text-xl font-bold text-orange-600 mb-1">
                            {pkg.testQuizEQLimit}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">EQ/Quiz Tests</div>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-200">
                          <MessageCircle className="h-6 w-6 text-teal-600 mx-auto mb-2" />
                          <div className="text-xl font-bold text-teal-600 mb-1">
                            {pkg.jdUploadLimit}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">JD Upload</div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="text-center pb-6">
                      {/* Features List */}
                      <div className="space-y-3 text-left mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">Advanced analytics & feedback</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">Priority customer support</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">Real-time performance tracking</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {!planStyle.disabled && (
                        <Button
                          className="w-full py-3 text-base font-semibold transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl rounded-xl"
                          disabled={buying}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleSelect(pkg.id); 
                            handleBuy();
                          }}
                        >
                          <span className="flex items-center justify-center gap-2">
                            Mua gói
                            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </Button>
                      )}

                      {/* Free package - already activated */}
                      {pkg.price === 0 && (
                        <div className="w-full py-3 text-base font-semibold bg-green-100 text-green-700 rounded-xl flex items-center justify-center gap-2">
                          <Check className="h-5 w-5" />
                          Đã kích hoạt
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Selected Package Summary */}
          {selectedPackage && (
            <div className="mb-16">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="pb-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Trophy className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl font-bold text-gray-900">
                          Gói Đã Chọn: {selectedPackage.name}
                        </CardTitle>
                        <p className="text-gray-600 mt-2 text-lg">
                          {selectedPackage.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {selectedPackage.price === 0 ? 'Miễn phí' : `${selectedPackage.price.toLocaleString()}đ`}
                      </div>
                      {selectedPackage.price > 0 && (
                        <div className="text-gray-500 text-lg">
                          /{selectedPackage.duration} ngày
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-3 gap-8 mb-8">
                    <div className="text-center p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                      <Heart className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {selectedPackage.avatarInterviewLimit}
                      </div>
                      <div className="text-base text-gray-600 font-medium">Avatar Interview</div>
                    </div>
                    <div className="text-center p-6 rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                      <Users className="h-10 w-10 text-orange-600 mx-auto mb-4" />
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {selectedPackage.testQuizEQLimit}
                      </div>
                      <div className="text-base text-gray-600 font-medium">EQ/Quiz Tests</div>
                    </div>
                    <div className="text-center p-6 rounded-3xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200">
                      <MessageCircle className="h-10 w-10 text-teal-600 mx-auto mb-4" />
                      <div className="text-3xl font-bold text-teal-600 mb-2">
                        {selectedPackage.jdUploadLimit}
                      </div>
                      <div className="text-base text-gray-600 font-medium">JD Upload</div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      className="px-16 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300"
                      disabled={
                        buying ||
                        !!(
                          userPackage &&
                          userPackage.servicePackageId === selectedId &&
                          userPackage.isActive &&
                          new Date(userPackage.endDate) >= new Date()
                        )
                      }
                      onClick={selectedPackage.price === 0 ? () => {} : handleBuy}
                    >
                      <span className="flex items-center gap-4">
                        {selectedPackage.price === 0 ? 'Đã kích hoạt' : 'Tiến hành thanh toán'}
                        {selectedPackage.price > 0 && <ArrowRight className="h-6 w-6" />}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error and Success Messages */}
          {(buyError || success) && (
            <div className="mb-16">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                <CardContent className="p-8">
                  {buyError && (
                    <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-bold">!</span>
                        </div>
                        <span className="text-red-700 font-semibold text-xl">Lỗi thanh toán</span>
                      </div>
                      <p className="text-red-600 text-lg">{buyError}</p>
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                        <span className="text-green-700 font-semibold text-xl">Thành công</span>
                      </div>
                      <p className="text-green-600 text-lg">{success}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PricingPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
};

export default PricingPage; 