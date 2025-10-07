'use client'

import { useState, useEffect } from 'react'
import { 
  getUserSession, 
  getUserStats, 
  updateUserStats, 
  getUserAchievements, 
  checkAndUnlockAchievements,
  getUserProblemHistory,
  addToUserHistory,
  UserStats,
  UserAchievement
} from '../lib/userSession'

// TODO: maybe extract these interfaces to a separate file?
interface MathProblem {
  problem_text: string
  final_answer: number
  difficulty: 'easy' | 'medium' | 'hard'
  problem_type: 'addition' | 'subtraction' | 'multiplication' | 'division'
  steps?: string[]
  hints?: string[]
}

interface ProblemHistory {
  id: string
  problem_text: string
  user_answer: number
  correct_answer: number
  is_correct: boolean
  difficulty: string
  problem_type: string
  hints_used: number
  total_hints: number
  created_at: string
}

export default function Home() {
  const [problem, setProblem] = useState<MathProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  
  // settings
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [selectedProblemType, setSelectedProblemType] = useState<'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed'>('mixed')
  
  // User-specific stats and achievements (from localStorage)
  const [score, setScore] = useState<UserStats>({ correct: 0, total: 0, streak: 0 })
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  
  // hints
  const [hints, setHints] = useState<string[]>([])
  const [currentHint, setCurrentHint] = useState(0)
  const [showSteps, setShowSteps] = useState(false)
  const [hasSubmittedWrongAnswer, setHasSubmittedWrongAnswer] = useState(false)
  const [isGeneratingHint, setIsGeneratingHint] = useState(false)
  const [isRefreshingHistory, setIsRefreshingHistory] = useState(false)
  const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null)
  
  // navigation
  const [currentView, setCurrentView] = useState<'main' | 'history' | 'stats'>('main')
  const [problemHistory, setProblemHistory] = useState<ProblemHistory[]>([])
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  // Initialize user session and load user data
  useEffect(() => {
    // Get or create user session
    const userSession = getUserSession()
    console.log('User session:', userSession.sessionId)
    
    // Load user stats and achievements
    const userStats = getUserStats()
    const userAchievements = getUserAchievements()
    
    setScore(userStats)
    setAchievements(userAchievements)
    
    // Load user problem history
    loadUserProblemHistory()
    
    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      setShowDebugInfo(true)
    }
  }, [])

  // Load user problem history from localStorage
  const loadUserProblemHistory = () => {
    const history = getUserProblemHistory()
    setProblemHistory(history)
  }

  const generateProblem = async () => {
    setIsGenerating(true)
    setFeedback('')
    setIsCorrect(null)
    setHints([])
    setCurrentHint(0)
    setShowSteps(false)
    setUserAnswer('')
    setHasSubmittedWrongAnswer(false)
    setIsGeneratingHint(false)
    
    try {
      const userSession = getUserSession()
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate',
          difficulty: selectedDifficulty,
          problemType: selectedProblemType,
          userSessionId: userSession.sessionId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setProblem(data.problem)
        setSessionId(data.sessionId)
        console.log('Session ID received:', data.sessionId) // debug log
      } 
      else {
        setFeedback('Failed to generate problem. Please try again.')
      }
    } 
    catch (error) {
      console.error('Error generating problem:', error)
      setFeedback('Failed to generate problem. Please try again.')
    } 
    finally {
      setIsGenerating(false)
    }
  }

  const submitAnswer = async () => {
    if (!userAnswer || !sessionId) return
    
    setIsSubmitting(true)
    try {
      const userSession = getUserSession()
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'submit',
          sessionId: sessionId,
          userAnswer: parseFloat(userAnswer),
          hintsUsed: hints.length,
          userSessionId: userSession.sessionId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setIsCorrect(data.isCorrect)
        setFeedback(data.feedback)
        
        // Update user stats based on the submission
        const newStats = { ...score }
        newStats.total += 1
        if (data.isCorrect) {
          newStats.correct += 1
          newStats.streak += 1
        } else {
          newStats.streak = 0
        }
        
        // Save updated stats to localStorage
        updateUserStats(newStats)
        setScore(newStats)
        
        // Add to user history
        addToUserHistory(data.problemData)
        
        // Check and unlock achievements
        const updatedAchievements = checkAndUnlockAchievements(newStats)
        setAchievements(updatedAchievements)
        
        // Reload user history
        loadUserProblemHistory()
        
        // Track if user submitted wrong answer to enable dynamic hints
        if (!data.isCorrect) {
          setHasSubmittedWrongAnswer(true)
        }
      } 
      else {
        setFeedback('Failed to submit answer. Please try again.')
      }
    } 
    catch (error) {
      console.error('Error submitting answer:', error)
      setFeedback('Failed to submit answer. Please try again.')
    } 
    finally {
      setIsSubmitting(false)
    }
  }

  const getHint = async () => {
    if (!problem || !sessionId) return
    
    // If user has submitted wrong answer, use dynamic AI hints
    if (hasSubmittedWrongAnswer) {
      setIsGeneratingHint(true)
      try {
        const response = await fetch('/api/math-problem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'getHint',
            sessionId: sessionId,
            hintIndex: currentHint
          })
        })
        
        const data = await response.json()
        if (data.success) {
          setHints([...hints, data.hint])
          setCurrentHint(currentHint + 1)
        } else {
          // Fallback to pre-generated hints if AI fails
          if (problem.hints && currentHint < problem.hints.length) {
            setHints([...hints, problem.hints[currentHint]])
            setCurrentHint(currentHint + 1)
          }
        }
      } catch (error) {
        console.error('Error getting dynamic hint:', error)
        // Fallback to pre-generated hints if API fails
        if (problem.hints && currentHint < problem.hints.length) {
          setHints([...hints, problem.hints[currentHint]])
          setCurrentHint(currentHint + 1)
        }
      } finally {
        setIsGeneratingHint(false)
      }
    } else {
      // Use pre-generated hints for first attempts
      if (problem.hints && currentHint < problem.hints.length) {
        setHints([...hints, problem.hints[currentHint]])
        setCurrentHint(currentHint + 1)
      }
    }
  }

  return (
    <div className="main-wrapper">
      {/* Header */}
      <header className="main-header">
        <div className="header-content">
          <h1 className="header-title">
          Math Problem Generator
        </h1>
          {showDebugInfo && (
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.75rem', 
              color: '#6b7280',
              fontFamily: 'monospace',
              backgroundColor: '#f3f4f6',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              display: 'inline-block'
            }}>
              Session: {getUserSession().sessionId.substring(0, 12)}...
              <button 
                onClick={() => setShowDebugInfo(false)}
                style={{ 
                  marginLeft: '0.5rem', 
                  fontSize: '0.625rem', 
                  color: '#9ca3af',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Hide debug info"
              >
                ✕
              </button>
            </div>
          )}
          {!showDebugInfo && (
            <button 
              onClick={() => setShowDebugInfo(true)}
              style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.625rem', 
                color: '#9ca3af',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              title="Show debug info"
            >
              Debug Info
            </button>
          )}
        </div>
      </header>

      <main className="main-container">
        {/* Navigation Tabs */}
        <div className="nav-tabs-container">
          <button
            onClick={() => setCurrentView('main')}
            className={`nav-tab ${currentView === 'main' ? 'active' : ''}`}
          >
            <span>⚡</span>
            Practice
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`nav-tab ${currentView === 'history' ? 'active' : ''}`}
          >
            <span>📖</span>
            History
          </button>
          <button
            onClick={() => setCurrentView('stats')}
            className={`nav-tab ${currentView === 'stats' ? 'active' : ''}`}
          >
            <span>📈</span>
            Stats
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards-container">
          <div className="stats-card">
            <div className="stats-number total">
              {score.total}
            </div>
            <div className="stats-label">
              Total Problems
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stats-number correct">
              {score.correct}
            </div>
            <div className="stats-label">
              Correct Answers
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stats-number streak">
              {score.streak}
            </div>
            <div className="stats-label">
              Current Streak
            </div>
          </div>
        </div>

        {/* Main Practice View */}
        {currentView === 'main' && (
          <>

        {/* Settings Card */}
        <div className="settings-card">
          <h3 className="settings-title">
            ⚙️ Problem Settings {/* TODO: maybe add more settings later */}
          </h3>
          
          <div className="settings-grid">
            {/* Difficulty Selection */}
            <div>
              <label className="settings-label">
                Difficulty Level {/* easy, medium, hard */}
              </label>
              <div className="difficulty-buttons-container">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(level)}
                    className={`difficulty-btn ${selectedDifficulty === level ? 'selected' : ''}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem Type Selection */}
            <div>
              <label className="settings-label">
                Problem Type {/* what kind of math */}
              </label>
              <select
                value={selectedProblemType}
                onChange={(e) => setSelectedProblemType(e.target.value as any)}
                className="problem-type-select"
              >
                <option value="mixed">Mixed Operations</option>
                <option value="addition">Addition</option>
                <option value="subtraction">Subtraction</option>
                <option value="multiplication">Multiplication</option>
                <option value="division">Division</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="generate-btn-container">
          <button
            onClick={generateProblem}
            disabled={isGenerating}
            className="generate-btn"
          >
            {isGenerating ? (
              <>
                <div className="loading-spinner"></div>
                Generating... {/* loading state */}
              </>
            ) : (
          <>
            Generate New Problem
          </>
            )}
          </button>
        </div>

            {/* Problem Display */}
        {problem && (
              <div className="problem-card">
            {/* Problem Header */}
            <div className="problem-header">
              <div className="problem-header-content">
                <div className="problem-header-icon">
                  <span>📝</span>
                </div>
                <div>
                  <h3 className="problem-title">
                    Your Math Problem
                  </h3>
                  <p className="problem-subtitle">
                    Solve this step by step
                  </p>
                </div>
              </div>
              
              {/* Problem Tags */}
              <div className="problem-tags-container">
                <span className={`problem-tag ${problem.difficulty}`}>
                  {problem.difficulty}
                </span>
                <span className={`problem-tag ${problem.problem_type}`}>
                  {problem.problem_type}
                </span>
              </div>
            </div>
            
            {/* Problem Text */}
            <div className="problem-text-card">
              <p className="problem-text">
              {problem.problem_text}
            </p>
            </div>
            
            {/* Action Buttons */}
            <div className="action-buttons-container">
              <button
                onClick={getHint}
                disabled={!problem?.hints || currentHint >= (problem?.hints?.length || 0) || isGeneratingHint || isCorrect === true}
                className="action-btn hint-btn"
              >
                {isGeneratingHint ? (
                  <>
                    <div className="loading-spinner"></div>
                    Generating AI Hint...
                  </>
                ) : (
                  <>
                    <span>💡</span>
                    {hasSubmittedWrongAnswer ? 'AI Hint' : 'Hint'} ({currentHint}/{problem?.hints?.length || 0})
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowSteps(!showSteps)}
                className={`action-btn steps-btn ${!showSteps ? 'inactive' : ''}`}
              >
                <span>{showSteps ? '👁️' : '🔍'}</span>
                {showSteps ? 'Hide Steps' : 'Show Steps'}
              </button>
            </div>
            
            {/* Hints Display */}
            {hints.length > 0 && (
              <div className="hints-container">
                <div className="hints-list">
                  {hints.map((hint, index) => (
                    <div key={index} className="hint-card">
                      <p className="hint-text">
                        💡 {hint}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Step-by-Step Solution */}
            {showSteps && problem.steps && problem.steps.length > 0 && (
              <div className="steps-container">
                <div className="steps-card">
                  {problem.steps.map((step, index) => (
                    <div key={index} className="step-item">
                      <div className="step-content">
                        <div className="step-number">
                          {index + 1}
                        </div>
                        <p className="step-text">
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Answer Input */}
            <div className="answer-input-container">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numbers, decimal point, and minus sign
                    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                      setUserAnswer(value)
                    }
                  }}
                placeholder="Enter your answer..."
                className="answer-input"
                />
              </div>

            {/* Feedback Display - Above submit button */}
            {feedback && (
              <div className={`feedback-container ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className={`feedback-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <p className={`feedback-text ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? '🎉' : '❌'} {feedback}
                  </p>
                </div>
              </div>
            )}
              
            {/* Submit Button */}
              <button
              onClick={submitAnswer}
                disabled={!userAnswer || isSubmitting || (isCorrect === true)}
              className="submit-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Checking Answer... {/* processing */}
                </>
              ) : (
          <>
            <span>✓</span>
                {isCorrect === true ? 'Answer Correct!' : 'Submit Answer'}
          </>
              )}
              </button>
          </div>
        )}
          </>
        )}

        {/* History View */}
        {currentView === 'history' && (
          <div>
            {/* History Header */}
            <div className="history-header-card">
              <div className="history-header-content">
                <div className="history-header-icon">
                  <span>📚</span>
                </div>
                <div>
                  <h3 className="history-header-title">
                    Problem History
                  </h3>
                  <p className="history-header-subtitle">
                    Your recent problem attempts
                  </p>
                </div>
              </div>
            </div>
            
            {/* History Items */}
            <div className="history-items-container">
              {problemHistory.map((item) => (
                <div key={item.id} className="history-item-card">
                  <div className="history-problem-text">
                    <p className="history-problem-content">
                      {item.problem_text}
                    </p>
                    <div className="history-item-tags">
                      <span className={`problem-tag ${item.difficulty}`}>
                        {item.difficulty}
                      </span>
                      <span className={`problem-tag ${item.problem_type}`}>
                        {item.problem_type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="history-answers-container">
                    <div className="history-answers-info">
                      <span>Your answer: <strong className="history-answer-bold">{item.user_answer}</strong></span>
                      <span>Correct: <strong className="history-answer-bold">{item.correct_answer}</strong></span>
                      <span>Hints used: <strong className="history-hints-bold">{item.hints_used}/{item.total_hints}</strong></span>
                    </div>
                    <div className={`history-status ${item.is_correct ? 'correct' : 'incorrect'}`}>
                      <span>{item.is_correct ? '✅' : '❌'}</span>
                      {item.is_correct ? 'Correct' : 'Incorrect'}
                    </div>
                  </div>
                </div>
              ))}
              
              {problemHistory.length === 0 && (
                <div className="history-empty-state">
                  <div className="history-empty-icon">📝</div>
                  <p className="history-empty-title">No problems attempted yet.</p>
                  <p className="history-empty-subtitle">Start practicing to see your history here!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats View */}
        {currentView === 'stats' && (
          <div>
            {/* Stats Header */}
            <div className="stats-header-card">
              <div className="stats-header-content">
                <div className="stats-header-icon">
                  <span>📊</span>
                </div>
                <div>
                  <h3 className="stats-header-title">
                    Your Statistics
                  </h3>
                  <p className="stats-header-subtitle">
                    Track your learning progress
                  </p>
                </div>
              </div>
            </div>
            
            {/* Overall Stats */}
            <div className="stats-overview-cards">
              <div className="stats-overview-card">
                <div className="stats-overview-number">
                  {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                </div>
                <div className="stats-overview-label">Accuracy Rate</div>
              </div>
              
              <div className="stats-overview-card">
                <div className="stats-overview-number streak">
                  {score.streak}
                </div>
                <div className="stats-overview-label">Current Streak</div>
              </div>
              
              <div className="stats-overview-card">
                <div className="stats-overview-number total">
                  {score.total}
                </div>
                <div className="stats-overview-label">Total Problems</div>
              </div>
            </div>
            
            {/* Achievement Badges */}
            <div className="achievements-card">
              <h4 className="achievements-title">
                🏆 Achievements
              </h4>
              <div className="achievements-grid">
                {/* First Problem Achievement */}
                <div 
                  className={`achievement-badge ${achievements.find(a => a.id === 'first-problem')?.unlocked ? 'unlocked' : 'locked'}`}
                  onMouseEnter={() => setHoveredAchievement('first-problem')}
                  onMouseLeave={() => setHoveredAchievement(null)}
                >
                  <div className="achievement-icon">🎯</div>
                  <div className="achievement-name">First Problem</div>
                  <div className="achievement-description">
                    {achievements.find(a => a.id === 'first-problem')?.unlocked ? 'Completed!' : 'Solve 1 problem'}
                  </div>
                  {hoveredAchievement === 'first-problem' && (
                    <div className="achievement-tooltip">
                      {achievements.find(a => a.id === 'first-problem')?.unlocked ? 'Completed! You solved your first math problem.' : 'Solve 1 math problem to unlock this achievement.'}
                      <div className="achievement-tooltip-arrow"></div>
                    </div>
                  )}
                </div>
                
                {/* Quick Learner Achievement */}
                <div 
                  className={`achievement-badge ${achievements.find(a => a.id === 'quick-learner')?.unlocked ? 'unlocked' : 'locked'}`}
                  onMouseEnter={() => setHoveredAchievement('quick-learner')}
                  onMouseLeave={() => setHoveredAchievement(null)}
                >
                  <div className="achievement-icon">🧠</div>
                  <div className="achievement-name">Quick Learner</div>
                  <div className="achievement-description">
                    {achievements.find(a => a.id === 'quick-learner')?.unlocked ? 'Completed!' : 'Solve 5 correctly'}
                  </div>
                  {hoveredAchievement === 'quick-learner' && (
                    <div className="achievement-tooltip">
                      {achievements.find(a => a.id === 'quick-learner')?.unlocked ? 'Completed! You\'ve solved 5 problems correctly.' : 'Solve 5 problems correctly to unlock this achievement.'}
                      <div className="achievement-tooltip-arrow"></div>
                    </div>
                  )}
                </div>
                
                {/* Hot Streak Achievement */}
                <div 
                  className={`achievement-badge ${achievements.find(a => a.id === 'hot-streak')?.unlocked ? 'unlocked' : 'locked'}`}
                  onMouseEnter={() => setHoveredAchievement('hot-streak')}
                  onMouseLeave={() => setHoveredAchievement(null)}
                >
                  <div className="achievement-icon">🔥</div>
                  <div className="achievement-name">Hot Streak</div>
                  <div className="achievement-description">
                    {achievements.find(a => a.id === 'hot-streak')?.unlocked ? 'Completed!' : 'Get 3 streak'}
                  </div>
                  {hoveredAchievement === 'hot-streak' && (
                    <div className="achievement-tooltip">
                      {achievements.find(a => a.id === 'hot-streak')?.unlocked ? 'Completed! You have a streak of 3 correct answers.' : 'Get 3 correct answers in a row to unlock this achievement.'}
                      <div className="achievement-tooltip-arrow"></div>
                    </div>
                  )}
                </div>
                
                {/* Math Master Achievement */}
                <div 
                  className={`achievement-badge ${achievements.find(a => a.id === 'math-master')?.unlocked ? 'unlocked' : 'locked'}`}
                  onMouseEnter={() => setHoveredAchievement('math-master')}
                  onMouseLeave={() => setHoveredAchievement(null)}
                >
                  <div className="achievement-icon">🏆</div>
                  <div className="achievement-name">Math Master</div>
                  <div className="achievement-description">
                    {achievements.find(a => a.id === 'math-master')?.unlocked ? 'Completed!' : 'Solve 10 problems'}
                  </div>
                  {hoveredAchievement === 'math-master' && (
                    <div className="achievement-tooltip">
                      {achievements.find(a => a.id === 'math-master')?.unlocked ? 'Completed! You\'ve solved 10 problems total.' : 'Solve 10 problems total to unlock this achievement.'}
                      <div className="achievement-tooltip-arrow"></div>
                    </div>
                  )}
                </div>
                
                {/* Perfect Score Achievement */}
                <div 
                  className={`achievement-badge ${achievements.find(a => a.id === 'perfect-score')?.unlocked ? 'unlocked' : 'locked'}`}
                  onMouseEnter={() => setHoveredAchievement('perfect-score')}
                  onMouseLeave={() => setHoveredAchievement(null)}
                >
                  <div className="achievement-icon">💯</div>
                  <div className="achievement-name">Perfect Score</div>
                  <div className="achievement-description">
                    {achievements.find(a => a.id === 'perfect-score')?.unlocked ? 'Completed!' : 'Get perfect score'}
                  </div>
                  {hoveredAchievement === 'perfect-score' && (
                    <div className="achievement-tooltip">
                      {achievements.find(a => a.id === 'perfect-score')?.unlocked ? 'Completed! You have a perfect score!' : 'Solve 5+ problems with 100% accuracy to unlock this achievement.'}
                      <div className="achievement-tooltip-arrow"></div>
                    </div>
                  )}
                </div>
                
                {/* Hint Master Achievement */}
                <div 
                  className={`achievement-badge ${achievements.find(a => a.id === 'hint-master')?.unlocked ? 'unlocked' : 'locked'}`}
                  onMouseEnter={() => setHoveredAchievement('hint-master')}
                  onMouseLeave={() => setHoveredAchievement(null)}
                >
                  <div className="achievement-icon">💡</div>
                  <div className="achievement-name">Hint Master</div>
                  <div className="achievement-description">
                    {achievements.find(a => a.id === 'hint-master')?.unlocked ? 'Completed!' : 'Solve 3 problems'}
                  </div>
                  {hoveredAchievement === 'hint-master' && (
                    <div className="achievement-tooltip">
                      {achievements.find(a => a.id === 'hint-master')?.unlocked ? 'Completed! You\'ve used hints effectively.' : 'Solve 3+ problems using hints to unlock this achievement.'}
                      <div className="achievement-tooltip-arrow"></div>
                    </div>
                  )}
                </div>
                
                {/* Speed Demon Achievement */}
                <div 
                  className={`achievement-badge ${achievements.find(a => a.id === 'speed-demon')?.unlocked ? 'unlocked' : 'locked'}`}
                  onMouseEnter={() => setHoveredAchievement('speed-demon')}
                  onMouseLeave={() => setHoveredAchievement(null)}
                >
                  <div className="achievement-icon">⚡</div>
                  <div className="achievement-name">Speed Demon</div>
                  <div className="achievement-description">
                    {achievements.find(a => a.id === 'speed-demon')?.unlocked ? 'Completed!' : 'Get 5 streak'}
                  </div>
                  {hoveredAchievement === 'speed-demon' && (
                    <div className="achievement-tooltip">
                      {achievements.find(a => a.id === 'speed-demon')?.unlocked ? 'Completed! You have an amazing streak!' : 'Get 5 correct answers in a row to unlock this achievement.'}
                      <div className="achievement-tooltip-arrow"></div>
                    </div>
                  )}
                </div>
                
                {/* Problem Solver Achievement */}
                <div 
                  className={`achievement-badge ${achievements.find(a => a.id === 'problem-solver')?.unlocked ? 'unlocked' : 'locked'}`}
                  onMouseEnter={() => setHoveredAchievement('problem-solver')}
                  onMouseLeave={() => setHoveredAchievement(null)}
                >
                  <div className="achievement-icon">🧩</div>
                  <div className="achievement-name">Problem Solver</div>
                  <div className="achievement-description">
                    {achievements.find(a => a.id === 'problem-solver')?.unlocked ? 'Completed!' : 'Solve 20 problems'}
                  </div>
                  {hoveredAchievement === 'problem-solver' && (
                    <div className="achievement-tooltip">
                      {achievements.find(a => a.id === 'problem-solver')?.unlocked ? 'Completed! You\'re a true problem solver!' : 'Solve 20 problems total to unlock this achievement.'}
                      <div className="achievement-tooltip-arrow"></div>
                    </div>
                  )}
                </div>
                
                {score.total === 0 && (
                  <div className="achievements-empty-text">
                    Complete problems to unlock achievements!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}