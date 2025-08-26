"use client"

import { useState, useRef } from "react"
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
} from "lucide-react"
import OnboardingComplete from "./OnboardingComplete"
import { useRouter } from "next/navigation"

type OnboardingStep = 1 | 2 | 3 | 4

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
}

const jobRoles = [
  {
    id: "frontend",
    title: "Frontend Developer",
    description: "Create responsive web applications using modern frameworks like React, Vue, and Angular",
    icon: Monitor,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["React", "TypeScript", "CSS", "HTML", "JavaScript"],
  },
  {
    id: "backend",
    title: "Backend Developer",
    description: "Design and implement scalable server-side architecture, APIs, and database systems",
    icon: Server,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Node.js", "Python", "Java", "SQL", "Docker"],
  },
  {
    id: "fullstack",
    title: "Full Stack Developer",
    description: "Build end-to-end solutions combining frontend interfaces with backend infrastructure",
    icon: Layers,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
  },
  {
    id: "devops",
    title: "DevOps Engineer",
    description: "Streamline development workflows through automation, CI/CD, and cloud infrastructure",
    icon: Building2,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Docker", "Kubernetes", "AWS", "Jenkins", "Terraform"],
  },
  {
    id: "mobile",
    title: "Mobile Developer",
    description: "Build native and cross-platform mobile applications for iOS and Android",
    icon: Monitor,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase"],
  },
  {
    id: "data",
    title: "Data Engineer",
    description: "Design and build data pipelines, warehouses, and analytics solutions",
    icon: Server,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Python", "SQL", "Spark", "Airflow", "AWS"],
  },
  {
    id: "ai",
    title: "AI/ML Engineer",
    description: "Develop machine learning models and AI-powered applications",
    icon: Layers,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "AWS"],
  },
  {
    id: "security",
    title: "Security Engineer",
    description: "Protect systems and data through security measures and best practices",
    icon: Building2,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Network Security", "Penetration Testing", "Cryptography", "Compliance", "AWS"],
  },
  {
    id: "ui-ux",
    title: "UI/UX Designer",
    description: "Create intuitive and beautiful user interfaces and user experiences",
    icon: Monitor,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Figma", "Adobe XD", "Sketch", "Prototyping", "User Research"],
  },
  {
    id: "qa",
    title: "QA Engineer",
    description: "Ensure software quality through comprehensive testing and quality assurance",
    icon: Server,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Selenium", "Jest", "Cypress", "Manual Testing", "Test Automation"],
  },
  {
    id: "product",
    title: "Product Manager",
    description: "Lead product strategy, development, and go-to-market initiatives",
    icon: Layers,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Product Strategy", "User Stories", "Agile", "Analytics", "Stakeholder Management"],
  },
  {
    id: "cloud",
    title: "Cloud Architect",
    description: "Design and implement scalable cloud infrastructure and solutions",
    icon: Building2,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["AWS", "Azure", "Google Cloud", "Terraform", "Kubernetes"],
  },
  {
    id: "blockchain",
    title: "Blockchain Developer",
    description: "Build decentralized applications and smart contracts",
    icon: Monitor,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Solidity", "Ethereum", "Web3", "Smart Contracts", "DeFi"],
  },
  {
    id: "game",
    title: "Game Developer",
    description: "Create engaging video games and interactive experiences",
    icon: Server,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Unity", "Unreal Engine", "C#", "C++", "Game Design"],
  },
  {
    id: "embedded",
    title: "Embedded Systems Engineer",
    description: "Develop software for embedded systems and IoT devices",
    icon: Layers,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["C", "C++", "RTOS", "Microcontrollers", "IoT"],
  },
  {
    id: "network",
    title: "Network Engineer",
    description: "Design and maintain network infrastructure and connectivity",
    icon: Building2,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Cisco", "Network Security", "VPN", "Routing", "Switching"],
  },
  {
    id: "database",
    title: "Database Administrator",
    description: "Manage and optimize database systems and data storage",
    icon: Monitor,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["MySQL", "PostgreSQL", "MongoDB", "Redis", "Database Design"],
  },
  {
    id: "site-reliability",
    title: "Site Reliability Engineer",
    description: "Ensure system reliability, availability, and performance",
    icon: Server,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Monitoring", "Incident Response", "Automation", "Infrastructure", "DevOps"],
  },
  {
    id: "technical-writer",
    title: "Technical Writer",
    description: "Create clear and comprehensive technical documentation",
    icon: Layers,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Documentation", "API Docs", "User Guides", "Markdown", "Technical Communication"],
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    description: "Analyze complex data to drive business decisions and insights",
    icon: Building2,
    levels: ["Junior", "Mid-Level", "Senior"],
    skills: ["Python", "R", "Machine Learning", "Statistics", "Data Visualization"],
  },
]

