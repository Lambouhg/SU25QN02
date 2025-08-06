'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { User, MapPin, Calendar, Mail, Phone, Building, Briefcase, FileText, UserCheck } from "lucide-react";

interface PersonalInfoFormProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    bio: string;
  };
  isEditing: boolean;
  onDataChange: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    bio: string;
  }) => void;
  onEditToggle: () => void;
  onSubmit: () => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  isEditing,
  onDataChange,
  onEditToggle,
  onSubmit
}) => {
  const handleFieldChange = (field: string, value: string) => {
    onDataChange({ ...formData, [field]: value });
  };

  // Calculate profile completion percentage
  const completionPercentage = Math.round(
    ((formData.firstName ? 1 : 0) + 
     (formData.lastName ? 1 : 0) + 
     (formData.email ? 1 : 0) + 
     (formData.phone ? 1 : 0) + 
     (formData.department ? 1 : 0) + 
     (formData.position ? 1 : 0) + 
     (formData.bio ? 1 : 0)) / 7 * 100
  );

  return (
    <div className="space-y-6">
      {/* Profile Completion Progress */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-indigo-800">Độ hoàn thiện hồ sơ</h4>
          <span className="text-sm text-indigo-600 font-medium">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-indigo-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Unified Form Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <User className="w-5 h-5 text-blue-600" />
                Thông tin cá nhân
              </CardTitle>
              <CardDescription className="text-gray-600">
                Cập nhật thông tin cá nhân và trạng thái hoạt động của bạn
              </CardDescription>
            </div>
            <Button
              onClick={isEditing ? onSubmit : onEditToggle}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                isEditing 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
              }`}
            >
              {isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-blue-200 pb-2 flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              Thông tin cơ bản
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Họ
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  className={`transition-all duration-200 ${
                    !isEditing 
                      ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600' 
                      : 'border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-400'
                  }`}
                  placeholder="Nhập họ của bạn"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-500" />
                  Tên
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  className={`transition-all duration-200 ${
                    !isEditing 
                      ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600' 
                      : 'border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 hover:border-purple-400'
                  }`}
                  placeholder="Nhập tên của bạn"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-500" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                disabled={!isEditing}
                className={`transition-all duration-200 ${
                  !isEditing 
                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600' 
                    : 'border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 hover:border-green-400'
                }`}
                placeholder="Nhập địa chỉ email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-500" />
                Số điện thoại
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                disabled={!isEditing}
                className={`transition-all duration-200 ${
                  !isEditing 
                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600' 
                    : 'border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 hover:border-orange-400'
                }`}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-500" />
                  Phòng ban
                </Label>
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleFieldChange('department', e.target.value)}
                  disabled={!isEditing}
                  className={`transition-all duration-200 ${
                    !isEditing 
                      ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600' 
                      : 'border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 hover:border-indigo-400'
                  }`}
                  placeholder="Nhập phòng ban"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  Vị trí
                </Label>
                <Input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleFieldChange('position', e.target.value)}
                  disabled={!isEditing}
                  className={`transition-all duration-200 ${
                    !isEditing 
                      ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600' 
                      : 'border-teal-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 hover:border-teal-400'
                  }`}
                  placeholder="Nhập vị trí công việc"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Giới thiệu
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                disabled={!isEditing}
                className={`min-h-[100px] transition-all duration-200 ${
                  !isEditing 
                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-400'
                }`}
                placeholder="Giới thiệu về bản thân..."
              />
            </div>
          </div>

          <Separator />

          {/* Activity Status Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-green-200 pb-2 flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
              Trạng thái hoạt động
            </h3>
            
            {/* Enhanced Status Card */}
            <div className="relative overflow-hidden p-4 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border border-green-200 rounded-xl shadow-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full -mr-10 -mt-10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-30"></div>
                  </div>
                  <div>
                    <span className="font-semibold text-green-800 text-lg">Đang hoạt động</span>
                    <p className="text-sm text-green-600">Lần cuối: vừa xong</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Online
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 transition-all duration-200"
                  >
                    Ẩn trạng thái
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="group hover:scale-105 transition-all duration-200 flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm">
                <div className="p-2 bg-blue-500 rounded-lg shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Ngày tham gia</p>
                  <p className="font-semibold text-blue-800">Tháng 3, 2024</p>
                </div>
              </div>
              
              <div className="group hover:scale-105 transition-all duration-200 flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow-sm">
                <div className="p-2 bg-purple-500 rounded-lg shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Phòng ban</p>
                  <p className="font-semibold text-purple-800">{formData.department || "Chưa cập nhật"}</p>
                </div>
              </div>

              <div className="group hover:scale-105 transition-all duration-200 flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl shadow-sm">
                <div className="p-2 bg-orange-500 rounded-lg shadow-md">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Vị trí</p>
                  <p className="font-semibold text-orange-800">{formData.position || "Chưa cập nhật"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalInfoForm;
