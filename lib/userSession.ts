// User session management using localStorage
// This ensures each user has their own private achievement progress

export interface UserSession {
  sessionId: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface UserStats {
  correct: number;
  total: number;
  streak: number;
}

export interface UserAchievement {
  id: string;
  unlocked: boolean;
  unlockedAt?: string;
}

// Generate a unique session ID
function generateSessionId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get or create user session
export function getUserSession(): UserSession {
  const stored = localStorage.getItem('math_problem_user_session');
  
  if (stored) {
    try {
      const session = JSON.parse(stored) as UserSession;
      // Update last active time
      const updatedSession = {
        ...session,
        lastActiveAt: new Date().toISOString()
      };
      localStorage.setItem('math_problem_user_session', JSON.stringify(updatedSession));
      return updatedSession;
    } catch (error) {
      console.error('Error parsing stored session:', error);
    }
  }
  
  // Create new session
  const newSession: UserSession = {
    sessionId: generateSessionId(),
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };
  
  localStorage.setItem('math_problem_user_session', JSON.stringify(newSession));
  return newSession;
}

// Get user stats from localStorage
export function getUserStats(): UserStats {
  const stored = localStorage.getItem('math_problem_user_stats');
  
  if (stored) {
    try {
      return JSON.parse(stored) as UserStats;
    } catch (error) {
      console.error('Error parsing stored stats:', error);
    }
  }
  
  // Return default stats
  return {
    correct: 0,
    total: 0,
    streak: 0
  };
}

// Update user stats in localStorage
export function updateUserStats(stats: UserStats): void {
  localStorage.setItem('math_problem_user_stats', JSON.stringify(stats));
}

// Get user achievements from localStorage
export function getUserAchievements(): UserAchievement[] {
  const stored = localStorage.getItem('math_problem_user_achievements');
  
  if (stored) {
    try {
      return JSON.parse(stored) as UserAchievement[];
    } catch (error) {
      console.error('Error parsing stored achievements:', error);
    }
  }
  
  // Return default achievements (all locked)
  return [
    { id: 'first-problem', unlocked: false },
    { id: 'quick-learner', unlocked: false },
    { id: 'hot-streak', unlocked: false },
    { id: 'math-master', unlocked: false },
    { id: 'perfect-score', unlocked: false },
    { id: 'hint-master', unlocked: false },
    { id: 'speed-demon', unlocked: false },
    { id: 'problem-solver', unlocked: false }
  ];
}

// Update user achievements in localStorage
export function updateUserAchievements(achievements: UserAchievement[]): void {
  localStorage.setItem('math_problem_user_achievements', JSON.stringify(achievements));
}

// Check and unlock achievements based on current stats
export function checkAndUnlockAchievements(stats: UserStats): UserAchievement[] {
  const achievements = getUserAchievements();
  const now = new Date().toISOString();
  
  // Update achievements based on current stats
  achievements.forEach(achievement => {
    if (!achievement.unlocked) {
      let shouldUnlock = false;
      
      switch (achievement.id) {
        case 'first-problem':
          shouldUnlock = stats.total >= 1;
          break;
        case 'quick-learner':
          shouldUnlock = stats.correct >= 5;
          break;
        case 'hot-streak':
          shouldUnlock = stats.streak >= 3;
          break;
        case 'math-master':
          shouldUnlock = stats.total >= 10;
          break;
        case 'perfect-score':
          shouldUnlock = stats.total >= 5 && stats.correct === stats.total;
          break;
        case 'hint-master':
          shouldUnlock = stats.total >= 3;
          break;
        case 'speed-demon':
          shouldUnlock = stats.streak >= 5;
          break;
        case 'problem-solver':
          shouldUnlock = stats.total >= 20;
          break;
      }
      
      if (shouldUnlock) {
        achievement.unlocked = true;
        achievement.unlockedAt = now;
      }
    }
  });
  
  // Save updated achievements
  updateUserAchievements(achievements);
  return achievements;
}

// Get user problem history from localStorage
export function getUserProblemHistory(): any[] {
  const stored = localStorage.getItem('math_problem_user_history');
  
  if (stored) {
    try {
      return JSON.parse(stored) as any[];
    } catch (error) {
      console.error('Error parsing stored history:', error);
    }
  }
  
  return [];
}

// Add problem to user history
export function addToUserHistory(problemData: any): void {
  const history = getUserProblemHistory();
  history.unshift(problemData); // Add to beginning
  
  // Keep only last 50 problems
  if (history.length > 50) {
    history.splice(50);
  }
  
  localStorage.setItem('math_problem_user_history', JSON.stringify(history));
}

// Clear all user data (for testing/reset)
export function clearUserData(): void {
  localStorage.removeItem('math_problem_user_session');
  localStorage.removeItem('math_problem_user_stats');
  localStorage.removeItem('math_problem_user_achievements');
  localStorage.removeItem('math_problem_user_history');
}