const experienceLevels = [
  {
    id: "junior",
    title: "Junior Level",
    description: "Building foundational skills and gaining hands-on experience",
    years: "0-2 years of professional experience",
  },
  {
    id: "mid",
    title: "Mid-Level",
    description: "Developing expertise and taking on complex technical challenges",
    years: "2-5 years of professional experience",
  },
  {
    id: "senior",
    title: "Senior Level",
    description: "Leading technical decisions and mentoring development teams",
    years: "5+ years of professional experience",
  },
]

const suggestedSkills = [
  // Frontend
  "React",
  "Vue.js",
  "Angular",
  "TypeScript",
  "JavaScript",
  "HTML5",
  "CSS3",
  "Sass",
  "Tailwind CSS",
  // Backend
  "Node.js",
  "Python",
  "Java",
  "C#",
  ".NET",
  "PHP",
  "Go",
  "Rust",
  // Databases
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Elasticsearch",
  // Cloud & DevOps
  "AWS",
  "Azure",
  "Google Cloud",
  "Docker",
  "Kubernetes",
  "Jenkins",
  "GitLab CI",
  "Terraform",
  // Tools & Methodologies
  "Git",
  "Agile",
  "Scrum",
  "REST APIs",
  "GraphQL",
  "Microservices",
  "Testing",
  "Performance Optimization",
]

