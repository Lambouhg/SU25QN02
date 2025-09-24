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

    if (!profileResponse.ok) {
      throw new Error('Failed to save skills to User.skills');
    }

    // 2. Optionally sync to interviewPreferences.selectedSkills
    if (syncToInterviewPreferences) {
      const prefResponse = await fetch('/api/profile/interview-preferences');
      if (prefResponse.ok) {
        const currentPrefs = await prefResponse.json();
        
        await fetch('/api/profile/interview-preferences', {
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
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing skills:', error);
    return { success: false, error };
  }
}

/**
 * Load and merge skills from both User.skills and interviewPreferences.selectedSkills
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

    // Merge and deduplicate
    const mergedSkills = Array.from(new Set([...userSkills, ...interviewSkills]));
    
    // If there are differences, sync them
    if (userSkills.length !== mergedSkills.length || 
        interviewSkills.length !== mergedSkills.length) {
      await syncSkills({ skills: mergedSkills });
    }

    return mergedSkills;
  } catch (error) {
    console.error('Error loading merged skills:', error);
    return [];
  }
}