/**
 * Utility functions to sync skills between User.skills and User.interviewPreferences.selectedSkills
 */

interface SyncSkillsOptions {
  skills: string[];
  syncToInterviewPreferences?: boolean;
  syncFromInterviewPreferences?: boolean;
}

/**
 * Sync skills between User.skills and interviewPreferences.selectedSkills
 */
export async function syncSkills(options: SyncSkillsOptions) {
  const { skills, syncToInterviewPreferences = true } = options;
  
  console.log('🔄 Syncing skills:', { 
    skills, 
    syncToInterviewPreferences,
    optionsReceived: options 
  });
  
  try {
    // 1. Always save to User.skills
    const profileResponse = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        skills: skills,
      }),
    });

    console.log('📝 Profile API response:', {
      ok: profileResponse.ok,
      status: profileResponse.status,
      statusText: profileResponse.statusText
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('❌ Profile API error:', errorText);
      throw new Error('Failed to save skills to User.skills');
    }

    const profileResult = await profileResponse.json();
    console.log('✅ Profile saved successfully:', profileResult.skills);

    console.log('🔍 About to check syncToInterviewPreferences:', syncToInterviewPreferences);

    // 2. Optionally sync to interviewPreferences.selectedSkills
    if (syncToInterviewPreferences) {
      console.log('🔄 Syncing to interview preferences...');
      const prefResponse = await fetch('/api/profile/interview-preferences');
      if (prefResponse.ok) {
        const currentPrefs = await prefResponse.json();
        console.log('📋 Current interview preferences:', {
          currentSelectedSkills: currentPrefs.interviewPreferences?.selectedSkills,
          newSkills: skills
        });
        
        const updateResponse = await fetch('/api/profile/interview-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...currentPrefs,
            interviewPreferences: {
              ...currentPrefs.interviewPreferences,
              selectedSkills: skills
            }
          }),
        });
        
        console.log('📝 Interview preferences response:', {
          ok: updateResponse.ok,
          status: updateResponse.status
        });
        
        if (updateResponse.ok) {
          const updatedPrefs = await updateResponse.json();
          console.log('✅ Interview preferences updated:', {
            newSelectedSkills: updatedPrefs.interviewPreferences?.selectedSkills
          });
        } else {
          const errorText = await updateResponse.text();
          console.error('❌ Failed to update interview preferences:', errorText);
        }
      } else {
        console.error('❌ Failed to fetch current interview preferences');
      }
    } else {
      console.log('⏭️ Skipping interview preferences sync');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error syncing skills:', error);
    return { success: false, error };
  }
}

/**
 * Load and merge skills from both User.skills and interviewPreferences.selectedSkills
 * Priority: Use User.skills as the primary source of truth when available
 */
export async function loadMergedSkills(): Promise<string[]> {
  try {
    const [userResponse, prefsResponse] = await Promise.all([
      fetch('/api/user/current'),
      fetch('/api/profile/interview-preferences')
    ]);

    const userSkills: string[] = [];
    const interviewSkills: string[] = [];

    if (userResponse.ok) {
      const userData = await userResponse.json();
      userSkills.push(...(Array.isArray(userData.skills) ? userData.skills : []));
    }

    if (prefsResponse.ok) {
      const prefsData = await prefsResponse.json();
      interviewSkills.push(...(Array.isArray(prefsData.interviewPreferences?.selectedSkills) 
        ? prefsData.interviewPreferences.selectedSkills : []));
    }

    console.log('📊 Skills comparison:', {
      userSkills,
      interviewSkills,
      userSkillsLength: userSkills.length,
      interviewSkillsLength: interviewSkills.length
    });

    // Priority-based logic: User.skills takes precedence when available
    let finalSkills: string[] = [];
    
    if (userSkills.length > 0) {
      // Use User.skills as primary source
      finalSkills = [...userSkills];
      console.log('🎯 Using User.skills as primary source:', finalSkills);
      
      // Check if interviewPreferences needs sync
      const skillsMatch = userSkills.length === interviewSkills.length && 
                         userSkills.every(skill => interviewSkills.includes(skill));
      
      if (!skillsMatch) {
        console.log('🔄 Syncing User.skills to interview preferences');
        await syncSkills({ 
          skills: finalSkills, 
          syncToInterviewPreferences: true 
        });
      }
    } else if (interviewSkills.length > 0) {
      // Fallback to interviewPreferences if User.skills is empty
      finalSkills = [...interviewSkills];
      console.log('🔄 Using interview preferences as fallback:', finalSkills);
      
      // Sync to User.skills
      await syncSkills({ 
        skills: finalSkills, 
        syncToInterviewPreferences: false 
      });
    } else {
      finalSkills = [];
      console.log('📝 No skills found in either source');
    }
    
    console.log('✅ Final skills selected:', finalSkills);
    return finalSkills;
  } catch (error) {
    console.error('Error loading merged skills:', error);
    return [];
  }
}