export default function OnboardingSteps() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [formData, setFormData] = useState<FormData>({
    jobRole: "",
    experienceLevel: "",
    skills: [],
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
    joinDate: "",
    bio: "",
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const router = useRouter()
  
  // Ref for scrolling to bottom
  const bottomRef = useRef<HTMLDivElement>(null)
  
  // Pagination settings
  const itemsPerPage = 4
  const totalPages = Math.ceil(jobRoles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentJobRoles = jobRoles.slice(startIndex, endIndex)

  const progress = (currentStep / 4) * 100

  const nextStep = () => {
    if (currentStep < 4) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) as OnboardingStep)
        setIsTransitioning(false)
      }, 200)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep((prev) => (prev - 1) as OnboardingStep)
        setIsTransitioning(false)
      }, 200)
    }
  }

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData((prev) => ({
                ...prev,
        skills: [...prev.skills, skill],
      }))
    }
  }

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
          ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
    
    // Auto scroll to bottom when job role is selected
    if (field === "jobRole" && bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        })
      }, 300) // Small delay to ensure the selection animation completes
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
      {[
        { step: 1, label: "Role" },
        { step: 2, label: "Experience" },
        { step: 3, label: "Skills" },
        { step: 4, label: "Profile" },
      ].map(({ step, label }, index) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-700 border-2 relative
                ${
                  step <= currentStep
                    ? "bg-gradient-to-br from-primary to-secondary text-white border-primary shadow-2xl"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:scale-110"
                }
              `}
              style={{ 
                animationDelay: `${index * 0.5}s`,
                animation: step <= currentStep ? 'float 3s ease-in-out infinite, pulse-glow 2s ease-in-out infinite' : 'none'
              }}
            >
              {step < currentStep ? (
                <CheckCircle className="w-6 h-6" style={{ animation: 'scaleIn 0.4s ease-out' }} />
              ) : step === currentStep ? (
                <Sparkles className="w-6 h-6" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                step
              )}
              {step === currentStep && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-primary opacity-75" style={{ animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                </>
              )}
            </div>
            <span
              className={`text-xs mt-2 font-bold transition-all duration-500 ${
                step <= currentStep ? "text-primary" : "text-muted-foreground"
              }`}
              style={step <= currentStep ? { animation: 'shimmer 2s infinite' } : {}}
            >
              {label}
            </span>
          </div>
          {index < 3 && (
            <div
              className={`
                w-20 h-1.5 mx-6 mt-[-18px] transition-all duration-700 rounded-full relative overflow-hidden
                ${step < currentStep ? "bg-gradient-to-r from-primary via-secondary to-accent" : "bg-border"}
              `}
              style={step < currentStep ? { animation: 'gradient-shift 3s ease infinite' } : {}}
            >
              {step < currentStep && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2s infinite' }}></div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3 font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Choose Your Role
        </h2>
        <p className="text-muted-foreground text-lg">Select your primary area of expertise</p>
      </div>

      <div className="grid gap-6">
        {currentJobRoles.map((role, index) => {
          const IconComponent = role.icon
        return (
            <Card
              key={role.id}
              className={`cursor-pointer card-hover border-2 ${
                formData.jobRole === role.id
                  ? "ring-4 ring-primary/30 border-primary bg-gradient-to-br from-primary/10 to-secondary/5 shadow-2xl animate-pulse-glow"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
              onClick={() => handleInputChange("jobRole", role.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <div
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      formData.jobRole === role.id
                        ? "bg-gradient-to-br from-primary to-secondary text-white shadow-lg animate-pulse"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    <IconComponent className="w-8 h-8" />
              </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-2 font-mono">{role.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed text-base">{role.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {role.levels.map((level) => (
                        <Badge key={level} variant="secondary" className="text-xs font-semibold py-1 px-2">
                          {level}
                        </Badge>
                      ))}
              </div>
                    <div className="flex flex-wrap gap-1">
                      {role.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs skill-badge">
                          {skill}
                        </Badge>
                      ))}
              </div>
              </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
            </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn-magical"
                >
            <ChevronLeft className="w-4 h-4" />
            Previous
                </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 p-0 ${currentPage === page ? 'bg-primary text-white' : ''}`}
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
            className="btn-magical"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
                        </div>
              )}
            </div>
  )

      const renderStep2 = () => (
    <div className="space-y-6 animate-slide-in-right">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Experience Level
        </h2>
        <p className="text-muted-foreground text-base">What's your current professional level?</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {experienceLevels.map((level, index) => (
          <Card
            key={level.id}
            className={`cursor-pointer card-hover border-2 transition-all duration-300 ${
              formData.experienceLevel === level.id
                ? "ring-2 ring-primary/30 border-primary bg-gradient-to-br from-primary/10 to-secondary/5 shadow-lg animate-pulse-glow"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
            onClick={() => handleInputChange("experienceLevel", level.id)}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <CardContent className="p-4 text-center">
              <div className="mb-3">
                <Award
                  className={`w-8 h-8 mx-auto transition-all duration-300 ${
                    formData.experienceLevel === level.id
                      ? "text-primary animate-bounce"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                />
              </div>
              <h3 className="font-bold text-base mb-1 font-mono">{level.title}</h3>
              <p className="text-primary font-bold mb-1 text-xs">{level.years}</p>
              <p className="text-muted-foreground leading-relaxed text-xs">{level.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

      const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Technical Skills
        </h2>
        <p className="text-muted-foreground text-base">Select your areas of expertise</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="skills" className="text-sm font-bold mb-3 block">
            {formData.jobRole ? `Popular skills for ${jobRoles.find(j=>j.id===formData.jobRole)?.title}` : "Choose from popular technologies"}
          </Label>
          {(() => {
            const selectedRole = jobRoles.find(j => j.id === formData.jobRole)
            const skillsSource = selectedRole ? selectedRole.skills : suggestedSkills
            return (
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {skillsSource.map((skill, index) => (
                  <Badge
                    key={skill}
                    variant={formData.skills.includes(skill) ? "default" : "outline"}
                    className={`cursor-pointer skill-badge text-xs py-1 px-2 font-semibold transition-all duration-200 ${
                      formData.skills.includes(skill)
                        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md animate-pulse-glow"
                        : "hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                    }`}
                    onClick={() => (formData.skills.includes(skill) ? removeSkill(skill) : addSkill(skill))}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {skill}
                    {formData.skills.includes(skill) && <CheckCircle className="w-3 h-3 ml-1 animate-spin" />}
                  </Badge>
                ))}
              </div>
            )
          })()}
        </div>

        {formData.skills.length > 0 && (
          <div className="bg-gradient-to-br from-primary/10 to-secondary/5 rounded-lg p-4 border border-primary/20 shadow-lg animate-fade-in-up">
            <Label className="text-sm font-bold mb-3 block text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Selected Skills ({formData.skills.length})
            </Label>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
              {formData.skills.map((skill, index) => (
                <Badge
                  key={skill}
                  className="bg-gradient-to-r from-primary to-secondary text-white text-xs py-1 px-2 font-semibold shadow-md animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-all duration-200 hover:scale-110"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

    const renderStep4 = () => (
    <div className="space-y-8 animate-slide-in-right">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3 font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Professional Profile
        </h2>
        <p className="text-muted-foreground text-lg">Complete your professional information</p>
      </div>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <Label htmlFor="firstName" className="text-sm font-bold">
              First Name *
            </Label>
                <Input
                  id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter your first name"
              className={`mt-2 h-10 text-sm border-2 transition-all duration-300 ${
                formErrors.firstName 
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                  : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
                />
                {formErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1 animate-fade-in-up">{formErrors.firstName}</p>
                )}
              </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Label htmlFor="lastName" className="text-sm font-bold">
              Last Name *
            </Label>
                <Input
                  id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter your last name"
              className={`mt-2 h-10 text-sm border-2 transition-all duration-300 ${
                formErrors.lastName 
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                  : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
                />
                {formErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1 animate-fade-in-up">{formErrors.lastName}</p>
                )}
              </div>
            </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Label htmlFor="phone" className="text-sm font-bold">
            Phone Number *
          </Label>
              <Input
                id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+84 912 345 678 hoặc 0912 345 678"
            className={`mt-2 h-10 text-sm border-2 transition-all duration-300 ${
              formErrors.phone 
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            }`}
              />
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1 animate-fade-in-up">{formErrors.phone}</p>
              )}
            </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <Label htmlFor="department" className="text-sm font-bold">
            Department *
          </Label>
              <Input
                id="department"
            value={formData.department}
            onChange={(e) => handleInputChange("department", e.target.value)}
            placeholder="e.g., Engineering, Product, Design"
            className={`mt-2 h-10 text-sm border-2 transition-all duration-300 ${
              formErrors.department 
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                : "border-border focus:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
            }`}
              />
              {formErrors.department && (
                <p className="text-red-500 text-xs mt-1 animate-fade-in-up">{formErrors.department}</p>
              )}
            </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <Label htmlFor="joinDate" className="text-sm font-bold">
            Start Date *
          </Label>
          <div className="relative mt-2">
              <Input
                id="joinDate"
                type="date"
              value={formData.joinDate}
              onChange={(e) => handleInputChange("joinDate", e.target.value)}
              className={`h-10 text-sm border-2 transition-all duration-300 ${
                formErrors.joinDate 
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                  : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
              />
            <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
              {formErrors.joinDate && (
                <p className="text-red-500 text-xs mt-1 animate-fade-in-up">{formErrors.joinDate}</p>
              )}
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <Label htmlFor="bio" className="text-sm font-bold">
            Professional Bio
          </Label>
              <Textarea
                id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            placeholder="Brief introduction about your professional background and interests..."
            rows={3}
            className="mt-2 resize-none text-sm border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              />
            </div>
          </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return null
    }
  }

  const validateStep4 = () => {
    const errors: FormErrors = {}
    
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required"
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required"
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required"
    } else {
      // Vietnamese phone formats: +84 9xx xxx xxx, +84 1xx..., 09xx xxx xxx, 01xx xxx xxx
      const vnPhoneRegex = /^(\+84\s?|0)(?:3\d{2}|5\d{2}|7\d{2}|8\d{2}|9\d{2})(?:[\s.-]?\d{3}){2}$/
      if (!vnPhoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = "Số điện thoại không hợp lệ (ví dụ: +84 912 345 678)"
      }
    }
    
    if (!formData.department.trim()) {
      errors.department = "Department is required"
    }
    
    if (!formData.joinDate) {
      errors.joinDate = "Start date is required"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.jobRole !== ""
      case 2:
        return formData.experienceLevel !== ""
      case 3:
        return formData.skills.length > 0
      case 4:
        return formData.firstName !== "" && formData.lastName !== "" && formData.phone !== "" && formData.department !== "" && formData.joinDate !== ""
      default:
        return false
    }
  }
  // Persist onboarding so onboarding-status becomes completed
  const completeOnboarding = async () => {
    try {
      setIsLoading(true)
      let jobRoleId: string | undefined = undefined
      try {
        const res = await fetch('/api/positions')
        if (res.ok) {
          const roles = await res.json()
          const key = `${formData.jobRole}-${formData.experienceLevel}`
          const matchByKey = roles.find((r: any) => r.key === key)
          if (matchByKey) {
            jobRoleId = matchByKey.id
          } else {
            const levelMap: Record<string, string> = { junior: 'Junior', mid: 'Mid', senior: 'Senior' }
            const targetLevel = levelMap[formData.experienceLevel]
            const matchByTitle = roles.find((r: any) =>
              typeof r.title === 'string' && r.title.toLowerCase().includes(formData.jobRole) &&
              (r.level === targetLevel || r.level?.toLowerCase() === formData.experienceLevel)
            )
            if (matchByTitle) jobRoleId = matchByTitle.id
          }
        }
      } catch {}

      await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobRoleId,
          experienceLevel: formData.experienceLevel,
          skills: formData.skills,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          bio: formData.bio,
          department: formData.department,
          joinDate: formData.joinDate,
        }),
      })

      setIsCompleted(true)
    } finally {
      setIsLoading(false)
    }
  }

  // When completed, show the completion screen
  if (isCompleted) {
    return (
      <OnboardingComplete onContinue={() => { try { if (typeof window !== 'undefined') { localStorage.setItem('showStreakWelcome', '1') } } catch {} router.push('/dashboard') }} />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center p-4" style={{ position: 'relative', overflow: 'hidden', margin: 0, padding: 0, top: 0 }}>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(167, 139, 250, 0.05) 0%, transparent 50%)`,
        animation: 'float 6s ease-in-out infinite',
        pointerEvents: 'none'
      }}></div>
      <div className="w-full max-w-4xl md:max-w-5xl relative z-10">
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
          <CardContent className="p-6 md:p-10 lg:p-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-6 font-mono bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent" style={{ 
                background: 'linear-gradient(-45deg, #4c1d95, #7c3aed, #8b5cf6, #a78bfa)',
                backgroundSize: '400% 400%',
                animation: 'gradient-shift 3s ease infinite, float 3s ease-in-out infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Welcome to the Team!
              </h1>
              <p className="text-muted-foreground text-lg" style={{ animation: 'fadeInUp 0.6s ease-out', animationDelay: "0.3s" }}>
                Let's set up your professional profile in just a few steps
              </p>
          </div>

            <div className="mb-8 md:mb-12">
              <div className="flex justify-between items-center mb-6">
                <span className="text-base font-semibold text-muted-foreground" style={{ animation: 'slideInLeft 0.5s ease-out' }}>
                  Step {currentStep} of 4
                </span>
                <span className="text-base font-bold text-primary bg-gradient-to-r from-primary/20 to-secondary/20 px-4 py-2 rounded-full border border-primary/30" style={{ 
                  animation: 'slideInRight 0.5s ease-out, pulse-glow 2s ease-in-out infinite'
                }}>
                  {Math.round(progress)}% Complete
                </span>
                  </div>
              <div className="relative">
                <Progress value={progress} className="h-4 bg-muted shadow-inner rounded-full overflow-hidden" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" style={{ animation: 'shimmer 2s infinite' }}></div>
                </div>
          </div>

            {renderStepIndicator()}

            <div
              className={`mb-8 md:mb-12 transition-all duration-500 ${isTransitioning ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"}`}
              style={{ animation: 'fadeInUp 0.6s ease-out' }}
            >
              {renderCurrentStep()}
          </div>

                         <div className="flex justify-between">
            <Button
              variant="outline"
                 onClick={prevStep}
                 disabled={currentStep === 1}
                 className="flex items-center gap-3 h-12 px-8 font-bold text-base bg-transparent border-2 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                 style={{
                   position: 'relative',
                   overflow: 'hidden',
                   transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                 }}
               >
                 <ChevronLeft className="w-5 h-5" />
              Back
            </Button>
            
            <Button
                 onClick={
                   currentStep === 4
                     ? async () => {
                         if (validateStep4()) {
                           await completeOnboarding()
                         }
                       }
                     : nextStep
                 }
                 disabled={!canProceed()}
                 className="flex items-center gap-3 h-12 px-10 font-bold text-base bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:hover:scale-100"
                 style={{
                   position: 'relative',
                   overflow: 'hidden',
                   transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                   animation: 'pulse-glow 2s ease-in-out infinite'
                 }}
               >
                 {currentStep === 4 ? "Complete Setup" : "Continue"}
                 {currentStep < 4 && <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>
             
             {/* Invisible div for scrolling to bottom */}
             <div ref={bottomRef} />
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
