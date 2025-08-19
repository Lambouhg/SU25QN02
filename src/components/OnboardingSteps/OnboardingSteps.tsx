'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ChevronLeft, ChevronRight, User, Briefcase, Star, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import OnboardingComplete from './OnboardingComplete';

interface JobRole {
  id: string;
  key: string;
  title: string;
  level: string;
  description?: string;
  category?: {
    id: string;
    name: string;
    skills?: string[];
  };
  specialization?: {
    id: string;
    name: string;
  };
}

interface OnboardingData {
  jobRoleId?: string;
  experienceLevel?: 'junior' | 'mid' | 'senior';
  skills: string[];
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  department?: string;
  joinDate?: string;
}

interface OnboardingStepsProps {
  onComplete: () => void;
}

const OnboardingSteps: React.FC<OnboardingStepsProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const FALLBACK_SKILLS_BY_ROLE: Record<string, string[]> = {
    frontend: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind', 'Redux', 'HTML5', 'CSS3'],
    backend: ['Node.js', 'Express', 'NestJS', 'TypeScript', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker'],
    fullstack: ['React', 'Next.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
    mobile: ['React Native', 'Flutter', 'TypeScript'],
    devops: ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
  };
  const [skillIconMap] = useState<Record<string, string>>({
    react: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
    vue: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg',
    angular: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg',
    javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
    typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
    node: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg',
    next: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg',
    tailwind: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-plain.svg',
    html: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
    css: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg',
    redux: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redux/redux-original.svg'
  });
  const [brokenIcons, setBrokenIcons] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const getTodayDateStr = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const [data, setData] = useState<OnboardingData>({
    skills: [],
    joinDate: typeof window === 'undefined' ? undefined : undefined,
  });
  const [newSkill, setNewSkill] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [initialUserSkills, setInitialUserSkills] = useState<string[] | null>(null);
  const [skillsPrefilled, setSkillsPrefilled] = useState(false);
  
  const getSkillIcon = (skillName: string) => {
    const key = skillName.trim().toLowerCase();
    const entry = Object.keys(skillIconMap).find(k => key.includes(k));
    const url = entry ? skillIconMap[entry] : '';
    if (!url || brokenIcons[key]) {
      return <span className="mr-1">🔧</span>;
    }
    return (
      // use plain img to allow simple onError fallback
      <img
        src={url}
        alt={skillName}
        width={16}
        height={16}
        className="mr-1 object-contain"
        onError={() => setBrokenIcons(prev => ({ ...prev, [key]: true }))}
      />
    );
  };

  const steps = [
    {
      id: 'job-role',
      title: 'Chọn vị trí công việc',
      description: 'Chọn vị trí công việc mà bạn muốn phát triển',
      icon: Briefcase
    },
    {
      id: 'experience',
      title: 'Trình độ kinh nghiệm',
      description: 'Chọn mức độ kinh nghiệm hiện tại của bạn',
      icon: Star
    },
    {
      id: 'skills',
      title: 'Kỹ năng của bạn',
      description: 'Thêm các kỹ năng chính của bạn',
      icon: FileText
    },
    {
      id: 'profile',
      title: 'Thông tin cá nhân',
      description: 'Hoàn thiện thông tin cá nhân',
      icon: User
    }
  ];

  useEffect(() => {
    fetchJobRoles();
    loadFromLocalDraftThenUser();
  }, []);

  // Ensure default join date when profile step is opened or when data loads without joinDate
  useEffect(() => {
    if (!data.joinDate) {
      setData(prev => ({ ...prev, joinDate: getTodayDateStr() }));
    }
  }, [data.joinDate]);

  const fetchJobRoles = async () => {
    try {
      const response = await fetch('/api/positions');
      if (response.ok) {
        const roles = await response.json();
        setJobRoles(roles);
      }
    } catch {}
  };

  // Derived filters for Category and Specialization (based on available JobRoles)
  const categories = React.useMemo(() => {
    return Array.from(
      new Set(
        jobRoles
          .map((r) => r.category?.name)
          .filter((n): n is string => Boolean(n))
      )
    ).sort();
  }, [jobRoles]);

  const specializations = React.useMemo(() => {
    return Array.from(
      new Set(
        jobRoles
          .filter((r) => (selectedCategory ? r.category?.name === selectedCategory : true))
          .map((r) => r.specialization?.name)
          .filter((n): n is string => Boolean(n))
      )
    ).sort();
  }, [jobRoles, selectedCategory]);

  // Update suggested skills when job role changes
  useEffect(() => {
    if (!data.jobRoleId) {
      setSuggestedSkills([]);
      return;
    }
    const role = jobRoles.find(r => r.id === data.jobRoleId);
    let categorySkills = role?.category?.skills || [];
    if (categorySkills.length === 0) {
      const key = (role?.key || role?.title || '').toLowerCase();
      const fallbackKey = Object.keys(FALLBACK_SKILLS_BY_ROLE).find(k => key.includes(k));
      categorySkills = fallbackKey ? FALLBACK_SKILLS_BY_ROLE[fallbackKey] : [];
    }
    setSuggestedSkills(categorySkills);
  }, [data.jobRoleId, jobRoles]);

  // Prefill user's selected skills as intersection(user skills, category skills) once per role selection
  useEffect(() => {
    if (!data.jobRoleId) return;
    if (skillsPrefilled) return;
    if ((suggestedSkills || []).length === 0) return;
    const base = Array.isArray(initialUserSkills)
      ? initialUserSkills
      : (Array.isArray(data.skills) ? data.skills : []);
    const currentSkills = Array.isArray(data.skills) ? data.skills : [];
    const isUntouched = (currentSkills.length === 0) || (Array.isArray(initialUserSkills) && currentSkills.join('|') === initialUserSkills.join('|'));
    if (!isUntouched) return;
    const intersection = base.filter(s => suggestedSkills.includes(s));
    if (intersection.length > 0) {
      setData(prev => ({ ...prev, skills: Array.from(new Set(intersection)) }));
      setSkillsPrefilled(true);
    }
  }, [data.jobRoleId, suggestedSkills, skillsPrefilled, initialUserSkills, data.skills]);

  const DRAFT_KEY = 'onboarding_draft_v1';

  const loadFromLocalDraftThenUser = async () => {
    try {
      // 1) Read from localStorage
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          try {
            const draft = JSON.parse(raw);
            setData(prev => {
              const draftSkills = draft?.['skills']?.skills;
              const profile = draft?.['profile'] || {};
              return {
                ...prev,
                jobRoleId: draft?.['job-role']?.jobRoleId ?? prev.jobRoleId,
                experienceLevel: draft?.['experience']?.experienceLevel ?? prev.experienceLevel,
                skills: Array.isArray(draftSkills) ? draftSkills : (Array.isArray(prev.skills) ? prev.skills : []),
                firstName: profile.firstName ?? prev.firstName,
                lastName: profile.lastName ?? prev.lastName,
                phone: profile.phone ?? prev.phone,
                bio: profile.bio ?? prev.bio,
                department: profile.department ?? prev.department,
                joinDate: profile.joinDate ?? prev.joinDate,
              } as OnboardingData;
            });
          } catch {}
        }
      }

      // 2) Fill from current user as fallback
      const response = await fetch('/api/user/current');
      if (response.ok) {
        const user = await response.json();
        setData(prev => ({
          ...prev,
          jobRoleId: prev.jobRoleId || user.preferredJobRoleId,
          experienceLevel: prev.experienceLevel || user.experienceLevel,
          skills: (Array.isArray(prev.skills) && prev.skills.length > 0)
            ? prev.skills
            : (Array.isArray(user.skills) ? user.skills : []),
          firstName: prev.firstName || user.firstName,
          lastName: prev.lastName || user.lastName,
          phone: prev.phone || user.phone,
          bio: prev.bio || user.bio,
          department: prev.department || user.department,
          joinDate: prev.joinDate || user.joinDate
        }));
        if (!initialUserSkills) {
          setInitialUserSkills(Array.isArray(user.skills) ? user.skills : []);
        }
      }
    } catch {}
  };

  const saveStep = async (stepData: Partial<OnboardingData>) => {
    setLoading(true);
    try {
      // Save draft to localStorage only
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(DRAFT_KEY);
        const draft = raw ? JSON.parse(raw) : {};
        draft[steps[currentStep].id] = stepData;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
      setData(prev => ({ ...prev, ...stepData }));
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const currentStepData = getCurrentStepData();
    if (!currentStepData) return;

    const success = await saveStep(currentStepData);
    if (success) {
      if (currentStep === steps.length - 1) {
        // Hoàn thành onboarding
        await completeOnboarding();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isValidPhone = (value: string) => {
    const normalized = value.replace(/\s|-/g, '');
    const vnPattern = /^(\+?84|0)([3|5|7|8|9])\d{8}$/;
    return vnPattern.test(normalized);
  };

  const getCurrentStepData = () => {
    switch (steps[currentStep].id) {
      case 'job-role':
        return data.jobRoleId ? { jobRoleId: data.jobRoleId } : null;
      case 'experience':
        return data.experienceLevel ? { experienceLevel: data.experienceLevel } : null;
      case 'skills':
        return { skills: data.skills };
      case 'profile':
        // basic validation for phone (no state updates during render)
        if (!data.phone || !isValidPhone(data.phone)) {
          return null;
        }
        return {
          firstName: data.firstName,
          lastName: data.lastName,
          bio: data.bio,
          department: data.department,
          joinDate: data.joinDate
        };
      default:
        return null;
    }
  };

  const validateAndSetPhone = (value: string) => {
    // Cho phép +84 hoặc 0, theo chuẩn VN: 10 chữ số sau khi chuẩn hóa
    if (!isValidPhone(value)) {
      setPhoneError('Số điện thoại không hợp lệ (ví dụ: 0912345678 hoặc +84912345678)');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const completeOnboarding = async () => {
    try {
      // 1) Read full draft from localStorage then persist
      let payload = { ...data } as any;
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          try {
            const draft = JSON.parse(raw);
            payload = {
              jobRoleId: draft['job-role']?.jobRoleId ?? data.jobRoleId,
              experienceLevel: draft['experience']?.experienceLevel ?? data.experienceLevel,
              skills: draft['skills']?.skills ?? data.skills,
              firstName: draft['profile']?.firstName ?? data.firstName,
              lastName: draft['profile']?.lastName ?? data.lastName,
              phone: draft['profile']?.phone ?? data.phone,
              bio: draft['profile']?.bio ?? data.bio,
              department: draft['profile']?.department ?? data.department,
              joinDate: draft['profile']?.joinDate ?? data.joinDate,
            };
          } catch {}
        }
      }

      const response = await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // create a welcome activity to kick off streak = 1
        try {
          await fetch('/api/user/activity', { method: 'POST' });
        } catch {}

        // clear local draft
        if (typeof window !== 'undefined') {
          localStorage.removeItem(DRAFT_KEY);
          // flag to show reminder popup on dashboard
          localStorage.setItem('showStreakReminderAfterOnboarding', '1');
        }
        setIsCompleted(true);
      }
    } catch {}
  };

  const addSkill = () => {
    const currentSkills = Array.isArray(data.skills) ? data.skills : [];
    if (newSkill.trim() && !currentSkills.includes(newSkill.trim())) {
      setData(prev => ({
        ...prev,
        skills: [ ...(Array.isArray(prev.skills) ? prev.skills : []), newSkill.trim() ]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setData(prev => ({
      ...prev,
      skills: (Array.isArray(prev.skills) ? prev.skills : []).filter(skill => skill !== skillToRemove)
    }));
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'job-role':
        return (
          <div className="space-y-4">
            {/* Category & Specialization Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Ngành/Lĩnh vực lớn (Category)</Label>
                <Select value={selectedCategory} onValueChange={(val) => {
                  setSelectedCategory(val);
                  setSelectedSpecialization('');
                  setData((prev) => ({ ...prev, jobRoleId: undefined }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">Chuyên môn (Specialization)</Label>
                <Select value={selectedSpecialization} onValueChange={(val) => {
                  setSelectedSpecialization(val);
                  setData((prev) => ({ ...prev, jobRoleId: undefined }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn Specialization (tuỳ chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobRoles
                .filter((role) => (selectedCategory ? role.category?.name === selectedCategory : true))
                .filter((role) => (selectedSpecialization ? role.specialization?.name === selectedSpecialization : true))
                .map((role) => (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all ${
                    data.jobRoleId === role.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setData(prev => ({ ...prev, jobRoleId: role.id }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{role.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {role.level}
                      </Badge>
                    </div>
                    {role.category && (
                      <p className="text-xs text-gray-600 mb-1">
                        {role.category.name}
                      </p>
                    )}
                    {role.specialization && (
                      <p className="text-xs text-gray-500">
                        {role.specialization.name}
                      </p>
                    )}
                    {data.jobRoleId === role.id && (
                      <CheckCircle className="w-5 h-5 text-blue-500 mt-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'junior', label: 'Junior', description: '0-2 năm kinh nghiệm' },
                { value: 'mid', label: 'Mid-level', description: '2-5 năm kinh nghiệm' },
                { value: 'senior', label: 'Senior', description: '5+ năm kinh nghiệm' }
              ].map((level) => (
                <Card
                  key={level.value}
                  className={`cursor-pointer transition-all ${
                    data.experienceLevel === level.value
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setData(prev => ({ ...prev, experienceLevel: level.value as any }))}
                >
                  <CardContent className="p-6 text-center">
                    <h3 className="font-semibold mb-2">{level.label}</h3>
                    <p className="text-sm text-gray-600">{level.description}</p>
                    {data.experienceLevel === level.value && (
                      <CheckCircle className="w-6 h-6 text-blue-500 mt-3 mx-auto" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-4">
            {suggestedSkills.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">Gợi ý theo vị trí đã chọn</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.map((skill, idx) => {
                    const isSelected = data.skills.includes(skill);
                    return (
                      <Badge
                        key={idx}
                        variant={isSelected ? 'default' : 'secondary'}
                        className={`cursor-pointer px-2 py-1 ${isSelected ? 'bg-blue-600 text-white' : 'bg-white'}`}
                        onClick={() => {
                          setData(prev => ({
                            ...prev,
                            skills: isSelected
                              ? prev.skills.filter(s => s !== skill)
                              : [...prev.skills, skill]
                          }));
                        }}
                      >
                        <span className="flex items-center gap-1">
                          {getSkillIcon(skill)}
                          {skill}
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Thêm kỹ năng..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button onClick={addSkill} disabled={!newSkill.trim()}>
                Thêm
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(data.skills) ? data.skills : []).map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100"
                  onClick={() => removeSkill(skill)}
                >
                  {skill} ×
                </Badge>
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Tên</Label>
                <Input
                  id="firstName"
                  value={data.firstName || ''}
                  onChange={(e) => setData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Nhập tên của bạn"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Họ</Label>
                <Input
                  id="lastName"
                  value={data.lastName || ''}
                  onChange={(e) => setData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Nhập họ của bạn"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={data.phone || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setData(prev => ({ ...prev, phone: value }));
                  if (value) {
                    validateAndSetPhone(value);
                  } else {
                    setPhoneError('Số điện thoại là bắt buộc');
                  }
                }}
                placeholder="Nhập số điện thoại"
              />
              {phoneError && (
                <p className="text-xs text-red-600 mt-1">{phoneError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="department">Phòng ban</Label>
              <Input
                id="department"
                value={data.department || ''}
                onChange={(e) => setData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Nhập phòng ban"
              />
            </div>
            <div>
              <Label htmlFor="joinDate">Ngày tham gia</Label>
              <Input
                id="joinDate"
                type="date"
                value={data.joinDate || ''}
                onChange={(e) => setData(prev => ({ ...prev, joinDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bio">Giới thiệu</Label>
              <Textarea
                id="bio"
                value={data.bio || ''}
                onChange={(e) => setData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Giới thiệu ngắn về bản thân..."
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isCompleted) {
    return <OnboardingComplete onContinue={onComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Chào mừng bạn đến với hệ thống!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Hãy hoàn thành các bước sau để cá nhân hóa trải nghiệm của bạn
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Bước {currentStep + 1} / {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center space-y-2 ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs text-center max-w-20">{step.title}</span>
                </div>
              );
            })}
          </div>

          {/* Current Step Content */}
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 mt-1">
                {steps[currentStep].description}
              </p>
            </div>
            
            <div className="min-h-[300px]">
              {renderStepContent()}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={loading || !getCurrentStepData()}
              className="flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingSteps;
