import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';

interface StartScreenProps {
  category: string;
  position: string;
  level: string;
  duration: number;
  setCategory: (v: string) => void;
  setPosition: (v: string) => void;
  setLevel: (v: string) => void;
  setDuration: (v: number) => void;
  startInterview: () => void;
  isLoading?: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({
  position, duration,
  setCategory, setPosition, setLevel, setDuration,
  startInterview,
  isLoading = false
}) => {
  // Position is now sourced from user preferences; selector removed from UI
  const [preferredJobRole, setPreferredJobRole] = React.useState<{
    title?: string;
    level?: string;
    description?: string;
    minExperience?: number;
    maxExperience?: number;
    category?: { 
      name?: string;
      skills?: string[];
    };
  } | null>(null);

  // Load user interview preferences and user preferences (same API used by avatar interview)
  const [userPreferences, setUserPreferences] = React.useState<{ 
    interviewPreferences?: { 
      selectedSkills?: string[];
      customSkills?: string[];
    };
  } | null>(null);

  React.useEffect(() => {
    const fetchPrefs = async () => {
      try {
        // Load both interview preferences and user preferences
        const [prefsRes, userRes] = await Promise.all([
          fetch('/api/profile/interview-preferences'),
          fetch('/api/profile')
        ]);
        
        if (prefsRes.ok) {
          const data = await prefsRes.json();
          if (data?.preferredJobRole) {
            setPreferredJobRole(data.preferredJobRole);
            // Map preferred job role to test-mode selectors
            const roleTitle = data.preferredJobRole.title || '';
            const roleLevel = data.preferredJobRole.level || '';
            const categoryName = data.preferredJobRole.category?.name || '';

            // Directly set from preferences (no local constants needed)
            if (categoryName) setCategory(categoryName);
            if (roleTitle) setPosition(roleTitle);
            if (roleLevel) setLevel(roleLevel);
          }
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          setUserPreferences(userData);
        }
      } catch {
        // silent fail
      }
    };
    fetchPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <Card className="bg-white/60 backdrop-blur-sm rounded-xl shadow border border-slate-200">
      <CardHeader>
        <CardTitle>Select interview field</CardTitle>
        <CardDescription>
          Select the field you want to practice and the level that matches your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preferred Job Role (from preferences) */}
        {preferredJobRole && (
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-2xl font-bold text-blue-900">{preferredJobRole.title}</h4>
                <p className="text-blue-700 font-medium">{preferredJobRole.category?.name || '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <p className="text-xs text-blue-700 font-medium">Level</p>
                <p className="text-sm font-semibold text-blue-900">{preferredJobRole.level || '—'}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <p className="text-xs text-blue-700 font-medium">Experience</p>
                <p className="text-sm font-semibold text-blue-900">{preferredJobRole.minExperience}-{preferredJobRole.maxExperience ?? '∞'} years</p>
              </div>
            </div>
            {preferredJobRole.description && (
              <div className="bg-white rounded-lg p-4 border border-blue-100 mb-4">
                <p className="text-xs text-blue-700 font-medium mb-1">Job Description</p>
                <p className="text-sm text-blue-900">{preferredJobRole.description}</p>
              </div>
            )}
            {((userPreferences?.interviewPreferences?.selectedSkills && userPreferences.interviewPreferences.selectedSkills.length > 0) || preferredJobRole.category?.skills) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-blue-700 font-medium">
                    {/* Show user selected skills if available, otherwise show all category skills */}
                    {userPreferences?.interviewPreferences?.selectedSkills && userPreferences.interviewPreferences.selectedSkills.length > 0 
                      ? "Your Selected Skills" 
                      : "Required Skills"}
                  </p>
                  {(!userPreferences?.interviewPreferences?.selectedSkills || userPreferences.interviewPreferences.selectedSkills.length === 0) && (
                    <a 
                      href="/dashboard/profile" 
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Customize Skills
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    // Use user selected skills if available, otherwise use all category skills
                    const skillsToShow = userPreferences?.interviewPreferences?.selectedSkills && userPreferences.interviewPreferences.selectedSkills.length > 0
                      ? [...userPreferences.interviewPreferences.selectedSkills, ...(userPreferences.interviewPreferences?.customSkills || [])]
                      : preferredJobRole.category?.skills || [];
                    
                    console.log('🎯 Assessment Mode Skills Display Debug:');
                    console.log('  - userPreferences:', userPreferences);
                    console.log('  - selectedSkills:', userPreferences?.interviewPreferences?.selectedSkills);
                    console.log('  - customSkills:', userPreferences?.interviewPreferences?.customSkills);
                    console.log('  - skillsToShow:', skillsToShow);
                    console.log('  - preferredJobRole.category.skills:', preferredJobRole.category?.skills);
                    
                    return (
                      <>
                        {skillsToShow.slice(0, 12).map((skill: string, idx: number) => (
                          <span 
                            key={idx} 
                            className={`px-3 py-1 text-xs font-medium rounded-full border ${
                              userPreferences?.interviewPreferences?.selectedSkills && userPreferences.interviewPreferences.selectedSkills.length > 0
                                ? "bg-green-50 text-green-800 border-green-200"  // User selected skills
                                : "bg-white text-blue-800 border-blue-200"      // Default category skills
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                        {skillsToShow.length > 12 && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">
                            +{skillsToShow.length - 12} more
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Thời gian phỏng vấn */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="duration">Interview duration: {duration} minutes</Label>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[5, 10, 15, 20, 30].map((t) => (
              <Button
                key={t}
                variant={t === duration ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full px-4 ${t === duration ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                onClick={() => setDuration(t)}
              >
                {t} minutes
              </Button>
            ))}
          </div>
        </div>

        {/* Thông tin phỏng vấn */}
        <div className="bg-gray-50/70 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-2">Interview information:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Real interview question</strong> for position {position}</span></li>
            <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Time limit</strong> for each question</span></li>
            <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Detailed analysis</strong> from AI about your answer</span></li>
            <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Specific suggestions</strong> for improving each answer</span></li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={startInterview}
          className="w-full h-12 rounded-xl text-lg font-semibold bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-0 transition-colors"
          disabled={isLoading}
        >
          Start interview
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StartScreen;