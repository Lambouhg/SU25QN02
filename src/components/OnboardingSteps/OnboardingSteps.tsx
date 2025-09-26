"use client"

import React, { useState, useRef, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  Server,
  Layers,
  CheckCircle,
  Award,
  Calendar,
  Building2,
  Sparkles,
  Briefcase,
  Search,
  Filter,
  X,
} from "lucide-react"
import OnboardingComplete from "./OnboardingComplete"
import { useRouter } from "next/navigation"

type OnboardingStep = 1 | 2 | 3 | 4

// Interface cho JobRole từ API
interface JobRole {
  id: string
  key: string
  title: string
  level: string
  description?: string
  category?: {
    id: string
    name: string
    skills?: string[]
  }
  specialization?: {
    id: string
    name: string
  }
}

interface FormData {
  jobRole: string
  experienceLevel: string
  skills: string[]
  firstName: string
  lastName: string
  phone: string
  department: string
  joinDate: string
  bio: string
}
interface FormErrors {
  firstName?: string
  lastName?: string
  phone?: string
  department?: string
  joinDate?: string
  jobRole?: string
  experienceLevel?: string
  skills?: string
}

export default function OnboardingSteps() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [formData, setFormData] = useState<FormData>({
    jobRole: "",
    experienceLevel: "",
    skills: [],
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
    joinDate: new Date().toISOString().split('T')[0],
    bio: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const [isCompleted, setIsCompleted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Fetch job roles from API
  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/positions')
        if (response.ok) {
          const data = await response.json()
          setJobRoles(data || [])
        } else {
          console.error('Failed to fetch job roles')
          setJobRoles([])
        }
      } catch (error) {
        console.error('Error fetching job roles:', error)
        setJobRoles([])
      } finally {
        setLoading(false)
      }
    }

    fetchJobRoles()
  }, [])

  // Fetch user profile data to pre-fill firstName and lastName
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/current')
        if (response.ok) {
          const userData = await response.json()
          if (userData) {
            setFormData(prev => ({
              ...prev,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              phone: userData.phone || '',
              bio: userData.bio || '',
              department: userData.department || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [])

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory])

  // Auto-fill skills when job role is selected (only once)
  const [hasAutoFilledSkills, setHasAutoFilledSkills] = useState(false)
  
  useEffect(() => {
    if (formData.jobRole && formData.skills.length === 0 && !hasAutoFilledSkills && jobRoles.length > 0) {
      const selectedRole = jobRoles.find(role => role.id === formData.jobRole)
      if (selectedRole) {
        // Get skills from category or fallback
        let skillsToAdd: string[] = []
        
        if (selectedRole.category?.skills && selectedRole.category.skills.length > 0) {
          skillsToAdd = selectedRole.category.skills.slice(0, 5) // Limit to 5 skills
        } else {
          skillsToAdd = getJobRoleSkills(selectedRole).slice(0, 5)
        }
        
        if (skillsToAdd.length > 0) {
          console.log('🎯 Auto-filling skills for role:', selectedRole.title, skillsToAdd)
          setFormData(prev => ({ ...prev, skills: skillsToAdd }))
          setHasAutoFilledSkills(true)
        }
      }
    }
  }, [formData.jobRole, jobRoles, formData.skills.length, hasAutoFilledSkills])

  // Filter and search logic
  const filteredJobRoles = React.useMemo(() => {
    const filtered = jobRoles.filter((role) => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (role.category?.name && role.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Category filter - Fixed: Handle null/undefined categories properly
      const matchesCategory = selectedCategory === "all" || 
        (selectedCategory === "uncategorized" && !role.category?.name) ||
        (role.category?.name && role.category.name.toLowerCase() === selectedCategory.toLowerCase())
      
      return matchesSearch && matchesCategory
    })
    
    return filtered
  }, [jobRoles, searchTerm, selectedCategory])

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(jobRoles.map(role => role.category?.name).filter(Boolean))
    )
    return uniqueCategories
  }, [jobRoles])

  // Check if there are roles without categories
  const hasUncategorizedRoles = React.useMemo(() => {
    return jobRoles.some(role => !role.category?.name)
  }, [jobRoles])


  // Pagination logic
  const paginationData = React.useMemo(() => {
    const totalPages = Math.ceil(filteredJobRoles.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentJobRoles = filteredJobRoles.slice(startIndex, endIndex)
    
    return { totalPages, startIndex, endIndex, currentJobRoles }
  }, [filteredJobRoles, currentPage, itemsPerPage])

  const { totalPages, currentJobRoles } = paginationData

  // Tạo experience levels động từ JobRole.level của role đã chọn
  const experienceLevels = React.useMemo(() => {
    // Chỉ hiển thị 3 levels tương ứng với database enum ExperienceLevel
    const allLevels = [
      { id: "junior", title: "Junior Level", description: "Building foundational skills and gaining hands-on experience", years: "1-3 years of experience" },
      { id: "mid", title: "Mid-Level", description: "Developing expertise and taking on complex technical challenges", years: "3-5 years of experience" },
      { id: "senior", title: "Senior Level", description: "Leading technical decisions and mentoring development teams", years: "5+ years of experience" },
    ]

    // Nếu đã chọn job role, highlight level của role đó
    if (formData.jobRole) {
      const selectedRole = jobRoles.find(role => role.id === formData.jobRole)
      if (selectedRole) {
        console.log(`🎯 Job Role "${selectedRole.title}" has level: ${selectedRole.level}`)
        
        // Cập nhật description để chỉ ra level được recommend
        return allLevels.map(level => ({
          ...level,
          description: level.id === selectedRole.level 
            ? `${level.description} (Recommended for your role)`
            : level.description
        }))
      }
    }

    return allLevels
  }, [formData.jobRole, jobRoles])

  // Tạo suggested skills từ tất cả JobCategory.skills
  const suggestedSkills = React.useMemo(() => {
    const allSkills = new Set<string>()
    
    jobRoles.forEach(role => {
      if (role.category?.skills) {
        role.category.skills.forEach(skill => allSkills.add(skill))
      }
    })
    
    // Fallback skills nếu không có skills từ category
    if (allSkills.size === 0) {
      return [
        "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java",
        "SQL", "Docker", "AWS", "Git", "HTML", "CSS", "GitHub"
      ]
    }
    
    return Array.from(allSkills).sort()
  }, [jobRoles])

  // Get icon based on job role key or category
  const getJobRoleIcon = (jobRole: JobRole) => {
    const key = jobRole.key?.toLowerCase() || ''
    const categoryName = jobRole.category?.name?.toLowerCase() || ''
    
    if (key.includes('frontend') || categoryName.includes('frontend')) return Monitor
    if (key.includes('backend') || categoryName.includes('backend')) return Server
    if (key.includes('fullstack') || categoryName.includes('fullstack')) return Layers
    if (key.includes('devops') || categoryName.includes('devops')) return Building2
    if (key.includes('mobile') || categoryName.includes('mobile')) return Monitor
    if (key.includes('data') || categoryName.includes('data')) return Server
    if (key.includes('ai') || key.includes('ml') || categoryName.includes('ai')) return Layers
    if (key.includes('security') || categoryName.includes('security')) return Building2
    if (key.includes('ui') || key.includes('ux') || categoryName.includes('design')) return Monitor
    if (key.includes('qa') || key.includes('test') || categoryName.includes('testing')) return Server
    if (key.includes('product') || categoryName.includes('product')) return Layers
    if (key.includes('cloud') || categoryName.includes('cloud')) return Building2
    if (key.includes('blockchain') || categoryName.includes('blockchain')) return Monitor
    if (key.includes('game') || categoryName.includes('game')) return Server
    if (key.includes('embedded') || categoryName.includes('embedded')) return Layers
    if (key.includes('network') || categoryName.includes('network')) return Building2
    if (key.includes('database') || categoryName.includes('database')) return Monitor
    if (key.includes('site') || key.includes('reliability') || categoryName.includes('reliability')) return Server
    if (key.includes('technical') || key.includes('writer') || categoryName.includes('documentation')) return Layers
    if (key.includes('data') || key.includes('scientist') || categoryName.includes('analytics')) return Building2
    
    return Briefcase // Default icon
  }

  // Get skills for a job role - ưu tiên từ JobCategory.skills
  const getJobRoleSkills = (jobRole: JobRole): string[] => {
    // Ưu tiên skills từ category (JobCategory.skills)
    if (jobRole.category?.skills && jobRole.category.skills.length > 0) {
      return jobRole.category.skills
    }
    
    // Fallback: tạo skills dựa trên tên role
    const key = jobRole.key?.toLowerCase() || ''
    const categoryName = jobRole.category?.name?.toLowerCase() || ''
    
    if (key.includes('frontend') || categoryName.includes('frontend')) {
      return ["React", "TypeScript", "CSS", "HTML", "JavaScript", "Vue.js", "Angular"]
    }
    if (key.includes('backend') || categoryName.includes('backend')) {
      return ["Node.js", "Python", "Java", "SQL", "Docker", "Express", "NestJS"]
    }
    if (key.includes('fullstack') || categoryName.includes('fullstack')) {
      return ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Next.js"]
    }
    if (key.includes('devops') || categoryName.includes('devops')) {
      return ["Docker", "Kubernetes", "AWS", "Jenkins", "Terraform", "CI/CD"]
    }
    if (key.includes('mobile') || categoryName.includes('mobile')) {
      return ["React Native", "Flutter", "Swift", "Kotlin", "Firebase"]
    }
    if (key.includes('data') || categoryName.includes('data')) {
      return ["Python", "SQL", "Spark", "Airflow", "AWS", "Pandas", "NumPy"]
    }
    if (key.includes('ai') || key.includes('ml') || categoryName.includes('ai')) {
      return ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "AWS", "Machine Learning"]
    }
    
    // Fallback cuối cùng: lấy từ suggestedSkills
    return suggestedSkills.slice(0, 10)
  }

  // Get levels for a job role
  const getJobRoleLevels = (jobRole: JobRole): string[] => {
    const level = jobRole.level?.toLowerCase() || ''
    
    if (level.includes('junior')) return ["Junior"]
    if (level.includes('mid') || level.includes('intermediate')) return ["Mid-Level"]
    if (level.includes('senior')) return ["Senior"]
    if (level.includes('lead')) return ["Lead"]
    if (level.includes('principal')) return ["Principal"]
    
    // Default levels
    return ["Junior", "Mid-Level", "Senior"]
  }

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    // Khi chọn job role, tự động set experience level từ JobRole.level
    if (field === 'jobRole' && typeof value === 'string') {
      const selectedRole = jobRoles.find(role => role.id === value)
      if (selectedRole) {
        console.log(`🎯 Auto-setting experience level to: ${selectedRole.level}`)
        setFormData(prev => ({ ...prev, experienceLevel: selectedRole.level }))
        
        // Reset auto-fill flag when changing job role
        setHasAutoFilledSkills(false)
        
        // Auto-scroll xuống bottom sau khi chọn job role
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          })
        }, 300)
      }
    }
  }

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }))
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const validateStep = (step: OnboardingStep): boolean => {
    const newErrors: FormErrors = {}

    switch (step) {
      case 1:
        if (!formData.jobRole) {
          newErrors.jobRole = "Please select a job role"
        }
        break
      case 2:
        if (!formData.experienceLevel) {
          newErrors.experienceLevel = "Please select your experience level"
        }
        break
      case 3:
        if (formData.skills.length === 0) {
          newErrors.skills = "Please select at least one skill"
        }
        break
                           case 4:
                // Chỉ validate firstName và lastName nếu user chưa có sẵn
                if (!formData.firstName && !formData.lastName) {
                  newErrors.firstName = "First name or last name is required"
                }
                if (!formData.phone) newErrors.phone = "Phone number is required"
                if (!formData.department) newErrors.department = "Department is required"
                if (!formData.joinDate) newErrors.joinDate = "Join date is required"
                break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(prev => (prev + 1) as OnboardingStep)
        
        // Auto-scroll lên đầu step mới
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }, 100)
      } else {
        handleSubmit()
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as OnboardingStep)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsSubmitting(true)
    try {
      // Chuẩn bị data để submit
      const submitData = {
        ...formData,
        // Đảm bảo skills được lưu vào User.skills
        skills: formData.skills,
        // Map experience level từ UI sang database enum
        experienceLevel: formData.experienceLevel.toLowerCase() as 'junior' | 'mid' | 'senior'
      }

      // Submit onboarding data step by step
      // Step 1: Job Role
      if (formData.jobRole) {
        const jobRoleResponse = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            step: 'job-role',
            data: { jobRoleId: formData.jobRole }
          }),
        })
        if (!jobRoleResponse.ok) {
          console.error('❌ Failed to submit job role')
          return
        }
      }

      // Step 2: Experience Level
      if (formData.experienceLevel) {
        const experienceResponse = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            step: 'experience',
            data: { experienceLevel: formData.experienceLevel.toLowerCase() as 'junior' | 'mid' | 'senior' }
          }),
        })
        if (!experienceResponse.ok) {
          console.error('❌ Failed to submit experience level')
          return
        }
      }

      // Step 3: Skills
      if (formData.skills && formData.skills.length > 0) {
        const skillsResponse = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            step: 'skills',
            data: { skills: formData.skills }
          }),
        })
        if (!skillsResponse.ok) {
          console.error('❌ Failed to submit skills')
          return
        }
      }

      // Step 4: Profile
      const profileResponse = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: 'profile',
          data: {
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            phone: formData.phone || '',
            bio: formData.bio || '',
            department: formData.department || '',
            joinDate: formData.joinDate || ''
          }
        }),
      })

      if (profileResponse.ok) {
        // Set completed state instead of redirecting immediately
        setIsCompleted(true)
      } else {
        console.error('❌ Failed to submit profile data')
      }
    } catch (error) {
      console.error('❌ Error submitting onboarding data:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / 4) * 100

  // Show completion screen if onboarding is completed
  if (isCompleted) {
    return <OnboardingComplete onContinue={async () => {
      try {
        // Cập nhật onboardingStatus trong database
        const response = await fetch('/api/user/onboarding-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ onboardingStatus: true })
        });

        if (response.ok) {
          // Success - status updated
        } else {
          console.error('❌ Failed to update onboarding status');
        }
      } catch (error) {
        console.error('❌ Error updating onboarding status:', error);
      }
      
      // Set flag to show streak popup after onboarding completion
      localStorage.setItem('showStreakReminderAfterOnboarding', '1')
      router.push('/dashboard')
    }} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-500 mx-auto shadow-2xl"></div>
          <p className="mt-4 text-foreground text-lg font-semibold">Loading job roles...</p>
        </div>
      </div>
    )
  }

     return (
     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
       {/* Header Section */}
       <div className="bg-gradient-to-r from-white via-purple-50 to-indigo-50 border-b border-purple-100">
         <div className="max-w-6xl mx-auto px-6 py-4">
           <div className="text-center">
             <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-500 rounded-2xl mb-3 shadow-lg animate-pulse">
               <Sparkles className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 bg-clip-text text-transparent mb-2">
                 Welcome to the Team!
               </h1>
             <p className="text-sm text-gray-600 max-w-xl mx-auto">
                 Let's set up your professional profile in just a few steps
               </p>
           </div>
         </div>
             </div>

       {/* Main Content */}
       <div className="max-w-6xl mx-auto px-6 py-4">
         <Card className="shadow-xl border-0 bg-white rounded-3xl overflow-hidden">
           <CardContent className="p-8 md:p-12">

             {/* Progress Section */}
             <div className="mb-6">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                 <div className="mb-3 sm:mb-0">
                   <h2 className="text-lg font-bold text-gray-900 mb-1">
                   Step {currentStep} of 4
                   </h2>
                   <p className="text-sm text-gray-600">
                     {currentStep === 1 && "🎯 Choose your primary role"}
                     {currentStep === 2 && "📊 Select your experience level"}
                     {currentStep === 3 && "⚡ Pick your technical skills"}
                     {currentStep === 4 && "✨ Complete your profile"}
                   </p>
               </div>
                 <div className="flex items-center space-x-3">
                   <div className="text-right">
                     <div className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">{Math.round(progress)}%</div>
                     <div className="text-xs text-gray-500">Complete</div>
                   </div>
                   <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                     <span className="text-white font-bold text-sm">{currentStep}</span>
                   </div>
                 </div>
               </div>
               
               {/* Progress Bar */}
               <div className="relative">
                 <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-3 shadow-inner">
                   <div 
                     className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                     style={{ width: `${progress}%` }}
                   ></div>
                 </div>
               </div>
             </div>

             {/* Step Indicators */}
             <div className="flex items-center justify-center mb-6">
               <div className="flex items-center space-x-3">
                 {[
                   { step: 1, label: "Role", icon: Briefcase, color: "from-purple-500 to-pink-500" },
                   { step: 2, label: "Experience", icon: Award, color: "from-blue-500 to-cyan-500" },
                   { step: 3, label: "Skills", icon: Sparkles, color: "from-emerald-500 to-teal-500" },
                   { step: 4, label: "Profile", icon: Building2, color: "from-orange-500 to-red-500" }
                 ].map(({ step, label, icon: Icon, color }, index) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                           w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 relative group hover:scale-110
                        ${
                          step <= currentStep
                               ? `bg-gradient-to-br ${color} text-white border-transparent shadow-lg scale-105`
                               : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }
                      `}
                    >
                      {step < currentStep ? (
                           <CheckCircle className="w-5 h-5 animate-bounce" />
                      ) : step === currentStep ? (
                           <Icon className="w-5 h-5 animate-pulse" />
                      ) : (
                           <Icon className="w-5 h-5" />
                      )}
                      {step === currentStep && (
                           <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color} animate-ping opacity-30`}></div>
                      )}
                    </div>
                    <span
                         className={`text-xs font-semibold mt-2 transition-colors duration-300 ${
                           step <= currentStep ? `text-transparent bg-gradient-to-r ${color} bg-clip-text` : "text-gray-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`
                           w-12 h-1 mx-3 transition-all duration-500 rounded-full
                           ${step < currentStep ? `bg-gradient-to-r ${color}` : "bg-gray-200"}
                         `}
                       ></div>
                  )}
                </div>
              ))}
               </div>
            </div>

                         {/* Step Content */}
             <div className="mb-8">
                      {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Choose Your Role
                  </h2>
                  <p className="text-sm text-gray-600 max-w-xl mx-auto">
                    Select your main area of expertise to personalize your experience
                  </p>
                </div>

                {/* Search and Filter */}
                <div className="bg-gradient-to-r from-gray-50 via-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="🔍 Search roles, skills, or categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 text-sm border-2 border-purple-200 bg-white rounded-xl shadow-sm focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-300 hover:border-purple-300"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors hover:scale-110"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                      <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-12 pr-12 h-12 border-2 border-purple-200 rounded-xl bg-white shadow-sm focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-300 text-sm min-w-[200px] appearance-none cursor-pointer hover:border-purple-300"
                      >
                        <option value="all">📂 All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                        {hasUncategorizedRoles && (
                          <option value="uncategorized">📋 Uncategorized</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="mt-4 text-center">
                    {filteredJobRoles?.length === 0 ? (
                      <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 rounded-full text-sm font-semibold border border-orange-200">
                        <X className="w-4 h-4 mr-2" />
                        No roles found matching your criteria
                      </span>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-gray-600 text-sm font-medium">
                          Showing {currentJobRoles.length} of {filteredJobRoles?.length || 0} roles
                        </span>
                        {searchTerm && (
                          <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-semibold">
                            for &quot;{searchTerm}&quot;
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Role Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentJobRoles.length > 0 ? currentJobRoles.map((role, index) => {
                    const IconComponent = getJobRoleIcon(role)
                    const isSelected = formData.jobRole === role.id
                    
                    // Color schemes for different role types - using conditional rendering
                    const getCardStyle = (isSelected: boolean, index: number) => {
                      if (!isSelected) {
                        return "border-gray-200 hover:border-purple-300 hover:shadow-md bg-white hover:bg-gray-50"
                      }
                      
                      // Dashboard-style selected card
                      return "border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg ring-2 ring-purple-200"
                    }
                    
                    const getIconStyle = (isSelected: boolean, index: number) => {
                      const iconGradients = [
                        "bg-gradient-to-br from-purple-500 to-pink-500",
                        "bg-gradient-to-br from-blue-500 to-cyan-500", 
                        "bg-gradient-to-br from-emerald-500 to-teal-500",
                        "bg-gradient-to-br from-orange-500 to-red-500",
                        "bg-gradient-to-br from-indigo-500 to-purple-500",
                        "bg-gradient-to-br from-pink-500 to-rose-500",
                        "bg-gradient-to-br from-cyan-500 to-blue-500",
                        "bg-gradient-to-br from-teal-500 to-emerald-500"
                      ]
                      
                      if (isSelected) {
                        return "bg-purple-500 text-white shadow-md"
                      }
                      
                      return `${iconGradients[index % iconGradients.length]} text-white group-hover:scale-105 group-hover:shadow-md`
                    }
                    
                    return (
                      <Card
                        key={role.id}
                        className={`group cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md border-2 ${getCardStyle(isSelected, index)}`}
                        onClick={() => handleInputChange("jobRole", role.id)}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div
                              className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 transition-all duration-500 ${getIconStyle(isSelected, index)}`}
                            >
                              <IconComponent className="w-7 h-7 text-white" />
                            </div>
                            <h3 className={`text-sm font-bold mb-2 transition-colors duration-300 ${
                              isSelected 
                                ? "text-purple-700" 
                                : "text-gray-900 group-hover:text-gray-700"
                            }`}>
                              {role.title}
                            </h3>
                            <p className={`leading-relaxed text-xs mb-3 ${
                              isSelected 
                                ? "text-purple-600" 
                                : "text-gray-600"
                            }`}>
                                {role.description || "No description available"}
                              </p>
                            {isSelected && (
                              <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Selected
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }) : (
                    <div className="col-span-full text-center py-8">
                      <div className="text-gray-500 text-lg mb-2">No roles found</div>
                      <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                  )}
                </div>

                                                                            {/* Pagination */}
                 {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-6">
                     <Button
                       variant="outline"
                      size="sm"
                       onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                       disabled={currentPage === 1}
                      className="h-8 px-4 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50"
                     >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                       Previous
                     </Button>
                     
                    <div className="flex gap-1">
                       {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                         <Button
                           key={page}
                           variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                           onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 p-0 transition-all duration-300 font-bold rounded-lg ${
                             currentPage === page 
                              ? "bg-gradient-to-r from-purple-600 to-violet-500 text-white shadow-md" 
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                           }`}
                         >
                           {page}
                         </Button>
                       ))}
                     </div>
 
                     <Button
                       variant="outline"
                      size="sm"
                       onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                       disabled={currentPage === totalPages}
                      className="h-8 px-4 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50"
                     >
                       Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                     </Button>
                   </div>
                 )}
            </div>
          )}

                                                                                                                                                                               {currentStep === 2 && (
                <div className="space-y-6 animate-slide-in-right">
                  <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-3 font-mono bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
                      Experience Level
                    </h2>
                                         <p className="text-muted-foreground text-lg">
                  What&apos;s your current professional level?
                     </p>
                  </div>

                                                                                                                                   <div className="grid md:grid-cols-3 gap-6">
                     {experienceLevels.map((level, index) => {
                       const selectedRole = jobRoles.find(role => role.id === formData.jobRole)
                       const isRecommended = selectedRole && level.id === selectedRole.level
                       const isSelected = formData.experienceLevel === level.id
                       
                       return (
                         <Card
                           key={level.id}
                           className={`cursor-pointer card-hover border-2 transition-all duration-300 ${
                             isSelected
                           ? "ring-4 ring-purple-300 border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-2xl scale-105"
                               : isRecommended
                               ? "ring-2 ring-green-400 border-green-500 bg-gradient-to-br from-green-500/10 to-emerald-500/5 shadow-lg hover:scale-105 hover:shadow-xl"
                          : "border-gray-300 hover:border-purple-500/50 hover:bg-purple-50 hover:scale-105"
                           }`}
                                                      onClick={() => {
                              handleInputChange("experienceLevel", level.id)
                              // Auto-scroll xuống bottom sau khi chọn experience level
                              setTimeout(() => {
                                window.scrollTo({
                                  top: document.documentElement.scrollHeight,
                                  behavior: 'smooth'
                                })
                              }, 300)
                            }}
                            style={{ animationDelay: `${index * 0.2}s` }}
                          >
                           <CardContent className="p-6 text-center">
                             <div className="mb-6">
                               <Award
                                 className={`w-12 h-12 mx-auto transition-all duration-300 ${
                                   isSelected
                                  ? "text-purple-600 animate-bounce"
                                     : isRecommended
                                     ? "text-green-500"
                                  : "text-gray-500 hover:text-purple-600"
                                 }`}
                               />
                             </div>
                             <h3 className="font-bold text-xl mb-3 font-mono">{level.title}</h3>
                        <p className="text-purple-600 font-bold mb-3 text-base">{level.years}</p>
                             <p className="text-muted-foreground leading-relaxed text-sm">{level.description}</p>
                           </CardContent>
                         </Card>
                       )
                     })}
                   </div>
            </div>
          )}

                                                                                       {currentStep === 3 && (
            <div className="space-y-8 animate-fade-in-up">
                 <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-3 font-mono bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
                     Technical Skills
                   </h2>
                   <p className="text-muted-foreground text-lg">Select your areas of expertise</p>
                
                {/* Stats display */}
                <div className="mt-4 flex justify-center">
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-full px-6 py-2 border border-purple-500/20">
                    <span className="text-purple-600 font-semibold">
                      {formData.skills.length} skill{formData.skills.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                </div>
                 </div>

              <div className="space-y-8">
                {/* Role-specific skills section */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border-2 border-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="skills" className="text-lg font-bold text-purple-600 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {formData.jobRole 
                      ? `Recommended for ${jobRoles.find(j => j.id === formData.jobRole)?.title || 'your role'}`
                      : "Popular Technologies"
                      }
                    </Label>
                    {formData.skills.length > 0 && (
                      <div className="text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                        {formData.skills.length} pre-selected
                      </div>
                    )}
                  </div>
                  
                  {formData.skills.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        💡 Skills have been pre-selected based on your role. You can remove any skills you don't use by clicking on them.
                      </p>
                    </div>
                  )}
                   
                   {(() => {
                     const selectedRole = jobRoles.find(j => j.id === formData.jobRole)
                     
                     // Ưu tiên skills từ JobCategory.skills của role đã chọn
                     let skillsSource: string[]
                     if (selectedRole && selectedRole.category?.skills && selectedRole.category.skills.length > 0) {
                       skillsSource = selectedRole.category.skills
                       console.log(`🎯 Using skills from ${selectedRole.category.name}:`, skillsSource)
                     } else if (selectedRole) {
                       skillsSource = getJobRoleSkills(selectedRole)
                       console.log(`🔄 Using fallback skills for ${selectedRole.title}:`, skillsSource)
                     } else {
                       skillsSource = suggestedSkills
                       console.log(`📚 Using general suggested skills:`, skillsSource)
                     }
                     
                                           return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {skillsSource.map((skill, index) => (
                            <Badge
                              key={skill}
                              variant={formData.skills.includes(skill) ? "default" : "outline"}
                            className={`cursor-pointer text-center justify-center text-sm py-3 px-4 font-semibold transition-all duration-300 hover:scale-105 transform ${
                                formData.skills.includes(skill)
                                ? "bg-gradient-to-r from-purple-600 to-violet-500 text-white shadow-lg border-purple-500"
                                : "hover:border-purple-500/50 hover:bg-purple-50 hover:text-purple-600 border-gray-300"
                              }`}
                                                           onClick={() => {
                              if (formData.skills.includes(skill)) {
                                removeSkill(skill);
                              } else {
                                addSkill(skill);
                              }
                                setTimeout(() => {
                                  window.scrollTo({
                                    top: document.documentElement.scrollHeight,
                                    behavior: 'smooth'
                                  })
                                }, 300)
                              }}
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                             {skill}
                            {formData.skills.includes(skill) && (
                              <span className="ml-2">✓</span>
                            )}
                           </Badge>
                         ))}
                       </div>
                     )
                   })()}
                 </div>

                {/* Selected skills display */}
                                                  {formData.skills.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg animate-fade-in-up">
                    <Label className="text-lg font-bold mb-4 block text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Your Selected Skills ({formData.skills.length})
                     </Label>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                       {formData.skills.map((skill, index) => (
                          <div
                           key={skill}
                            className="bg-white rounded-lg p-3 border border-green-200 shadow-sm animate-fade-in-up flex items-center justify-between group hover:shadow-md transition-shadow duration-200"
                           style={{ animationDelay: `${index * 0.1}s` }}
                         >
                            <span className="font-medium text-green-800">{skill}</span>
                           <button
                             onClick={() => removeSkill(skill)}
                              className="text-green-600 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100"
                              title="Remove skill"
                           >
                              <X className="w-4 h-4" />
                           </button>
                          </div>
                       ))}
                     </div>
                      
                      {/* Skills summary */}
                      <div className="mt-4 p-4 bg-green-100 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <Award className="w-5 h-5" />
                          <span className="font-semibold">Skill Profile:</span>
                   </div>
                        <p className="text-green-600 mt-2 text-sm">
                          You&apos;ve selected {formData.skills.length} skill{formData.skills.length !== 1 ? 's' : ''} 
                          {formData.jobRole && ` for ${jobRoles.find(j => j.id === formData.jobRole)?.title}`}.
                          This will help us personalize your interview experience.
                        </p>
                      </div>
              </div>
            </div>
          )}

              </div>
            </div>
          )}                                                                                                                                                                               {currentStep === 4 && (
            <div className="space-y-8 animate-slide-in-right">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-3 font-mono bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
                      Professional Profile
                    </h2>
                    <p className="text-muted-foreground text-lg">Complete your professional information</p>
                    
                {/* Progress indicator for profile completion */}
                <div className="mt-6">
                  <div className="bg-gray-100 rounded-full h-2 max-w-md mx-auto">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-violet-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.round(
                          (Object.values({
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            phone: formData.phone,
                            department: formData.department,
                            joinDate: formData.joinDate,
                            bio: formData.bio
                          }).filter(val => val && val.toString().trim()).length / 6) * 100
                        )}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {Object.values({
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      phone: formData.phone,
                      department: formData.department,
                      joinDate: formData.joinDate,
                      bio: formData.bio
                    }).filter(val => val && val.toString().trim()).length} of 6 fields completed
                  </p>
                </div>
                  </div>

              <div className="max-w-4xl mx-auto">
                {/* Personal Information Section */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border-2 border-purple-500/20 mb-8">
                  <h3 className="text-xl font-bold text-purple-600 mb-6 flex items-center gap-2">
                    <Building2 className="w-6 h-6" />
                    Personal Information
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                   <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                      <Label htmlFor="firstName" className="text-base font-bold flex items-center gap-2">
                       First Name 
                       {formData.firstName && (
                          <span className="text-green-600 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Pre-filled
                          </span>
                       )}
                     </Label>
                     <Input
                       id="firstName"
                       value={formData.firstName}
                       onChange={(e) => handleInputChange("firstName", e.target.value)}
                       placeholder="Enter your first name"
                        className={`mt-3 h-12 text-base border-2 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-300 ${
                          errors.firstName ? "border-red-500 bg-red-50" : ""
                        } ${formData.firstName ? "bg-green-50 border-green-400" : ""}`}
                     />
                     {errors.firstName && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {errors.firstName}
                        </p>
                     )}
                   </div>

                   <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                      <Label htmlFor="lastName" className="text-base font-bold flex items-center gap-2">
                       Last Name
                       {formData.lastName && (
                          <span className="text-green-600 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Pre-filled
                          </span>
                       )}
                     </Label>
                     <Input
                       id="lastName"
                       value={formData.lastName}
                       onChange={(e) => handleInputChange("lastName", e.target.value)}
                       placeholder="Enter your last name"
                        className={`mt-3 h-12 text-base border-2 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-300 ${
                          errors.lastName ? "border-red-500 bg-red-50" : ""
                        } ${formData.lastName ? "bg-green-50 border-green-400" : ""}`}
                     />
                     {errors.lastName && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {errors.lastName}
                        </p>
                     )}
                 </div>

                 <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                   <Label htmlFor="phone" className="text-base font-bold">Phone Number</Label>
                   <Input
                     id="phone"
                     value={formData.phone}
                     onChange={(e) => handleInputChange("phone", e.target.value)}
                     placeholder="Enter your phone number"
                        className={`mt-3 h-12 text-base border-2 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-300 ${
                          errors.phone ? "border-red-500 bg-red-50" : ""
                     }`}
                   />
                   {errors.phone && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {errors.phone}
                        </p>
                   )}
                 </div>

                 <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                   <Label htmlFor="joinDate" className="text-base font-bold">Start Date</Label>
                   <div className="relative mt-3">
                     <Input
                       id="joinDate"
                       type="date"
                       value={formData.joinDate}
                       onChange={(e) => handleInputChange("joinDate", e.target.value)}
                          className={`h-12 text-base border-2 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-300 ${
                            errors.joinDate ? "border-red-500 bg-red-50" : ""
                       }`}
                     />
                        <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                   </div>
                   {errors.joinDate && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {errors.joinDate}
                        </p>
                   )}
                    </div>
                 </div>
                </div>

                {/* Professional Information Section */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <h3 className="text-xl font-bold text-purple-700 mb-6 flex items-center gap-2">
                    <Briefcase className="w-6 h-6" />
                    Professional Details
                  </h3>

                  <div className="space-y-6">
                    <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                      <Label htmlFor="department" className="text-base font-bold">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => handleInputChange("department", e.target.value)}
                        placeholder="e.g., Engineering, Product, Design, Marketing"
                        className={`mt-3 h-12 text-base border-2 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-300 ${
                          errors.department ? "border-red-500 bg-red-50" : ""
                        }`}
                      />
                      {errors.department && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {errors.department}
                        </p>
                      )}
               </div>

                                              <div className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
                   <Label htmlFor="bio" className="text-base font-bold">Professional Bio</Label>
                   <Textarea
                     id="bio"
                     value={formData.bio}
                     onChange={(e) => handleInputChange("bio", e.target.value)}
                        placeholder="Brief introduction about your professional background, interests, and what motivates you..."
                        rows={4}
                        className="mt-3 resize-none text-base border-2 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-300"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        {formData.bio.length}/500 characters
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary section */}
                {formData.jobRole && formData.experienceLevel && formData.skills.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 animate-fade-in-up">
                    <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                      <Sparkles className="w-6 h-6" />
                      Profile Summary
                    </h3>
                    <div className="space-y-3 text-green-700">
                      <p>
                        <strong>Role:</strong> {jobRoles.find(r => r.id === formData.jobRole)?.title}
                      </p>
                      <p>
                        <strong>Experience:</strong> {formData.experienceLevel.charAt(0).toUpperCase() + formData.experienceLevel.slice(1)} Level
                      </p>
                      <p>
                        <strong>Skills:</strong> {formData.skills.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                 </div>
            </div>
          )}
        </div>

                                                                             {/* Navigation Buttons */}
             <div className="flex justify-between items-center pt-6 border-t border-gradient-to-r from-gray-100 via-purple-100 to-indigo-100">
               <Button
                 variant="outline"
                 onClick={prevStep}
                 disabled={currentStep === 1}
                 className="flex items-center gap-2 h-12 px-8 text-sm font-semibold border-2 border-gray-300 text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl hover:scale-105"
               >
                 <ChevronLeft className="w-5 h-5" />
                 Back
               </Button>
 
               <Button
                 onClick={nextStep}
                 disabled={isSubmitting}
                 className="flex items-center gap-2 h-12 px-8 text-sm font-semibold bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 hover:from-purple-700 hover:via-violet-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl hover:scale-105"
               >
                 {currentStep === 4 ? (
                   <>
                     {isSubmitting ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         Submitting...
                       </>
                     ) : (
                       <>
                         Complete Setup
                         <Sparkles className="w-5 h-5 animate-pulse" />
                       </>
                     )}
                   </>
                 ) : (
                   <>
                     Continue
                     <ChevronRight className="w-5 h-5" />
                   </>
                 )}
               </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
