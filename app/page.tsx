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
  const [hasSubmittedWrongAnswer, setHasSubmittedWrongAnswer] = useState(false)
  const [isGeneratingHint, setIsGeneratingHint] = useState(false)
  const [isRefreshingHistory, setIsRefreshingHistory] = useState(false)
  
  // navigation
  const [currentView, setCurrentView] = useState<'main' | 'history' | 'stats'>('main')
  const [problemHistory, setProblemHistory] = useState<ProblemHistory[]>([])

  // load problem history on component mount
  useEffect(() => {
    loadProblemHistory()
  }, [])

  // refresh history when switching to history view
  useEffect(() => {
    if (currentView === 'history') {
      loadProblemHistory()
    }
  }, [currentView])

  const loadProblemHistory = async () => {
    setIsRefreshingHistory(true)
    try {
      console.log('Loading problem history...') // Debug log
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getHistory' })
      })
      const data = await response.json()
      console.log('History data received:', data) // Debug log
      if (data.success) {
        setScore(data.score)
        setProblemHistory(data.history)
        console.log('History updated successfully') // Debug log
      } else {
        console.error('API returned error:', data.error)
      }
    } 
    catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setIsRefreshingHistory(false)
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
    setHasSubmittedWrongAnswer(false)
    setIsGeneratingHint(false)
    
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
        // Track if user submitted wrong answer to enable dynamic hints
        if (!data.isCorrect) {
          setHasSubmittedWrongAnswer(true)
        }
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
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff', 
      color: '#000000',
      fontFamily: 'system-ui, -apple-system, sans-serif' // system fonts
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#f8fafc', 
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            margin: 0,
            color: '#000000'
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
              background: currentView === 'main' ? 'linear-gradient(to right, #10b981, #059669)' : '#e5e7eb',
              color: currentView === 'main' ? 'white' : '#000000',
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
              background: currentView === 'history' ? 'linear-gradient(to right, #10b981, #059669)' : '#e5e7eb',
              color: currentView === 'history' ? 'white' : '#000000',
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
              background: currentView === 'stats' ? 'linear-gradient(to right, #10b981, #059669)' : '#e5e7eb',
              color: currentView === 'stats' ? 'white' : '#000000',
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
            backgroundColor: '#f8fafc', 
            borderRadius: '0.75rem', 
            padding: '1rem', 
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.25rem' }}>
              {score.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: '600' }}>
              Total Problems
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '0.75rem', 
            padding: '1rem', 
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.25rem' }}>
              {score.correct}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: '600' }}>
              Correct Answers
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '0.75rem', 
            padding: '1rem', 
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.25rem' }}>
              {score.streak}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: '600' }}>
              Current Streak
            </div>
          </div>
        </div>

        {/* Main Practice View */}
        {currentView === 'main' && (
          <>

        {/* Settings Card */}
        <div style={{ 
          backgroundColor: '#f8fafc', 
          borderRadius: '0.75rem', 
          border: '1px solid #e2e8f0', 
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            color: '#000000', 
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
                color: '#000000', 
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
                      background: selectedDifficulty === level ? 'linear-gradient(to right, #3b82f6, #2563eb)' : '#e5e7eb',
                      color: selectedDifficulty === level ? 'white' : '#000000',
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
                color: '#000000', 
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
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  color: '#000000',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  outline: 'none',
                  minHeight: '44px',
                  appearance: 'none', // Remove default arrow
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
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
              background: isGenerating ? 'linear-gradient(to right, #9ca3af, #6b7280)' : 'linear-gradient(to right, #10b981, #059669)',
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
                backgroundColor: '#f9fafb', 
                borderRadius: '0.75rem', 
                border: '1px solid #e2e8f0', 
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
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    Your Math Problem
                  </h3>
                  <p style={{ color: '#000000', fontSize: '0.75rem', margin: 0 }}>
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
              backgroundColor: '#ffffff', 
              borderRadius: '0.5rem', 
              padding: '1.5rem', 
              marginBottom: '1rem',
              border: '1px solid #d1d5db' // subtle border
            }}>
              <p style={{ 
                fontSize: '1.125rem', 
                color: '#000000', 
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
                disabled={!problem?.hints || currentHint >= (problem?.hints?.length || 0) || isGeneratingHint || isCorrect === true}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: (!problem?.hints || currentHint >= (problem?.hints?.length || 0) || isGeneratingHint || isCorrect === true) ? 'linear-gradient(to right, #9ca3af, #6b7280)' : 'linear-gradient(to right, #f59e0b, #d97706)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: (!problem?.hints || currentHint >= (problem?.hints?.length || 0) || isGeneratingHint || isCorrect === true) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  boxShadow: (!problem?.hints || currentHint >= (problem?.hints?.length || 0) || isGeneratingHint || isCorrect === true) ? 'none' : '0 2px 4px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.2s ease',
                  minHeight: '44px',
                  flex: '1 1 auto'
                }}
              >
                {isGeneratingHint ? (
                  <>
                    <div style={{ 
                      width: '1rem', 
                      height: '1rem', 
                      border: '2px solid white', 
                      borderTop: '2px solid transparent', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite' 
                    }}></div>
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
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: showSteps ? 'linear-gradient(to right, #3b82f6, #2563eb)' : 'linear-gradient(to right, #9ca3af, #6b7280)',
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
                      backgroundColor: '#ffffff',
                      borderRadius: '0.375rem',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem',
                      color: '#000000',
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
                <div style={{ backgroundColor: '#ffffff', borderRadius: '0.375rem', padding: '1rem', border: '1px solid #d1d5db' }}>
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
                          color: '#000000', 
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
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  color: '#000000',
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
                background: (!userAnswer || isSubmitting || (isCorrect === true)) ? 'linear-gradient(to right, #9ca3af, #6b7280)' : 'linear-gradient(to right, #10b981, #059669)',
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
            backgroundColor: '#f8fafc', 
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
                  color: '#000000', 
                  margin: 0 
                }}>
                  {isCorrect ? 'You got it right!' : 'Let\'s try again'}
                </p>
              </div>
            </div>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #d1d5db' // inner border
            }}>
              <p style={{ 
                color: '#000000', 
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
              backgroundColor: '#f9fafb', 
              borderRadius: '0.75rem', 
              border: '1px solid #e2e8f0', 
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#000000', margin: 0 }}>
                    Problem History
                  </h3>
                  <p style={{ color: '#000000', fontSize: '0.875rem', margin: 0 }}>
                    Your recent problem attempts
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {problemHistory.map((item) => (
                <div key={item.id} style={{ 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '0.75rem', 
                  border: '1px solid #e2e8f0', 
                  padding: '1.5rem' 
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ 
                      fontSize: '1rem', 
                      color: '#000000', 
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
                      color: '#000000' 
                    }}>
                      <span>Your answer: <strong style={{ color: '#000000' }}>{item.user_answer}</strong></span>
                      <span>Correct: <strong style={{ color: '#000000' }}>{item.correct_answer}</strong></span>
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
                  color: '#000000',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0'
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
              backgroundColor: '#f9fafb', 
              borderRadius: '0.75rem', 
              border: '1px solid #e2e8f0', 
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#000000', margin: 0 }}>
                    Your Statistics
                  </h3>
                  <p style={{ color: '#000000', fontSize: '0.875rem', margin: 0 }}>
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
                backgroundColor: '#f9fafb', 
                borderRadius: '0.75rem', 
                border: '1px solid #e2e8f0', 
                padding: '2rem', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
                  {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                </div>
                <div style={{ fontSize: '1rem', color: '#000000', fontWeight: '600' }}>Accuracy Rate</div>
              </div>
              
              <div style={{ 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.75rem', 
                border: '1px solid #e2e8f0', 
                padding: '2rem', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
                  {score.streak}
                </div>
                <div style={{ fontSize: '1rem', color: '#000000', fontWeight: '600' }}>Current Streak</div>
              </div>
              
              <div style={{ 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.75rem', 
                border: '1px solid #e2e8f0', 
                padding: '2rem', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                  {score.total}
                </div>
                <div style={{ fontSize: '1rem', color: '#000000', fontWeight: '600' }}>Total Problems</div>
              </div>
            </div>
            
            {/* Achievement Badges */}
            <div style={{ 
              backgroundColor: '#f9fafb', 
              borderRadius: '0.75rem', 
              border: '1px solid #e2e8f0', 
              padding: '1.5rem' 
            }}>
              <h4 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: '#000000', 
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🏆 Achievements
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {/* First Problem Achievement */}
                <div 
                  style={{ 
                    backgroundColor: score.total >= 1 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.1)', 
                    color: score.total >= 1 ? '#16a34a' : '#9ca3af', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: `2px solid ${score.total >= 1 ? '#22c55e' : '#d1d5db'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    opacity: score.total >= 1 ? 1 : 0.5,
                    transform: score.total >= 1 ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: score.total >= 1 ? '0 4px 12px rgba(34, 197, 94, 0.3)' : 'none'
                  }}
                  title={score.total >= 1 ? 'Completed! You solved your first math problem.' : 'Solve 1 math problem to unlock this achievement.'}
                >
                  🎯 First Problem
                </div>
                
                {/* Quick Learner Achievement */}
                <div 
                  style={{ 
                    backgroundColor: score.correct >= 5 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.1)', 
                    color: score.correct >= 5 ? '#2563eb' : '#9ca3af', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: `2px solid ${score.correct >= 5 ? '#3b82f6' : '#d1d5db'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    opacity: score.correct >= 5 ? 1 : 0.5,
                    transform: score.correct >= 5 ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: score.correct >= 5 ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                  title={score.correct >= 5 ? 'Completed! You\'ve solved 5 problems correctly.' : 'Solve 5 problems correctly to unlock this achievement.'}
                >
                  🧠 Quick Learner
                </div>
                
                {/* Hot Streak Achievement */}
                <div 
                  style={{ 
                    backgroundColor: score.streak >= 3 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(107, 114, 128, 0.1)', 
                    color: score.streak >= 3 ? '#d97706' : '#9ca3af', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: `2px solid ${score.streak >= 3 ? '#f59e0b' : '#d1d5db'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    opacity: score.streak >= 3 ? 1 : 0.5,
                    transform: score.streak >= 3 ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: score.streak >= 3 ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                  }}
                  title={score.streak >= 3 ? 'Completed! You have a streak of 3 correct answers.' : 'Get 3 correct answers in a row to unlock this achievement.'}
                >
                  🔥 Hot Streak
                </div>
                
                {/* Math Master Achievement */}
                <div 
                  style={{ 
                    backgroundColor: score.total >= 10 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(107, 114, 128, 0.1)', 
                    color: score.total >= 10 ? '#7c3aed' : '#9ca3af', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: `2px solid ${score.total >= 10 ? '#8b5cf6' : '#d1d5db'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    opacity: score.total >= 10 ? 1 : 0.5,
                    transform: score.total >= 10 ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: score.total >= 10 ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
                  }}
                  title={score.total >= 10 ? 'Completed! You\'ve solved 10 problems total.' : 'Solve 10 problems total to unlock this achievement.'}
                >
                  🏆 Math Master
                </div>
                
                {/* Perfect Score Achievement */}
                <div 
                  style={{ 
                    backgroundColor: score.total >= 5 && score.correct === score.total ? 'rgba(236, 72, 153, 0.3)' : 'rgba(107, 114, 128, 0.1)', 
                    color: score.total >= 5 && score.correct === score.total ? '#db2777' : '#9ca3af', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: `2px solid ${score.total >= 5 && score.correct === score.total ? '#ec4899' : '#d1d5db'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    opacity: score.total >= 5 && score.correct === score.total ? 1 : 0.5,
                    transform: score.total >= 5 && score.correct === score.total ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: score.total >= 5 && score.correct === score.total ? '0 4px 12px rgba(236, 72, 153, 0.3)' : 'none'
                  }}
                  title={score.total >= 5 && score.correct === score.total ? 'Completed! You have a perfect score!' : 'Solve 5+ problems with 100% accuracy to unlock this achievement.'}
                >
                  💯 Perfect Score
                </div>
                
                {/* Hint Master Achievement */}
                <div 
                  style={{ 
                    backgroundColor: score.total >= 3 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 114, 128, 0.1)', 
                    color: score.total >= 3 ? '#059669' : '#9ca3af', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: `2px solid ${score.total >= 3 ? '#10b981' : '#d1d5db'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    opacity: score.total >= 3 ? 1 : 0.5,
                    transform: score.total >= 3 ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: score.total >= 3 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                  }}
                  title={score.total >= 3 ? 'Completed! You\'ve used hints effectively.' : 'Solve 3+ problems using hints to unlock this achievement.'}
                >
                  💡 Hint Master
                </div>
                
                {/* Speed Demon Achievement */}
                <div 
                  style={{ 
                    backgroundColor: score.streak >= 5 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(107, 114, 128, 0.1)', 
                    color: score.streak >= 5 ? '#dc2626' : '#9ca3af', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: `2px solid ${score.streak >= 5 ? '#ef4444' : '#d1d5db'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    opacity: score.streak >= 5 ? 1 : 0.5,
                    transform: score.streak >= 5 ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: score.streak >= 5 ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
                  }}
                  title={score.streak >= 5 ? 'Completed! You have an amazing streak!' : 'Get 5 correct answers in a row to unlock this achievement.'}
                >
                  ⚡ Speed Demon
                </div>
                
                {/* Problem Solver Achievement */}
                <div 
                  style={{ 
                    backgroundColor: score.total >= 20 ? 'rgba(168, 85, 247, 0.3)' : 'rgba(107, 114, 128, 0.1)', 
                    color: score.total >= 20 ? '#9333ea' : '#9ca3af', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    border: `2px solid ${score.total >= 20 ? '#a855f7' : '#d1d5db'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    opacity: score.total >= 20 ? 1 : 0.5,
                    transform: score.total >= 20 ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: score.total >= 20 ? '0 4px 12px rgba(168, 85, 247, 0.3)' : 'none'
                  }}
                  title={score.total >= 20 ? 'Completed! You\'re a true problem solver!' : 'Solve 20 problems total to unlock this achievement.'}
                >
                  🧩 Problem Solver
                </div>
                
                {score.total === 0 && (
                  <div style={{ 
                    color: '#6b7280', 
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