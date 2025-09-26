import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Brain, TestTube, FileText, Target, ChevronDown, ChevronUp } from 'lucide-react';

// Skill name mapping for better user experience
const getDisplaySkillName = (technicalName: string): string => {
  const skillMapping: Record<string, string> = {
    // Programming Languages
    'javascript': 'JavaScript',
    'typescript': 'TypeScript', 
    'python': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'csharp': 'C#',
    'php': 'PHP',
    'ruby': 'Ruby',
    'go': 'Go',
    'rust': 'Rust',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    
    // Frontend Technologies
    'react': 'React',
    'reactjs': 'React',
    'vue': 'Vue.js',
    'vuejs': 'Vue.js',
    'angular': 'Angular',
    'angularjs': 'AngularJS',
    'html': 'HTML',
    'css': 'CSS',
    'sass': 'SASS',
    'less': 'LESS',
    'bootstrap': 'Bootstrap',
    'tailwind': 'Tailwind CSS',
    'tailwindcss': 'Tailwind CSS',
    
    // Backend Technologies  
    'nodejs': 'Node.js',
    'express': 'Express.js',
    'nestjs': 'NestJS',
    'django': 'Django',
    'flask': 'Flask',
    'laravel': 'Laravel',
    'spring': 'Spring Framework',
    'springboot': 'Spring Boot',
    'fastapi': 'FastAPI',
    
    // Databases
    'mysql': 'MySQL',
    'postgresql': 'PostgreSQL',
    'mongodb': 'MongoDB',
    'redis': 'Redis',
    'sqlite': 'SQLite',
    'oracle': 'Oracle Database',
    'mssql': 'SQL Server',
    
    // Cloud & DevOps
    'aws': 'Amazon Web Services',
    'azure': 'Microsoft Azure',
    'gcp': 'Google Cloud Platform',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'jenkins': 'Jenkins',
    'gitlab': 'GitLab CI/CD',
    'github': 'GitHub Actions',
    
    // Tools & Methodologies
    'git': 'Git',
    'agile': 'Agile Development',
    'scrum': 'Scrum',
    'kanban': 'Kanban',
    'tdd': 'Test-Driven Development',
    'ci-cd': 'CI/CD',
    'cicd': 'CI/CD',
    
    // Soft Skills
    'communication': 'Communication Skills',
    'delivery': 'Delivery Skills',
    'presentation': 'Delivery Skills', // Changed: Map old "presentation" to "Delivery Skills" 
    'Presentation': 'Delivery Skills', // Handle capitalized version from API
    'leadership': 'Leadership',
    'teamwork': 'Teamwork',
    'problem-solving': 'Problem Solving',
    'critical-thinking': 'Critical Thinking',
    'time-management': 'Time Management',
    'project-management': 'Project Management',
    
    // Data & AI
    'machine-learning': 'Machine Learning',
    'data-science': 'Data Science',
    'artificial-intelligence': 'Artificial Intelligence',
    'deep-learning': 'Deep Learning',
    'pandas': 'Pandas',
    'numpy': 'NumPy',
    'tensorflow': 'TensorFlow',
    'pytorch': 'PyTorch'
  };
  
  // Convert to lowercase for lookup, return mapped name or original with proper casing
  const key = technicalName.toLowerCase().trim();
  return skillMapping[key] || technicalName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

interface SkillProgress {
  name: string;
  level: string;
  score: number;
  trend?: number | null;
  source: string;
  lastUpdated: Date;
  totalSessions: number;
  progress: Array<{
    date: Date;
    score: number;
    source?: string;
  }>;
}

interface SkillsProgressProps {
  skillProgress: SkillProgress[];
  loading: boolean;
  collapsible?: boolean;
}

const SkillsProgress: React.FC<SkillsProgressProps> = ({ skillProgress, loading, collapsible = false }) => {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  // Merge duplicate skills with same display name
  const mergedSkillProgress = React.useMemo(() => {
    if (!skillProgress || skillProgress.length === 0) return [];
    
    const skillMap = new Map<string, SkillProgress>();
    
    skillProgress.forEach(skill => {
      const displayName = getDisplaySkillName(skill.name);
      
      if (skillMap.has(displayName)) {
        const existing = skillMap.get(displayName)!;
        // Merge skills: use higher score, combine sessions, latest date
        const mergedSkill: SkillProgress = {
          ...existing,
          name: displayName, // Use display name consistently
          score: Math.max(existing.score, skill.score), // Take higher score
          totalSessions: existing.totalSessions + skill.totalSessions, // Combine sessions
          lastUpdated: existing.lastUpdated > skill.lastUpdated ? existing.lastUpdated : skill.lastUpdated, // Latest date
          progress: [...existing.progress, ...skill.progress].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          ), // Merge and sort progress arrays
          trend: skill.trend || existing.trend // Keep any trend data
        };
        skillMap.set(displayName, mergedSkill);
      } else {
        skillMap.set(displayName, {
          ...skill,
          name: displayName // Normalize to display name
        });
      }
    });
    
    return Array.from(skillMap.values()).sort((a, b) => b.score - a.score);
  }, [skillProgress]);

  const toggleSkillExpanded = (skillName: string) => {
    setExpandedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillName)) {
        newSet.delete(skillName);
      } else {
        newSet.add(skillName);
      }
      return newSet;
    });
  };
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i}>
            <div className="flex justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div className="h-2 bg-gray-200 rounded-full animate-pulse" style={{width: "60%"}}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mergedSkillProgress && mergedSkillProgress.length > 0) {
    return (
      <div className="space-y-4">
        {mergedSkillProgress.map((skill) => {
          const isExpanded = expandedSkills.has(skill.name);
          const hasProgressData = skill.progress && skill.progress.length > 0;
          
          return (
            <div key={skill.name} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className={`p-4 bg-gray-50 ${hasProgressData && collapsible ? 'cursor-pointer hover:bg-gray-100' : ''} transition-colors`}
                onClick={() => hasProgressData && collapsible && toggleSkillExpanded(skill.name)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{skill.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      skill.level === 'expert' ? 'bg-purple-100 text-purple-800' :
                      skill.level === 'advanced' ? 'bg-blue-100 text-blue-800' :
                      skill.level === 'intermediate' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {skill.level}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{skill.score.toFixed(1)}</span>
                    {skill.trend !== null && skill.trend !== undefined && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        skill.trend > 0 ? 'bg-green-100 text-green-700' :
                        skill.trend < 0 ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {skill.trend > 0 ? '+' : ''}{skill.trend.toFixed(1)}
                      </span>
                    )}
                    {hasProgressData && collapsible && (
                      <div className="ml-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        skill.level === 'expert' ? 'bg-purple-500' :
                        skill.level === 'advanced' ? 'bg-blue-500' :
                        skill.level === 'intermediate' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${Math.min(100, skill.score)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{skill.totalSessions} sessions</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        skill.source === 'Assessment' ? 'bg-purple-50 text-purple-600' :
                        skill.source === 'Interview' ? 'bg-blue-50 text-blue-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {skill.source}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(skill.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {hasProgressData && (!collapsible || isExpanded) && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={skill.progress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) =>
                            new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          }
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                        />
                        <Tooltip
                          labelFormatter={(date) =>
                            new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          }
                          formatter={(value: number) => [
                            `${value.toFixed(1)}`, 
                            'Score'
                          ]}
                          contentStyle={{ 
                            backgroundColor: '#f9fafb', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke={
                            skill.level === 'expert' ? '#8b5cf6' :
                            skill.level === 'advanced' ? '#3b82f6' :
                            skill.level === 'intermediate' ? '#10b981' :
                            '#6b7280'
                          }
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // No Skills Data Available
  return (
    <div className="text-center py-12">
      <div className="mb-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">No Skills Tracked Yet</h4>
        <p className="text-gray-500 mb-6">
          Complete interviews, assessments, or JD analysis to see your skill development
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
        <Link 
          href="/avatar-interview"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Brain className="w-4 h-4" />
          <span className="text-sm font-medium">Start AI Interview</span>
        </Link>
        <Link 
          href="/test"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <TestTube className="w-4 h-4" />
          <span className="text-sm font-medium">Take Assessment</span>
        </Link>
        <Link 
          href="/jd"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Analyze Job Description</span>
        </Link>
      </div>
    </div>
  );
};

export default SkillsProgress;