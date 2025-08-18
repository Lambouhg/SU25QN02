'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingCompleteProps {
  onContinue: () => void;
}

const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({ onContinue }) => {
  useEffect(() => {
    // Auto redirect after 3 seconds
    const timer = setTimeout(() => {
      onContinue();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Chúc mừng!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Bạn đã hoàn thành quá trình thiết lập tài khoản
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Hồ sơ cá nhân đã được cập nhật</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Vị trí công việc đã được chọn</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Kỹ năng đã được ghi nhận</span>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={onContinue}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Bắt đầu sử dụng
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Tự động chuyển hướng trong 3 giây...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingComplete;
