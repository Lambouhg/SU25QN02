export type PetEvolution = 'egg' | 'baby' | 'teen' | 'adult' | 'master';

export interface PetData {
  level: number;
  evolution: PetEvolution;
  currentActivities: number;
  targetActivities: number;
  happinessPercentage: number;
  name: string;
  isAlive: boolean;
}

export const calculatePetLevel = (totalActivities: number): number => {
  if (totalActivities >= 100) return 5;
  if (totalActivities >= 75) return 4;
  if (totalActivities >= 50) return 3;
  if (totalActivities >= 25) return 2;
  if (totalActivities >= 10) return 2;
  return 1;
};

export const calculatePetEvolution = (totalActivities: number): PetEvolution => {
  if (totalActivities >= 100) return 'master';
  if (totalActivities >= 75) return 'adult';
  if (totalActivities >= 50) return 'teen';
  if (totalActivities >= 25) return 'baby';
  if (totalActivities >= 10) return 'baby';
  return 'egg';
};

export const getTargetActivities = (level: number): number => {
  switch (level) {
    case 1: return 10; // Level 1 cần 10 activities để lên level 2
    case 2: return 25; // Level 2 cần 25 activities để lên level 3
    case 3: return 50; // Level 3 cần 50 activities để lên level 4
    case 4: return 75; // Level 4 cần 75 activities để lên level 5
    case 5: return 100; // Level 5 cần 100 activities để lên level 6
    default: return 10;
  }
};

export const calculatePetData = (totalActivities: number, currentStreak: number): PetData => {
  const petLevel = calculatePetLevel(totalActivities);
  const petEvolution = calculatePetEvolution(totalActivities);
  const targetActivities = getTargetActivities(petLevel);
  const currentActivities = Math.min(totalActivities, targetActivities);
  const happinessPercentage = (currentActivities / targetActivities) * 100;

  return {
    level: petLevel,
    evolution: petEvolution,
    currentActivities,
    targetActivities,
    happinessPercentage,
    name: 'Chuck Chicken',
    isAlive: currentStreak > 0,
  };
};

export const getPetEmoji = (evolution: PetEvolution, isAlive: boolean): string => {
  if (!isAlive) return '💀';
  switch (evolution) {
    case 'egg': return '🥚';
    case 'baby': return '🐣';
    case 'teen': return '🐤';
    case 'adult': return '🐦';
    case 'master': return '🦅';
    default: return '🥚';
  }
};

export const getPetEvolutionStages = () => [
  { stage: 'egg' as const, level: 1, emoji: '🥚', name: 'Egg', requirement: '0-9 activities' },
  { stage: 'baby' as const, level: 2, emoji: '🐣', name: 'Baby', requirement: '10-24 activities' },
  { stage: 'teen' as const, level: 3, emoji: '🐤', name: 'Teen', requirement: '25-49 activities' },
  { stage: 'adult' as const, level: 4, emoji: '🐦', name: 'Adult', requirement: '50-74 activities' },
  { stage: 'master' as const, level: 5, emoji: '🦅', name: 'Master', requirement: '75+ activities' },
];
