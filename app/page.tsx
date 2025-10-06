'use client'

import { useState, useEffect } from 'react'

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
  
  // stats
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 })
  
  // hints
  const [hints, setHints] = useState<string[]>([])
  const [currentHint, setCurrentHint] = useState(0)
  const [showSteps, setShowSteps] = useState(false)
  
  // navigation
  const [currentView, setCurrentView] = useState<'main' | 'history' | 'stats'>('main')
  const [problemHistory, setProblemHistory] = useState<ProblemHistory[]>([])

  // load problem history on component mount
  useEffect(() => {
    loadProblemHistory()
  }, [])

  const loadProblemHistory = async () => {
    try {
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getHistory' })
      })
      const data = await response.json()
      if (data.success) {
        setScore(data.score)
        setProblemHistory(data.history)
      }
    } 
    catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const generateProblem = async () => {
    setIsGenerating(true)
    setFeedback('')
    setIsCorrect(null)
    setHints([])
    setCurrentHint(0)
    setShowSteps(false)
    setUserAnswer('')
    
    try {
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate',
          difficulty: selectedDifficulty,
          problemType: selectedProblemType
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
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'submit',
          sessionId: sessionId,
          userAnswer: parseFloat(userAnswer),
          hintsUsed: hints.length
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setIsCorrect(data.isCorrect)
        setFeedback(data.feedback)
        setScore(data.score)
        // Reload history to show updated hint usage
        loadProblemHistory()
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

  const getHint = () => {
    if (!problem || !problem.hints || currentHint >= problem.hints.length) return
    
    // use pre-generated hints - instant!
    setHints([...hints, problem.hints[currentHint]])
    setCurrentHint(currentHint + 1)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#111827', 
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif' // system fonts
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#1f2937', 
        borderBottom: '1px solid #374151',
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            margin: 0,
            color: 'white'
          }}>
          Math Problem Generator
        </h1>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 0.75rem' }}>
        {/* Navigation Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.25rem', 
          marginBottom: '1.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setCurrentView('main')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: currentView === 'main' ? 'linear-gradient(to right, #8b5cf6, #3b82f6)' : '#374151',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'all 0.2s ease',
              minHeight: '44px' // Better touch target
            }}
          >
            <span>⚡</span>
            Practice
          </button>
          <button
            onClick={() => setCurrentView('history')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: currentView === 'history' ? 'linear-gradient(to right, #8b5cf6, #3b82f6)' : '#374151',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
          >
            <span>📖</span>
            History
          </button>
          <button
            onClick={() => setCurrentView('stats')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: currentView === 'stats' ? 'linear-gradient(to right, #8b5cf6, #3b82f6)' : '#374151',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
          >
            <span>📈</span>
            Stats
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '0.75rem', 
          marginBottom: '1.5rem' 
        }}>
          <div style={{ 
            backgroundColor: '#1f2937', 
            borderRadius: '0.75rem', 
            padding: '1rem', 
            border: '1px solid #374151',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.25rem' }}>
              {score.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>
              Total Problems
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#1f2937', 
            borderRadius: '0.75rem', 
            padding: '1rem', 
            border: '1px solid #374151',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.25rem' }}>
              {score.correct}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>
              Correct Answers
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#1f2937', 
            borderRadius: '0.75rem', 
            padding: '1rem', 
            border: '1px solid #374151',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.25rem' }}>
              {score.streak}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600' }}>
              Current Streak
            </div>
          </div>
        </div>

        {/* Main Practice View */}
        {currentView === 'main' && (
          <>

        {/* Settings Card */}
        <div style={{ 
          backgroundColor: '#1f2937', 
          borderRadius: '0.75rem', 
          border: '1px solid #374151', 
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            color: 'white', 
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ⚙️ Problem Settings {/* TODO: maybe add more settings later */}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Difficulty Selection */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#d1d5db', 
                marginBottom: '0.75rem' 
              }}>
                Difficulty Level {/* easy, medium, hard */}
              </label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(level)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      background: selectedDifficulty === level ? 'linear-gradient(to right, #3b82f6, #2563eb)' : '#374151',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease',
                      minHeight: '44px'
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem Type Selection */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#d1d5db', 
                marginBottom: '0.75rem' 
              }}>
                Problem Type {/* what kind of math */}
              </label>
              <select
                value={selectedProblemType}
                onChange={(e) => setSelectedProblemType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.5rem 2rem 0.5rem 0.75rem', // Add right padding for arrow space
                  backgroundColor: '#111827',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  outline: 'none',
                  minHeight: '44px',
                  appearance: 'none', // Remove default arrow
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1rem 1rem',
                  cursor: 'pointer'
                }}
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
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={generateProblem}
            disabled={isGenerating}
            style={{
              background: isGenerating ? 'linear-gradient(to right, #4b5563, #4b5563)' : 'linear-gradient(to right, #10b981, #059669)',
              color: 'white',
              fontWeight: '600',
              padding: '0.875rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              margin: '0 auto',
              boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
              minHeight: '48px'
            }}
          >
            {isGenerating ? (
              <>
                <div style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  border: '2px solid white', 
                  borderTop: '2px solid transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }}></div>
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
              <div style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: '0.75rem', 
                border: '1px solid #374151', 
                padding: '1rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
            {/* Problem Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '2rem', 
                  height: '2rem', 
                  background: 'linear-gradient(to right, #10b981, #059669)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <span style={{ fontSize: '1rem' }}>📝</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', margin: 0 }}>
                    Your Math Problem
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: 0 }}>
                    Solve this step by step
                  </p>
                </div>
              </div>
              
              {/* Problem Tags */}
              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }}>
                <span style={{ 
                  backgroundColor: problem.difficulty === 'easy' ? 'rgba(34, 197, 94, 0.2)' : problem.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: problem.difficulty === 'easy' ? '#22c55e' : problem.difficulty === 'medium' ? '#f59e0b' : '#ef4444',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  border: `1px solid ${problem.difficulty === 'easy' ? '#22c55e' : problem.difficulty === 'medium' ? '#f59e0b' : '#ef4444'}`
                }}>
                  {problem.difficulty}
                </span>
                <span style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  border: '1px solid #3b82f6'
                }}>
                  {problem.problem_type}
                </span>
              </div>
            </div>
            
            {/* Problem Text */}
            <div style={{ 
              backgroundColor: '#111827', 
              borderRadius: '0.5rem', 
              padding: '1.5rem', 
              marginBottom: '1rem',
              border: '1px solid #4b5563' // subtle border
            }}>
              <p style={{ 
                fontSize: '1.125rem', 
                color: '#f3f4f6', 
                lineHeight: '1.6', 
                margin: 0
              }}>
              {problem.problem_text}
            </p>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={getHint}
                disabled={!problem?.hints || currentHint >= (problem?.hints?.length || 0)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: (!problem?.hints || currentHint >= (problem?.hints?.length || 0)) ? 'linear-gradient(to right, #4b5563, #4b5563)' : 'linear-gradient(to right, #f59e0b, #d97706)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: (!problem?.hints || currentHint >= (problem?.hints?.length || 0)) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  boxShadow: (!problem?.hints || currentHint >= (problem?.hints?.length || 0)) ? 'none' : '0 2px 4px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.2s ease',
                  minHeight: '44px',
                  flex: '1 1 auto'
                }}
              >
                <span>💡</span>
                Hint ({currentHint}/{problem?.hints?.length || 0}) {/* show progress */}
              </button>
              
              <button
                onClick={() => setShowSteps(!showSteps)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: showSteps ? 'linear-gradient(to right, #3b82f6, #2563eb)' : 'linear-gradient(to right, #6b7280, #4b5563)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  boxShadow: showSteps ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  minHeight: '44px',
                  flex: '1 1 auto'
                }}
              >
                <span>{showSteps ? '👁️' : '🔍'}</span>
                {showSteps ? 'Hide Steps' : 'Show Steps'}
              </button>
            </div>
            
            {/* Hints Display */}
            {hints.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {hints.map((hint, index) => (
                    <div key={index} style={{
                      backgroundColor: '#111827',
                      borderRadius: '0.375rem',
                      padding: '0.75rem',
                      border: '1px solid #4b5563',
                      fontSize: '0.875rem',
                      color: '#d1d5db',
                      lineHeight: '1.4'
                    }}>
                      <span style={{ fontWeight: '600', color: '#f59e0b' }}>Hint {index + 1}:</span> {hint}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Step-by-Step Solution */}
            {showSteps && problem.steps && problem.steps.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ backgroundColor: '#111827', borderRadius: '0.375rem', padding: '1rem', border: '1px solid #4b5563' }}>
                  {problem.steps.map((step, index) => (
                    <div key={index} style={{ marginBottom: index < problem.steps!.length - 1 ? '0.75rem' : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '1.5rem', 
                          height: '1.5rem', 
                          backgroundColor: '#3b82f6', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          {index + 1}
                        </div>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: '#f3f4f6', 
                          lineHeight: '1.5', 
                          margin: 0 
                        }}>
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Answer Input */}
            <div style={{ marginBottom: '1rem' }}>
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
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#111827',
                  border: '1px solid #4b5563',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box' // Include padding and border in width calculation
                }}
                />
              </div>
              
            {/* Submit Button */}
              <button
              onClick={submitAnswer}
                disabled={!userAnswer || isSubmitting || (isCorrect === true)}
              style={{
                width: '100%',
                background: (!userAnswer || isSubmitting || (isCorrect === true)) ? 'linear-gradient(to right, #4b5563, #4b5563)' : 'linear-gradient(to right, #10b981, #059669)',
                color: 'white',
                fontWeight: '600',
                padding: '1rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: (!userAnswer || isSubmitting || (isCorrect === true)) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: (!userAnswer || isSubmitting || (isCorrect === true)) ? 'none' : '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    border: '2px solid white', 
                    borderTop: '2px solid transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></div>
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

        {/* Feedback Display */}
        {feedback && (
          <div style={{ 
            backgroundColor: '#1f2937', 
            borderRadius: '0.75rem', 
            border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`, 
            padding: '1.5rem',
            marginBottom: '1rem',
            boxShadow: `0 4px 6px -1px ${isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}` // conditional shadow
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              marginBottom: '1rem' 
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`
              }}>
                <span style={{ fontSize: '1.25rem' }}>
                  {isCorrect ? '✅' : '❌'}
                </span>
              </div>
              <div>
                <h4 style={{ 
                  fontSize: '1.125rem',
                  fontWeight: '600', 
                  color: isCorrect ? '#10b981' : '#ef4444',
                  margin: 0
                }}>
                  {isCorrect ? 'Excellent Work!' : 'Not Quite Right'}
                </h4>
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#9ca3af', 
                  margin: 0 
                }}>
                  {isCorrect ? 'You got it right!' : 'Let\'s try again'}
                </p>
              </div>
            </div>
            <div style={{
              backgroundColor: '#111827',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #4b5563' // inner border
            }}>
              <p style={{ 
                color: '#f3f4f6', 
                margin: 0, 
                lineHeight: '1.6',
                fontSize: '0.875rem'
              }}>
                {feedback}
              </p>
            </div>
          </div>
        )}
          </>
        )}

        {/* History View */}
        {currentView === 'history' && (
          <div>
            <div style={{ 
              backgroundColor: '#1f2937', 
              borderRadius: '0.75rem', 
              border: '1px solid #374151', 
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <span style={{ fontSize: '1.25rem' }}>📚</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: 0 }}>
                    Problem History
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                    Your recent problem attempts
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {problemHistory.map((item) => (
                <div key={item.id} style={{ 
                  backgroundColor: '#1f2937', 
                  borderRadius: '0.75rem', 
                  border: '1px solid #374151', 
                  padding: '1.5rem' 
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ 
                      fontSize: '1rem', 
                      color: '#f3f4f6', 
                      lineHeight: '1.6', 
                      margin: '0 0 0.75rem 0' 
                    }}>
                      {item.problem_text}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ 
                        backgroundColor: item.difficulty === 'easy' ? 'rgba(34, 197, 94, 0.2)' : item.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: item.difficulty === 'easy' ? '#22c55e' : item.difficulty === 'medium' ? '#f59e0b' : '#ef4444',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {item.difficulty}
                      </span>
                      <span style={{ 
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        color: '#3b82f6',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {item.problem_type}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      fontSize: '0.875rem', 
                      color: '#9ca3af' 
                    }}>
                      <span>Your answer: <strong style={{ color: 'white' }}>{item.user_answer}</strong></span>
                      <span>Correct: <strong style={{ color: 'white' }}>{item.correct_answer}</strong></span>
                      <span>Hints used: <strong style={{ color: '#f59e0b' }}>{item.hints_used}/{item.total_hints}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.is_correct ? (
                        <span style={{ 
                          color: '#22c55e', 
                          fontSize: '0.875rem', 
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          ✅ Correct
                        </span>
                      ) : (
                        <span style={{ 
                          color: '#ef4444', 
                          fontSize: '0.875rem', 
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          ❌ Incorrect
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {problemHistory.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem', 
                  color: '#9ca3af',
                  backgroundColor: '#1f2937',
                  borderRadius: '0.75rem',
                  border: '1px solid #374151'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                  <p style={{ fontSize: '1.125rem', margin: 0 }}>No problems attempted yet.</p>
                  <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>Start practicing to see your history here!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats View */}
        {currentView === 'stats' && (
          <div>
            <div style={{ 
              backgroundColor: '#1f2937', 
              borderRadius: '0.75rem', 
              border: '1px solid #374151', 
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <span style={{ fontSize: '1.25rem' }}>📊</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: 0 }}>
                    Your Statistics
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                    Track your learning progress
                  </p>
                </div>
              </div>
            </div>
            
            {/* Overall Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem', 
              marginBottom: '2rem' 
            }}>
              <div style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: '0.75rem', 
                border: '1px solid #374151', 
                padding: '2rem', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
                  {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                </div>
                <div style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: '600' }}>Accuracy Rate</div>
              </div>
              
              <div style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: '0.75rem', 
                border: '1px solid #374151', 
                padding: '2rem', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
                  {score.streak}
                </div>
                <div style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: '600' }}>Current Streak</div>
              </div>
              
              <div style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: '0.75rem', 
                border: '1px solid #374151', 
                padding: '2rem', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                  {score.total}
                </div>
                <div style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: '600' }}>Total Problems</div>
              </div>
            </div>
            
            {/* Achievement Badges */}
            <div style={{ 
              backgroundColor: '#1f2937', 
              borderRadius: '0.75rem', 
              border: '1px solid #374151', 
              padding: '1.5rem' 
            }}>
              <h4 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: 'white', 
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🏆 Achievements
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {score.total >= 1 && (
                  <div style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.2)', 
                    color: '#22c55e', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: '1px solid #22c55e'
                  }}>
                    🎯 First Problem
                  </div>
                )}
                {score.correct >= 5 && (
                  <div style={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                    color: '#3b82f6', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: '1px solid #3b82f6'
                  }}>
                    🧠 Quick Learner
                  </div>
                )}
                {score.streak >= 3 && (
                  <div style={{ 
                    backgroundColor: 'rgba(245, 158, 11, 0.2)', 
                    color: '#f59e0b', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: '1px solid #f59e0b'
                  }}>
                    🔥 Hot Streak
                  </div>
                )}
                {score.total >= 10 && (
                  <div style={{ 
                    backgroundColor: 'rgba(139, 92, 246, 0.2)', 
                    color: '#8b5cf6', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: '1px solid #8b5cf6'
                  }}>
                    🏆 Math Master
                  </div>
                )}
                {score.total === 0 && (
                  <div style={{ 
                    color: '#9ca3af', 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.875rem' 
                  }}>
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